require("win-ca"); // Automatically injects Windows root CAs into Node.js
const axios = require("axios");
const fs = require("node:fs");
const path = require("node:path");
const { listFiles, sortArrayOfItems } = require("./util/utilFunctions.cjs");
// Add additional endpoints here as needed
const TYPES_OF_DATA = require("./config/dataTypes.cjs");

// Create a writable stream for the log file
const outputDir = path.join(__dirname, "output");
const logFilePath = path.join(outputDir, "logging.txt");
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

// These are the keys that we want to ignore when comparing items across environments
const { KEYS_TO_EXCLUDE } = require("./config/keysToExclude.cjs");
const { spawn } = require("node:child_process");

// This is the directory where the environment configs are stored
const envsDir = path.join(__dirname, "envs");

/**
 * Loads environment configuration files
 * @param {string} envsDir - Directory containing environment configs
 * @returns {Promise<Array>} Array of environment configurations
 */
async function loadEnvironmentConfigs(envsDir) {
  try {
    const envConfigFiles = await listFiles(envsDir);
    const configs = [];
    for (const file of envConfigFiles) {
      // Skip files starting with underscore (templates/examples) and README
      if (file.startsWith("_") || file.toLowerCase() === "readme.md") {
        continue;
      }
      const filePath = path.join(envsDir, file);
      const fileContent = await fs.promises.readFile(filePath, "utf8");
      configs.push(JSON.parse(fileContent));
    }
    return configs;
  } catch (error) {
    logToFileAndConsole(
      `Error loading environment configs: ${error.message}`,
      true
    );
    throw new Error(
      `Failed to load environment configurations: ${error.message}`
    );
  }
}

/**
 * Fetches access token for a given environment
 * @param {string} envName - Environment name
 * @returns {Promise<Object>} Object containing access token and domain
 */
async function fetchAccessToken(envName) {
  try {
    const importedConfigs = await loadEnvironmentConfigs(envsDir);
    const portConfig = importedConfigs.find(
      (config) => config.envName === envName
    );

    if (!portConfig) {
      throw new Error(`Configuration for environment "${envName}" not found.`);
    }

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

    const response = await axios.request(accessTokenConfig);

    if (!response.data?.accessToken) {
      throw new Error("Invalid response from access token API");
    }

    return {
      accessToken: response.data.accessToken,
      portDomain: portConfig.portDomain,
    };
  } catch (error) {
    const errorMessage = `Failed to fetch access token for environment "${envName}": ${error.message}`;
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
    const errorMsg = `API request failed with status ${status}: ${error.message}`;
    logToFileAndConsole(errorMsg, true);
    throw new Error(errorMsg);
  }
}

/**
 * Writes data to a file using streams for better performance
 * @param {string} filePath - Path to write file
 * @param {Object|string} data - Data to write (object or string)
 * @returns {Promise<void>}
 */
function writeToFileStream(filePath, data) {
  return new Promise((resolve, reject) => {
    try {
      const fileStream = fs.createWriteStream(filePath, { flags: "w" });
      // Determine if we're writing JSON or raw text
      const content =
        typeof data === "string" ? data : JSON.stringify(data, null, 2);

      fileStream.on("error", (err) => {
        reject(new Error(`Error writing to file ${filePath}: ${err.message}`));
      });

      fileStream.on("finish", () => {
        logToFileAndConsole(`File written: ${filePath}`);
        resolve();
      });

      fileStream.write(content);
      fileStream.end();
    } catch (error) {
      reject(
        new Error(
          `Error creating write stream for ${filePath}: ${error.message}`
        )
      );
    }
  });
}

/**
 * Fetches data from API for a specific environment
 * @param {string} envName - Environment name
 * @returns {Promise<Object>} Object containing fetched data
 */
