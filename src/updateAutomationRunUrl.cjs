require("win-ca"); // Automatically injects Windows root CAs into Node.js
const axios = require("axios");
const fs = require("fs");
const path = require("path");

// Create a writable stream for the log file
const outputDir = path.join(__dirname, "output");
const logFilePath = path.join(outputDir, "automation_update_log.txt");
let logStream;

/**
 * Custom logger function that logs to both console and file
 * @param {string} message - Message to log
 * @param {boolean} isError - Whether this is an error message
 */
function logToFileAndConsole(message, isError = false) {
  // Ensure the output directory exists before creating the log file
  if (!logStream) {
    // Create directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    logStream = fs.createWriteStream(logFilePath, { flags: "a" });
  }

  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] ${message}`;

  // Log to console
  if (isError) {
    console.error(formattedMessage);
  } else {
    console.log(formattedMessage);
  }

  // Log to file
  logStream.write(formattedMessage + "\n");
}

/**
 * Loads environment configuration for the destination environment
 * @returns {Promise<Object>} Environment configuration
 */
async function loadDestinationConfig() {
  try {
    const configPath = path.join(__dirname, "envs", "dest.json");
    const fileContent = await fs.promises.readFile(configPath, "utf8");
    const config = JSON.parse(fileContent);
    logToFileAndConsole(
      `Loaded configuration for environment: ${config.envName}`
    );
    return config;
  } catch (error) {
    logToFileAndConsole(
      `Error loading destination config: ${error.message}`,
      true
    );
    throw new Error(
      `Failed to load destination configuration: ${error.message}`
    );
  }
}

/**
 * Fetches access token for the destination environment
 * @param {Object} portConfig - Port configuration object
 * @returns {Promise<Object>} Object containing access token and domain
 */
async function fetchAccessToken(portConfig) {
  try {
    const accessTokenConfig = {
      method: "post",
      maxBodyLength: Infinity,
      url: `${portConfig.portDomain}/auth/access_token`,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      data: JSON.stringify({
        clientId: portConfig.clientId,
        clientSecret: portConfig.clientSecret,
      }),
    };

    logToFileAndConsole("Fetching access token...");
    const response = await axios.request(accessTokenConfig);

    if (!response.data?.accessToken) {
      throw new Error("Invalid response from access token API");
    }

    logToFileAndConsole("Access token retrieved successfully");
    return {
      accessToken: response.data.accessToken,
      portDomain: portConfig.portDomain,
    };
  } catch (error) {
    const errorMessage = `Failed to fetch access token: ${error.message}`;
    logToFileAndConsole(errorMessage, true);
    throw new Error(errorMessage);
  }
}

/**
 * Helper function to handle API requests with proper error handling
 * @param {Object} config - Axios request configuration
 * @returns {Promise<Object>} API response data
 */
async function makeApiRequest(config) {
  try {
    const response = await axios.request(config);
    return response.data;
  } catch (error) {
    const status = error.response?.status || "unknown";
    const responseData = error.response?.data || "No response data";
    const errorMsg = `API request failed with status ${status}: ${error.message}`;
    const detailedMsg = `${errorMsg}\nResponse data: ${JSON.stringify(
      responseData,
      null,
      2
    )}`;

    logToFileAndConsole(detailedMsg, true);

    // For 422 errors, also log the request data for debugging
    if (status === 422 && config.data) {
      logToFileAndConsole(
        `Request data that caused 422 error: ${config.data}`,
        true
      );
    }

    throw new Error(errorMsg);
  }
}

/**
 * Fetches all actions from the API
 * @param {Object} authConfig - Authentication configuration
 * @returns {Promise<Array>} Array of actions
 */
async function fetchActions(authConfig) {
  try {
    logToFileAndConsole("Fetching actions from API...");

    const apiConfig = {
      method: "get",
      maxBodyLength: Infinity,
      url: `${authConfig.portDomain}/actions`,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${authConfig.accessToken}`,
      },
    };

    const responseData = await makeApiRequest(apiConfig);

    if (!responseData?.actions) {
      throw new Error("Invalid response format - missing actions array");
    }

    logToFileAndConsole(
      `Retrieved ${responseData.actions.length} actions from API`
    );
    return responseData.actions;
  } catch (error) {
    logToFileAndConsole(`Error fetching actions: ${error.message}`, true);
    throw error;
  }
}

