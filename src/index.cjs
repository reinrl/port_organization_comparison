const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { listFiles, sortArrayOfItems } = require("./util/utilFunctions.cjs");
// Add additional endpoints here as needed
const TYPES_OF_DATA = require("./util/dataTypes.cjs");

// Create a writable stream for the log file
const logFilePath = path.join(__dirname, "output", "logging.txt");
let logStream;

// Custom logger function
function logToFileAndConsole(message, isError = false) {
  if (!logStream) {
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
const KEYS_TO_EXCLUDE = [
  "createdAt",
  "createdBy",
  "id",
  "updatedAt",
  "updatedBy",
];

// This is the directory where the environment configs are stored
const envsDir = path.join(__dirname, "envs");

async function loadEnvironmentConfigs(envsDir) {
  const envConfigFiles = await listFiles(envsDir);
  return envConfigFiles.map((file) => require(path.join(envsDir, file)));
}

async function fetchAccessToken(envName) {
  const importedConfigs = await loadEnvironmentConfigs(envsDir);

  let portConfig = importedConfigs.find((config) => config.envName === envName);
  // Nothing left to do...
  if (!portConfig) {
    throw new Error(`Configuration for environment "${envName}" not found.`);
  }

  let accessTokenConfig = {
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

  try {
    const response = await axios.request(accessTokenConfig);
    if (!response.data?.accessToken) {
      throw new Error("Invalid response from access token API");
    }
    return {
      accessToken: response.data.accessToken,
      portDomain: portConfig.portDomain,
    };
  } catch (error) {
    throw new Error(
      `Failed to fetch access token for environment "${envName}":`,
      error.message
    );
  }
}

async function fetchData(envName) {
  const baseReqConfig = await fetchAccessToken(envName);

  let dataToReturn = {};

  for (const { endpoint, hasPermissions, variable } of TYPES_OF_DATA) {
    try {
      const typeResponse = await axios.request({
        method: "get",
        maxBodyLength: Infinity,
        url: `${baseReqConfig.portDomain}${endpoint}`,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${baseReqConfig.accessToken}`,
        },
      });

      if (!typeResponse.data?.[variable]) {
        throw new Error("Incorrect response array variable name specified");
      }

      // Some items have permissions that we need to fetch
      if (hasPermissions) {
        let items = [];

        if (Array.isArray(typeResponse.data[variable])) {
          // Create an array of promises for each item's permission request
          const itemPromises = typeResponse.data[variable].map(async (item) => {
            try {
              const itemResponse = await axios.request({
                method: "get",
                maxBodyLength: Infinity,
                url: `${baseReqConfig.portDomain}${endpoint}/${item.identifier}/permissions`,
                headers: {
                  "Content-Type": "application/json",
                  Accept: "application/json",
                  Authorization: `Bearer ${baseReqConfig.accessToken}`,
                },
              });

              // Return the item with its associated permissions
              return {
                ...item,
                permissions: itemResponse.data.permissions,
              };
            } catch (error) {
              logToFileAndConsole(
                `Error fetching additional data for item ID "${item.identifier}" from endpoint "${baseReqConfig.portDomain}${endpoint}/${item.identifier}/permissions" in environment "${envName}": ${error.message}`,
                true
              );
              // Return item without permissions if request failed
              return item;
            }
          });

          // Wait for all promises to resolve in parallel
          items = await Promise.all(itemPromises);
        }

        // set the updated array (with permissions retrieved for each item)
        dataToReturn[variable] = items;
      } else {
        // No permissions to fetch, so just return the data as is
        dataToReturn[variable] = typeResponse.data[variable];
      }
    } catch (error) {
      logToFileAndConsole(
        `Error fetching data from endpoint "${endpoint}" for environment "${envName}": ${error.message} (will not write ${variable}.json)`,
        true
      );
    }
  }

  return dataToReturn;
}

(async () => {
  try {
    // Clear out ./output directory of any contents
    const outputDir = path.join(__dirname, "output");
    if (
      await fs.promises
        .access(outputDir)
        .then(() => true)
        .catch(() => false)
    ) {
      await fs.promises.rm(outputDir, { recursive: true, force: true });
    }
    await fs.promises.mkdir(outputDir, { recursive: true });

    // Close the log stream before deleting the directory
    await fs.promises
      .rm(outputDir, { recursive: true, force: true })
      .then(() => fs.promises.mkdir(outputDir, { recursive: true }))
      .then(() => {
        logToFileAndConsole("Output directory cleared and recreated.");
      })
      .catch((error) => {
        console.error(`Error clearing output directory: ${error.message}`);
      });

    // remove /util/configs.ts file if it exists
    const configTsFilePath = path.join(__dirname, "util", "configs.ts");
    if (
      await fs.promises
        .access(configTsFilePath)
        .then(() => true)
        .catch(() => false)
    ) {
      await fs.promises.rm(configTsFilePath, { force: true });
    }

    // Get all of the environment configs
    const importedConfigs = await loadEnvironmentConfigs(envsDir);
    const environments = importedConfigs.map((config) => config.envName);

    // Initialize a variable to hold the string contents of a file
    let fileContents = "";
    let exportables = [];

    // For each environment, retrieve the data and write it to a file
    await Promise.all(
      environments.map(async (env) => {
        try {
          const envDir = path.join(outputDir, env);
          await fs.promises.mkdir(envDir, { recursive: true });
          logToFileAndConsole(`Directory created: ${envDir}`);

          const data = await fetchData(env);

          // Write out a file for each type of data
          for (const [key, value] of Object.entries(data)) {
            try {
              const filePath = path.join(envDir, `${key}.json`);
              const deeplySortedData = sortArrayOfItems(value, KEYS_TO_EXCLUDE);

              await fs.promises.writeFile(
                filePath,
                JSON.stringify(deeplySortedData, null, 2),
                "utf-8"
              );
              logToFileAndConsole(`File written: ${filePath}`);
            } catch (error) {
              logToFileAndConsole(
                `Error writing file for "${key}" in environment "${env}": ${error.message}`,
                true
              );
            }
          }

          // Append to file contents with information about the environment
          for (const type of TYPES_OF_DATA) {
            fileContents += `import ${env}${type.variable} from "../output/${env}/${type.variable}.json";\n`;
          }
          fileContents += `\nconst ${env}Config = {\n`;
          for (const type of TYPES_OF_DATA) {
            fileContents += `\t${env}${type.variable},\n`;
          }
          fileContents += `};\n\n`;

          exportables.push(`${env}Config`);
        } catch (error) {
          logToFileAndConsole(
            `Error processing environment "${env}": ${error.message}`,
            true
          );
        }
      })
    );

    // Write out config file (for diff viewer to use)
    fileContents += `export { ${exportables.join(",")} };\n`;
    const configFilePath = path.join(__dirname, "util", "configs.ts");
    await fs.promises.writeFile(configFilePath, fileContents, "utf-8");

    logToFileAndConsole("Config file written successfully.");
  } catch (error) {
    logToFileAndConsole(`Unhandled error: ${error.message}`, true);
  }
})();
