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

Assuming two configured environments (dev and prod), you should see the following file structure generated:

```
/port_organization_comparison
└── /output
    ├── /dev
    │   ├── actions.json
    │   ├── blueprints.json
    │   ├── integrations.json
    │   ├── pages.json
    │   └── scorecards.json
    └── /prod
        ├── actions.json
        ├── blueprints.json
        ├── integrations.json
        ├── pages.json
        └── scorecards.json
```

## Troubleshooting errors

If a given organization's clientId and/or clientSecret are not correct (or some other error occurs while attempting to retrieve an access token), you should see an error like the following:

```bash
$ npm run start

> port_organization_comparison@1.0.0 start
> node src/index.js

Error processing environment "dev": Failed to fetch access token for environment "dev":
```

If the request response is successfull retrieved, but does not contain the expected access token, you should see an error like the following:

```bash
$ npm run start

> port_organization_comparison@1.0.0 start
> node src/index.js

Error processing environment "dev": Invalid response from access token API
```

An error retrieving one of the specified data endpoints should result in an error like the following:

```bash
$ npm run start

> port_organization_comparison@1.0.0 start
> node src/index.js

Error fetching data from endpoint "/notgood" for "dev": Request failed with status code 404 (will not write integrations.json)
```

An incorrect variable configured for the response array to return:

```bash
$ npm run start

> port_organization_comparison@1.0.0 start
> node src/index.js

Error fetching data from endpoint "/notgood" for "dev": Incorrect response array variable name specified (will not write integration.json)
```

Any error encountered while processing the response from one of specified data endpoints should result in an error like the following:

```bash
$ npm run start

> port_organization_comparison@1.0.0 start
> node src/index.js

Error writing file for "notgood" in environment "dev": Cannot read properties of undefined (reading 'sort')
```
