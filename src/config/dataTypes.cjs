/**
 * Data types configuration for API endpoints
 * Each object contains:
 * - endpoint: The API endpoint path
 * - hasPermissions: Whether this endpoint offers additional permission fetching
 * - variable: The variable name in the response data (may differ from the endpoint name - e.g., /integration versus integrations)
 */
const TYPES_OF_DATA = [
  { endpoint: "/actions", hasPermissions: true, variable: "actions", displayName: "Actions" },
  { endpoint: "/blueprints", hasPermissions: true, variable: "blueprints", displayName: "Blueprints" },
  { endpoint: "/integration", hasPermissions: false, variable: "integrations", displayName: "Integrations" },
  { endpoint: "/pages", hasPermissions: true, variable: "pages", displayName: "Pages" },
  { endpoint: "/scorecards", hasPermissions: false, variable: "scorecards", displayName: "Scorecards" },
  { endpoint: "/webhooks", hasPermissions: false, variable: "integrations", displayName: "Webhooks" },
];

module.exports = TYPES_OF_DATA;
