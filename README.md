# Compare Organizations

This repository can be used to retrieve the configuration data for a given [Port](getport.io) organization, as well as comparing that configuration data between organizations (such as when confirmed successful migration from one organization/environment to another).

## Getting Started

Clone the repository locally, and install dependencies:

```bash
npm install
```

Create one file per environment (Port organization). It should follow this format:

```js
// file: /src/envs/dev.js
const portConfig = {
  clientId: "string",
  clientSecret: "string",
  envName: "dev",
  portDomain: "https://api.port.io/v1" | "https://api.us.port.io/v1",
};

module.exports = portConfig;
```

To retrieve your clientId and clientSecret, open your [Port application}(https://app.port.io). Click on the "..." button in the top right corner, and select "Credentials". These values can be found on the "Organization" tab.

Execute the configuration data retrieval:

```bash
npm run start
```
