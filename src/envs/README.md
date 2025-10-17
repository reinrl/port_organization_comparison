Create one `.json` file per environment (Port organization). It should follow this format:

```json
{
  "clientId": "string",
  "clientSecret": "string",
  "envName": "source" | "dest",
  "portDomain": "https://api.port.io/v1" | "https://api.us.port.io/v1",
  "portWebDomain": "https://app.port.io/" | "https://app.us.port.io/"
}
```