async function fetchData(envName) {
  const baseReqConfig = await fetchAccessToken(envName);
  let dataToReturn = {};

  // Use Promise.all to fetch data for all endpoints in parallel
  await Promise.all(
    TYPES_OF_DATA.map(
      async ({ endpoint, displayName, hasPermissions, variable }) => {
        try {
          const apiConfig = {
            method: "get",
            maxBodyLength: Infinity,
            url: `${baseReqConfig.portDomain}${endpoint}`,
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${baseReqConfig.accessToken}`,
            },
          };

          const typeResponseData = await makeApiRequest(apiConfig);

          if (!typeResponseData?.[variable]) {
            throw new Error("Incorrect response array variable name specified");
          }

          // Some items have permissions that we need to fetch
          if (hasPermissions) {
            let items = [];

            if (Array.isArray(typeResponseData[variable])) {
              // Create an array of promises for each item's permission request
              const itemPromises = typeResponseData[variable].map(
                async (item) => {
                  try {
                    const permissionConfig = {
                      method: "get",
                      maxBodyLength: Infinity,
                      url: `${baseReqConfig.portDomain}${endpoint}/${item.identifier}/permissions`,
                      headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        Authorization: `Bearer ${baseReqConfig.accessToken}`,
                      },
                    };

                    const permissionData = await makeApiRequest(
                      permissionConfig
                    );

                    // Enrich the returned item with its associated permissions
                    return {
                      ...item,
                      permissions: permissionData.permissions,
                    };
                  } catch (error) {
                    logToFileAndConsole(
                      `Error fetching permissions for item "${item.identifier}" in environment "${envName}": ${error.message}`,
                      true
                    );
                    // Return item without permissions if request failed
                    return item;
                  }
                }
              );

              // Wait for all promises to resolve in parallel
              items = await Promise.all(itemPromises);
            }

            // Set the updated array (with permissions retrieved for each item)
            dataToReturn[displayName] = items;
          } else {
            // No permissions to fetch, so just return the data as is
            dataToReturn[displayName] = typeResponseData[variable];
          }
        } catch (error) {
          logToFileAndConsole(
            `Error fetching data from endpoint "${endpoint}" for environment "${envName}": ${error.message} (will not write ${variable}.json)`,
            true
          );
        }
      }
    )
  );

  return dataToReturn;
}

/**
 * Cleans the output directory and creates it fresh
 * @returns {Promise<void>}
 */
async function prepareOutputDirectory() {
  try {
    // Close log stream if it exists
    if (logStream) {
      await new Promise((resolve) => {
        logStream.end(() => {
          logStream = null;
          resolve();
        });
      });
    }

    // Check if directory exists
    const dirExists = await fs.promises
      .access(outputDir)
      .then(() => true)
      .catch(() => false);

    if (dirExists) {
      await fs.promises.rm(outputDir, { recursive: true, force: true });
    }

    // Create fresh directory
    await fs.promises.mkdir(outputDir, { recursive: true });
    logToFileAndConsole("Output directory cleared and recreated.");

    // validate pages by spawning validatePages.cjs
    await new Promise((resolve, reject) => {
      const validateProcess = spawn("node", ["src/validatePages.cjs"]);

      validateProcess.stdout.on("data", (data) => {
        logToFileAndConsole(`validatePages.cjs: ${data}`);
      });

      validateProcess.stderr.on("data", (data) => {
        logToFileAndConsole(`validatePages.cjs error: ${data}`, true);
      });

      validateProcess.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`validatePages.cjs exited with code ${code}`));
        }
      });
    });

    return true;
  } catch (error) {
    logToFileAndConsole(
      `Error preparing output directory: ${error.message}`,
      true
    );
    return false;
  }
}

/**
 * Main application function
 */
(async () => {
  try {
    // Prepare output directory
    await prepareOutputDirectory();

    // Remove configs.ts file if it exists
    const configTsFilePath = path.join(__dirname, "util", "configs.ts");
    if (
      await fs.promises
        .access(configTsFilePath)
        .then(() => true)
        .catch(() => false)
    ) {
      await fs.promises.rm(configTsFilePath, { force: true });
    }

    // Get all environment configs
    const importedConfigs = await loadEnvironmentConfigs(envsDir);
    const environments = importedConfigs.map((config) => config.envName);

    // Process all environments in parallel and collect results
    const envResults = await Promise.all(
      environments.map(async (env) => {
        try {
          const envDir = path.join(outputDir, env);
          await fs.promises.mkdir(envDir, { recursive: true });
          logToFileAndConsole(`Directory created: ${envDir}`);

          const data = await fetchData(env);

          // Write data files using streams
          await Promise.all(
            Object.entries(data).map(async ([key, value]) => {
              try {
                const filePath = path.join(envDir, `${key}.json`);
                const deeplySortedData = sortArrayOfItems(
                  value,
                  KEYS_TO_EXCLUDE,
                  key // Pass the itemType (key) for proper filtering
                );
                await writeToFileStream(filePath, deeplySortedData);
              } catch (error) {
                logToFileAndConsole(
                  `Error writing file for "${key}" in environment "${env}": ${error.message}`,
                  true
                );
              }
            })
          );

          // Return the config content for this environment
          return { env, success: true };
        } catch (error) {
          logToFileAndConsole(
            `Error processing environment "${env}": ${error.message}`,
            true
          );
          return { env, success: false };
        }
      })
    );

    // Build configs file content sequentially after all data is fetched
    let fileContents = "";
    const exportables = [];

    for (const result of envResults) {
      if (result.success) {
        const env = result.env;

        // Add imports for this environment
        for (const type of TYPES_OF_DATA) {
          fileContents += `import ${env}${type.displayName} from "../output/${env}/${type.displayName}.json";\n`;
        }

        // Add config object
        fileContents += `\nconst ${env}Config = {\n`;
        for (const type of TYPES_OF_DATA) {
          fileContents += `\t${env}${type.displayName},\n`;
        }
        fileContents += `};\n\n`;

        exportables.push(`${env}Config`);
      }
    }

    // Write the config file using streams
    fileContents += `export { ${exportables.join(", ")} };\n`;
    await writeToFileStream(configTsFilePath, fileContents);

    logToFileAndConsole("Process completed successfully.");
  } catch (error) {
    logToFileAndConsole(`Unhandled error: ${error.message}`, true);
  } finally {
    // Ensure log stream is closed
    if (logStream) {
      logStream.end();
    }
  }
})();
