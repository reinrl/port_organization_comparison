# Compare Organizations

This repository can be used to retrieve the configuration data for a given [Port](getport.io) organization, as well as comparing that configuration data to another organization (such as when confirming successful migration from one organization/environment to another).

## Getting Started

Clone the repository locally, and install dependencies:

```bash
npm install
```

Create one `.cjs` file per environment (Port organization) for both the source and destination. It should follow this format:

```js
// file: /src/envs/dev.cjs
const portConfig = {
  clientId: "string",
  clientSecret: "string",
  envName: "source" | dest,
  portDomain: "https://api.port.io/v1" | "https://api.us.port.io/v1",
};

module.exports = portConfig;
```

To retrieve your clientId and clientSecret, open your [Port application}(https://app.port.io). Click on the "..." button in the top right corner, and select "Credentials". These values can be found on the "Organization" tab.

Execute the configuration data retrieval:

```bash
npm run dev
```

Assuming two configured environments (dev and prod), you should see the following file structure generated:

```
/port_organization_comparison
└── /output
    ├── /source
    │   ├── actions.json
    │   ├── blueprints.json
    │   ├── integrations.json
    │   ├── pages.json
    │   └── scorecards.json
    └── /dest
        ├── actions.json
        ├── blueprints.json
        ├── integrations.json
        ├── pages.json
        └── scorecards.json
```

## Troubleshooting configuration retrieval errors

If a given organization's clientId and/or clientSecret are not correct (or some other error occurs while attempting to retrieve an access token), you should see an error like the following:

```bash
$ npm run start

> port_organization_comparison@1.0.0 start
> node src/index.js

Error processing environment "source": Failed to fetch access token for environment "source":
```

If the request response is successfull retrieved, but does not contain the expected access token, you should see an error like the following:

```bash
$ npm run start

> port_organization_comparison@1.0.0 start
> node src/index.js

Error processing environment "source": Invalid response from access token API
```

An error retrieving one of the specified data endpoints should result in an error like the following:

```bash
$ npm run start

> port_organization_comparison@1.0.0 start
> node src/index.js

Error fetching data from endpoint "/notgood" for environment "source": Request failed with status code 404 (will not write integrations.json)
```

An incorrect variable configured for the response array to return:

```bash
$ npm run start

> port_organization_comparison@1.0.0 start
> node src/index.js

Error fetching data from endpoint "/notgood" for environment "source": Incorrect response array variable name specified (will not write integration.json)
```

Any error encountered while processing the response from one of specified data endpoints should result in an error like the following:

```bash
$ npm run start

> port_organization_comparison@1.0.0 start
> node src/index.js

Error writing file for "notgood" in environment "source": Cannot read properties of undefined (reading 'sort')
```
