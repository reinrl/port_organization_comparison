Create one `.cjs` file per environment (Port organization). It should follow this format:

```js
const portConfig = {
  clientId: "string",
  clientSecret:
    "string",
  envName: "source" | "dest",
  portDomain: "https://api.port.io/v1" | "https://api.us.port.io/v1",
};

module.exports = portConfig;
```