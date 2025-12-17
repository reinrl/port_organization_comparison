require("win-ca"); // Automatically injects Windows root CAs into Node.js
const axios = require("axios");
const fs = require("fs");
const path = require("path");

// Create a writable stream for the log file
const outputDir = path.join(__dirname, "output");
const logFilePath = path.join(outputDir, "notification_update_log.txt");
let logStream;

// Define the 5 notification properties to update
const NOTIFICATION_PROPERTIES = [
  "feedback_notifications",
  "quarterly_survey_notifications",
  "release_notifications",
  "snippet_notifications",
  "tip_of_the_day_notifications",
];

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
 * Fetches all users from the _user blueprint
 * @param {Object} authConfig - Authentication configuration
 * @returns {Promise<Array>} Array of user entities
 */
async function fetchUsers(authConfig) {
  try {
    logToFileAndConsole("Fetching users from API...");

    const apiConfig = {
      method: "get",
      maxBodyLength: Infinity,
      url: `${authConfig.portDomain}/blueprints/_user/entities`,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${authConfig.accessToken}`,
      },
    };

    const responseData = await makeApiRequest(apiConfig);

    if (!responseData?.entities) {
      throw new Error("Invalid response format - missing entities array");
    }

    logToFileAndConsole(
      `Retrieved ${responseData.entities.length} users from API`
    );
    return responseData.entities;
  } catch (error) {
    logToFileAndConsole(`Error fetching users: ${error.message}`, true);
    throw error;
  }
}

/**
 * Filters users to find those needing notification updates
 * @param {Array} users - Array of all users
 * @returns {Array} Array of users that need notification property updates
 */
function findUsersNeedingNotificationUpdates(users) {
  logToFileAndConsole("Analyzing users for notification property updates...");

  const usersToUpdate = users.filter((user) => {
    // Only process Active and Invited users
    const status = user?.properties?.status;
    if (status !== "Active" && status !== "Invited") {
      return false;
    }

    // Check if any notification property is missing or set to "Off"
    const needsUpdate = NOTIFICATION_PROPERTIES.some((prop) => {
      const value = user?.properties?.[prop];
      return !value || value === "Off";
    });

    if (needsUpdate) {
      const missingOrOff = NOTIFICATION_PROPERTIES.filter((prop) => {
        const value = user?.properties?.[prop];
        return !value || value === "Off";
      });
      logToFileAndConsole(
        `User ${
          user.identifier
        } (${status}) needs updates for: ${missingOrOff.join(", ")}`
      );
    }

    return needsUpdate;
  });

  logToFileAndConsole(
    `Found ${usersToUpdate.length} user(s) needing notification updates`
  );
  return usersToUpdate;
}

/**
 * Saves user data to a backup file
 * @param {Array} users - Array of users to backup
 * @param {string} filename - Name of the backup file
 * @returns {Promise<void>}
 */
async function backupUsers(users, filename) {
  try {
    const backupFilePath = path.join(outputDir, filename);
    await fs.promises.writeFile(
      backupFilePath,
      JSON.stringify(users, null, 2),
      "utf8"
    );
    logToFileAndConsole(`User backup saved to: ${backupFilePath}`);
  } catch (error) {
    logToFileAndConsole(`Error saving user backup: ${error.message}`, true);
  }
}

/**
 * Updates user notification properties to "On"
 * @param {Array} users - Array of users to update
 * @param {Object} authConfig - Authentication configuration
 * @param {boolean} dryRun - If true, only log what would be updated without making API calls
 * @returns {Promise<Array>} Array of update results
 */
async function updateUserNotifications(users, authConfig, dryRun = false) {
  if (users.length === 0) {
    logToFileAndConsole("No users need notification updates");
    return [];
  }

  logToFileAndConsole(
    `Starting ${dryRun ? "DRY RUN " : ""}update process for ${
      users.length
    } user(s)...`
  );

  const updatePromises = users.map(async (user) => {
    try {
      const originalValues = {};
      const newValues = {};

      // Capture original values and set new values
      NOTIFICATION_PROPERTIES.forEach((prop) => {
        originalValues[prop] = user.properties?.[prop] || "Not set";
        newValues[prop] = "On";
      });

      logToFileAndConsole(
        `${dryRun ? "[DRY RUN] Would update" : "Updating"} user ${
          user.identifier
        }: Setting all notification properties to "On"`
      );

      if (dryRun) {
        return {
          identifier: user.identifier,
          status: user.properties.status,
          originalValues,
          newValues,
          success: true,
          dryRun: true,
        };
      }

      // Create a clean user object, removing read-only fields
      const cleanUser = { ...user };
      delete cleanUser.createdAt;
      delete cleanUser.createdBy;
      delete cleanUser.updatedAt;
      delete cleanUser.updatedBy;

      // Ensure properties object exists
      if (!cleanUser.properties) {
        cleanUser.properties = {};
      }

      // Set all notification properties to "On"
      NOTIFICATION_PROPERTIES.forEach((prop) => {
        cleanUser.properties[prop] = "On";
      });

      const updateConfig = {
        method: "put",
        maxBodyLength: Infinity,
        url: `${authConfig.portDomain}/blueprints/_user/entities/${user.identifier}`,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${authConfig.accessToken}`,
        },
        data: JSON.stringify(cleanUser),
      };

      logToFileAndConsole(
        `Sending PUT request to update user ${user.identifier}`
      );

      const updateResult = await makeApiRequest(updateConfig);

      logToFileAndConsole(`Successfully updated user: ${user.identifier}`);
      return {
        identifier: user.identifier,
        status: user.properties.status,
        originalValues,
        newValues,
        success: true,
        result: updateResult,
      };
    } catch (error) {
      logToFileAndConsole(
        `Error updating user ${user.identifier}: ${error.message}`,
        true
      );
      return {
        identifier: user.identifier,
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
      "notification_update_results.json"
    );
    const resultsData = {
      timestamp: new Date().toISOString(),
      totalProcessed: results.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      notificationProperties: NOTIFICATION_PROPERTIES,
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
      `Starting user notification update process${
        isDryRun ? " (DRY RUN MODE)" : ""
      }...`
    );
    logToFileAndConsole(
      `Target notification properties: ${NOTIFICATION_PROPERTIES.join(", ")}`
    );

    // Load destination configuration
    const portConfig = await loadDestinationConfig();

    // Get access token
    const authConfig = await fetchAccessToken(portConfig);

    // Fetch all users
    const users = await fetchUsers(authConfig);

    // Find users needing notification updates
    const usersToUpdate = findUsersNeedingNotificationUpdates(users);

    if (usersToUpdate.length === 0) {
      logToFileAndConsole(
        "✅ All Active and Invited users already have notification properties set to 'On'! No work to do."
      );
    } else {
      // Save before backup
      await backupUsers(usersToUpdate, "users_before_update.json");

      // Log what we found first
      logToFileAndConsole(
        `Found ${usersToUpdate.length} user(s) that need notification updates:`
      );
      usersToUpdate.forEach((user, index) => {
        const needsUpdate = NOTIFICATION_PROPERTIES.filter((prop) => {
          const value = user?.properties?.[prop];
          return !value || value === "Off";
        });
        logToFileAndConsole(
          `  ${index + 1}. ${user.identifier} (${
            user.properties.status
          }): ${needsUpdate.join(", ")}`
        );
      });

      if (isDryRun) {
        logToFileAndConsole(
          "DRY RUN MODE: No actual updates will be performed. Use without --dry-run to execute updates."
        );
      }

      // Update the user notifications
      const updateResults = await updateUserNotifications(
        usersToUpdate,
        authConfig,
        isDryRun
      );

      // If not a dry run, fetch updated users and save after backup
      if (!isDryRun) {
        logToFileAndConsole("Fetching updated user data for after backup...");
        const updatedUsers = await fetchUsers(authConfig);
        const updatedUsersToBackup = updatedUsers.filter((user) =>
          usersToUpdate.some((u) => u.identifier === user.identifier)
        );
        await backupUsers(updatedUsersToBackup, "users_after_update.json");
      }

      // Write results to file
      await writeUpdateResults(updateResults);

      // Summary
      const successCount = updateResults.filter((r) => r.success).length;
      logToFileAndConsole(
        `Process completed successfully: ${successCount}/${updateResults.length} users updated`
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
