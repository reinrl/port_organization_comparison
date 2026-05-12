// npm run update-blueprint-entities -- --dry-run

require("win-ca"); // Automatically injects Windows root CAs into Node.js
const axios = require("axios");
const fs = require("fs");
const path = require("path");

// Create a writable stream for the log file
const outputDir = path.join(__dirname, "output");
const logFilePath = path.join(outputDir, "blueprint_entity_update_log.txt");
let logStream;

// ---------------------------------------------------------------------------
// Configuration — adjust these values to target a different blueprint or
// change the search/update criteria without modifying the rest of the script.
// ---------------------------------------------------------------------------

// The blueprint whose entities should be queried and updated
const BLUEPRINT_ID = "githubCopilotOrganizationUsageByIde";

// Search criteria: entities where SEARCH_PROPERTY exactly equals SEARCH_VALUE
const SEARCH_PROPERTY = "ide";
const SEARCH_VALUE = "VisualStudio";

// Update target: set UPDATE_PROPERTY to UPDATE_VALUE on each matching entity
const UPDATE_PROPERTY = "ide";
const UPDATE_VALUE = "visualstudio";

// ---------------------------------------------------------------------------

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
    //const configPath = path.join(__dirname, "envs", "source.json");
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
 * Searches for entities in the target blueprint matching the configured criteria
 * @param {Object} authConfig - Authentication configuration
 * @returns {Promise<Array>} Array of matching entities
 */
async function searchEntities(authConfig) {
  try {
    logToFileAndConsole(
      `Searching for entities in blueprint "${BLUEPRINT_ID}" where "${SEARCH_PROPERTY}" = "${SEARCH_VALUE}"...`
    );

    const searchBody = {
      combinator: "and",
      rules: [
        {
          property: "$blueprint",
          operator: "=",
          value: BLUEPRINT_ID,
        },
        {
          property: SEARCH_PROPERTY,
          operator: "=",
          value: SEARCH_VALUE,
        },
      ],
    };

    const apiConfig = {
      method: "post",
      maxBodyLength: Infinity,
      url: `${authConfig.portDomain}/entities/search`,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${authConfig.accessToken}`,
      },
      data: JSON.stringify(searchBody),
    };

    const responseData = await makeApiRequest(apiConfig);

    if (!responseData?.entities) {
      throw new Error("Invalid response format - missing entities array");
    }

    logToFileAndConsole(
      `Search returned ${responseData.entities.length} matching entity(s)`
    );
    return responseData.entities;
  } catch (error) {
    logToFileAndConsole(`Error searching entities: ${error.message}`, true);
    throw error;
  }
}

/**
 * Updates matching entities by PATCHing the configured property
 * @param {Array} entities - Array of entities to update
 * @param {Object} authConfig - Authentication configuration
 * @param {boolean} dryRun - If true, only log what would be updated without making API calls
 * @returns {Promise<Array>} Array of update results
 */
async function updateEntities(entities, authConfig, dryRun = false) {
  if (entities.length === 0) {
    logToFileAndConsole("No entities to update");
    return [];
  }

  logToFileAndConsole(
    `Starting ${dryRun ? "DRY RUN " : ""}update process for ${
      entities.length
    } entity(s)...`
  );

  const updatePromises = entities.map(async (entity) => {
    try {
      const originalValue = entity.properties?.[UPDATE_PROPERTY] ?? "Not set";

      logToFileAndConsole(
        `${dryRun ? "[DRY RUN] Would update" : "Updating"} entity ${
          entity.identifier
        }: "${UPDATE_PROPERTY}" "${originalValue}" -> "${UPDATE_VALUE}"`
      );

      if (dryRun) {
        return {
          identifier: entity.identifier,
          originalValue,
          newValue: UPDATE_VALUE,
          success: true,
          dryRun: true,
        };
      }

      const updateConfig = {
        method: "patch",
        maxBodyLength: Infinity,
        url: `${authConfig.portDomain}/blueprints/${BLUEPRINT_ID}/entities/${entity.identifier}`,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${authConfig.accessToken}`,
        },
        data: JSON.stringify({
          properties: {
            [UPDATE_PROPERTY]: UPDATE_VALUE,
          },
        }),
      };

      logToFileAndConsole(
        `Sending PATCH request to update entity ${entity.identifier}`
      );

      const updateResult = await makeApiRequest(updateConfig);

      logToFileAndConsole(`Successfully updated entity: ${entity.identifier}`);
      return {
        identifier: entity.identifier,
        originalValue,
        newValue: UPDATE_VALUE,
        success: true,
        result: updateResult,
      };
    } catch (error) {
      logToFileAndConsole(
        `Error updating entity ${entity.identifier}: ${error.message}`,
        true
      );
      return {
        identifier: entity.identifier,
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
      "blueprint_entity_update_results.json"
    );
    const resultsData = {
      timestamp: new Date().toISOString(),
      blueprintId: BLUEPRINT_ID,
      searchCriteria: { property: SEARCH_PROPERTY, value: SEARCH_VALUE },
      updateTarget: { property: UPDATE_PROPERTY, value: UPDATE_VALUE },
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
      `Starting blueprint entity update process${
        isDryRun ? " (DRY RUN MODE)" : ""
      }...`
    );
    logToFileAndConsole(`Blueprint: ${BLUEPRINT_ID}`);
    logToFileAndConsole(
      `Search criteria: "${SEARCH_PROPERTY}" = "${SEARCH_VALUE}"`
    );
    logToFileAndConsole(
      `Update target: "${UPDATE_PROPERTY}" -> "${UPDATE_VALUE}"`
    );

    // Load destination configuration
    const portConfig = await loadDestinationConfig();

    // Get access token
    const authConfig = await fetchAccessToken(portConfig);

    // Search for matching entities
    const matchingEntities = await searchEntities(authConfig);

    if (matchingEntities.length === 0) {
      logToFileAndConsole(
        `No entities found in blueprint "${BLUEPRINT_ID}" where "${SEARCH_PROPERTY}" = "${SEARCH_VALUE}". No work to do.`
      );
    } else {
      // Log what we found
      logToFileAndConsole(
        `Found ${matchingEntities.length} entity(s) to update:`
      );
      matchingEntities.forEach((entity, index) => {
        logToFileAndConsole(
          `  ${index + 1}. ${entity.identifier} (current "${UPDATE_PROPERTY}": "${
            entity.properties?.[UPDATE_PROPERTY] ?? "Not set"
          }")`
        );
      });

      if (isDryRun) {
        logToFileAndConsole(
          "DRY RUN MODE: No actual updates will be performed. Use without --dry-run to execute updates."
        );
      }

      // Update the entities
      const updateResults = await updateEntities(
        matchingEntities,
        authConfig,
        isDryRun
      );

      // Write results to file
      await writeUpdateResults(updateResults);

      // Summary
      const successCount = updateResults.filter((r) => r.success).length;
      logToFileAndConsole(
        `Process completed successfully: ${successCount}/${updateResults.length} entities updated`
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