/**
 * Filters actions to find automations with incorrect run URLs
 * @param {Array} actions - Array of all actions
 * @param {Object} portConfig - Port configuration
 * @returns {Array} Array of automations that need URL correction
 */
function findAutomationsWithIncorrectUrls(actions, portConfig) {
  logToFileAndConsole(
    "Analyzing actions for automation run URL corrections..."
  );

  const automations = actions.filter((item) => {
    // Check if it's an automation with a run_url
    if (
      item?.trigger?.type !== "automation" ||
      !item?.invocationMethod?.mapping?.properties?.run_url
    ) {
      return false;
    }

    try {
      // Parse URLs to compare protocol and domain
      const runUrl = new URL(item.invocationMethod.mapping.properties.run_url);
      const portUrl = new URL(portConfig.portWebDomain);

      // Only include if protocol OR domain are different (need correction)
      const needsCorrection =
        runUrl.protocol !== portUrl.protocol || runUrl.host !== portUrl.host;

      if (needsCorrection) {
        logToFileAndConsole(
          `Found automation with incorrect URL - ${
            item.identifier
          }: ${runUrl.toString()} (should be ${portUrl.protocol}//${
            portUrl.host
          })`
        );
      }

      return needsCorrection;
    } catch (error) {
      // If URL parsing fails, exclude this item
      logToFileAndConsole(
        `Error parsing run_url for ${item.identifier}: ${error.message}`,
        true
      );
      return false;
    }
  });

  logToFileAndConsole(
    `Found ${automations.length} automation(s) with incorrect run URLs`
  );
  return automations;
}

/**
 * Updates automation run URLs to use the correct domain
 * @param {Array} automations - Array of automations to update
 * @param {Object} portConfig - Port configuration
 * @param {Object} authConfig - Authentication configuration
 * @param {boolean} dryRun - If true, only log what would be updated without making API calls
 * @returns {Promise<Array>} Array of update results
 */
