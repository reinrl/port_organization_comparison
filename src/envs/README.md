Create one `.json` file per environment (Port organization). It should follow this format:

```json
{
  "clientId": "string",
  "clientSecret": "string",
  "envName": "string (unique identifier, e.g. dev / beta / prod)",
  "displayName": "string (optional; shown in the UI — falls back to envName if omitted)",
  "envSortOrder": "number (optional; controls display order and default selection — lowest first; omitted entries sort last)",
  "portDomain": "https://api.port.io/v1" | "https://api.us.port.io/v1",
  "portWebDomain": "https://app.port.io/" | "https://app.us.port.io/"
}
```

Files prefixed with `_` (e.g. `_example.json`) are ignored at startup and can be used as templates or archived configs.
