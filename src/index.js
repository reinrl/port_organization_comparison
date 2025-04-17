const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { listFiles, sortArrayOfItems } = require("./util/utilFunctions");

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

  // Add additional endpoints here as needed
  const dataTypes = [
    { endpoint: "/actions", variable: "actions" },
    { endpoint: "/blueprints", variable: "blueprints" },
    { endpoint: "/integration", variable: "integrations" },
    { endpoint: "/pages", variable: "pages" },
    { endpoint: "/scorecards", variable: "scorecards" },
  ];

  for (const { endpoint, variable } of dataTypes) {
    try {
      const response = await axios.request({
        method: "get",
        maxBodyLength: Infinity,
        url: `${baseReqConfig.portDomain}${endpoint}`,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${baseReqConfig.accessToken}`,
        },
      });

      dataToReturn[variable] = response.data[variable];
    } catch (error) {
      console.error(
        `Error fetching data from endpoint "${endpoint}" for ${envName}: ${error.message} (will not write ${variable}.json)`
      );
    }
  }

  return dataToReturn;
}

(async () => {
  try {
    // Clear out ./output directory of any contents
    const outputDir = path.join(__dirname, "..", "output");
    if (
      await fs.promises
        .access(outputDir)
        .then(() => true)
        .catch(() => false)
    ) {
      await fs.promises.rm(outputDir, { recursive: true, force: true });
    }
    await fs.promises.mkdir(outputDir, { recursive: true });

    // Get all of the environment configs
    const importedConfigs = await loadEnvironmentConfigs(envsDir);
    const environments = importedConfigs.map((config) => config.envName);

    // For each environment, retrieve the data and write it to a file
    await Promise.all(
      environments.map(async (env) => {
        try {
          const envDir = path.join(outputDir, env);
          await fs.promises.mkdir(envDir, { recursive: true });

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
            } catch (error) {
              console.error(
                `Error writing file for "${key}" in environment "${env}": ${error.message}`
              );
            }
          }
        } catch (error) {
          console.error(
            `Error processing environment "${env}":`,
            error.message
          );
        }
      })
    );
  } catch (error) {
    console.log(error);
  }
})();