async function updateAutomationUrls(
  automations,
  portConfig,
  authConfig,
  dryRun = false
) {
  if (automations.length === 0) {
    logToFileAndConsole("No automations need URL correction");
    return [];
  }

  logToFileAndConsole(
    `Starting ${dryRun ? "DRY RUN " : ""}update process for ${
      automations.length
    } automation(s)...`
  );

  const updatePromises = automations.map(async (action) => {
    try {
      const originalUrl = action.invocationMethod.mapping.properties.run_url;

      // Parse and correct the URL
      const url = new URL(originalUrl);
      const portUrl = new URL(portConfig.portWebDomain);

      // Update URL with correct protocol and domain
      url.protocol = portUrl.protocol;
      url.host = portUrl.host;

      logToFileAndConsole(
        `${dryRun ? "[DRY RUN] Would update" : "Updating"} ${
          action.identifier
        }: ${originalUrl} → ${url.toString()}`
      );

      if (dryRun) {
        return {
          identifier: action.identifier,
          originalUrl,
          newUrl: url.toString(),
          success: true,
          dryRun: true,
        };
      }

      // Create a clean action object, removing any read-only fields that might cause 422 errors
      const cleanAction = { ...action };

      // Remove potentially problematic fields that are often read-only or not allowed in updates
      delete cleanAction.id; // This was causing the 422 error
      delete cleanAction.createdAt;
      delete cleanAction.createdBy;
      delete cleanAction.updatedAt;
      delete cleanAction.updatedBy;

      // Update the run_url in the clean action
      cleanAction.invocationMethod.mapping.properties.run_url = url.toString();

      const updateConfig = {
        method: "put",
        maxBodyLength: Infinity,
        url: `${authConfig.portDomain}/actions/${action.identifier}`,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${authConfig.accessToken}`,
        },
        data: JSON.stringify(cleanAction),
      };

      logToFileAndConsole(
        `Sending PUT request to update action ${action.identifier}`
      );

      const updateResult = await makeApiRequest(updateConfig);

      logToFileAndConsole(
        `Successfully updated automation: ${action.identifier}`
      );
      return {
        identifier: action.identifier,
        originalUrl,
        newUrl: url.toString(),
        success: true,
        result: updateResult,
      };
    } catch (error) {
      logToFileAndConsole(
        `Error updating automation ${action.identifier}: ${error.message}`,
        true
      );
      return {
        identifier: action.identifier,
        success: false,
        error: error.message,
      };
    }
  });

  // Execute all updates in parallel
  const results = await Promise.all(updatePromises);

  const successCount = results.filter((r) => r.success).length;
  const failureCount = results.filter((r) => !r.success).length;

  logToFileAndConsole(
    `Update process completed: ${successCount} successful, ${failureCount} failed`
  );

  return results;
}

/**
 * Writes update results to a JSON file
 * @param {Array} results - Array of update results
 * @returns {Promise<void>}
 */
async function writeUpdateResults(results) {
  try {
    const resultsFilePath = path.join(
      outputDir,
      "automation_update_results.json"
    );
    const resultsData = {
      timestamp: new Date().toISOString(),
      totalProcessed: results.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results: results,
    };

    await fs.promises.writeFile(
      resultsFilePath,
      JSON.stringify(resultsData, null, 2),
      "utf8"
    );

    logToFileAndConsole(`Update results written to: ${resultsFilePath}`);
  } catch (error) {
    logToFileAndConsole(`Error writing update results: ${error.message}`, true);
  }
}

/**
 * Main application function
 */
(async () => {
  try {
    // Check for dry-run flag
    const isDryRun =
      process.argv.includes("--dry-run") || process.argv.includes("-d");

    logToFileAndConsole(
      `Starting automation run URL update process${
        isDryRun ? " (DRY RUN MODE)" : ""
      }...`
    );

    // Load destination configuration
    const portConfig = await loadDestinationConfig();

    // Get access token
    const authConfig = await fetchAccessToken(portConfig);

    // Fetch all actions
    const actions = await fetchActions(authConfig);

    // Find automations with incorrect URLs
    const automationsToUpdate = findAutomationsWithIncorrectUrls(
      actions,
      portConfig
    );

    if (automationsToUpdate.length === 0) {
      logToFileAndConsole(
        "✅ All automation run URLs are already correct! No work to do."
      );
    } else {
      // Log what we found first
      logToFileAndConsole(
        `Found ${automationsToUpdate.length} automation(s) that need URL correction:`
      );
      automationsToUpdate.forEach((automation, index) => {
        logToFileAndConsole(
          `  ${index + 1}. ${automation.identifier}: ${
            automation.invocationMethod.mapping.properties.run_url
          }`
        );
      });

      if (isDryRun) {
        logToFileAndConsole(
          "DRY RUN MODE: No actual updates will be performed. Use without --dry-run to execute updates."
        );
      }

      // Update the automation URLs
      const updateResults = await updateAutomationUrls(
        automationsToUpdate,
        portConfig,
        authConfig,
        isDryRun
      );

      // Write results to file
      await writeUpdateResults(updateResults);

      // Summary
      const successCount = updateResults.filter((r) => r.success).length;
      logToFileAndConsole(
        `Process completed successfully: ${successCount}/${updateResults.length} automations updated`
      );
    }
  } catch (error) {
    logToFileAndConsole(`Unhandled error: ${error.message}`, true);
    process.exit(1);
  } finally {
    // Ensure log stream is closed
    if (logStream) {
      logStream.end();
    }
  }
})();
