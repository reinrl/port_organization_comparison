/**
 * Data types configuration for API endpoints
 * Each object contains:
 * - endpoint: The API endpoint path
 * - hasPermissions: Whether this endpoint offers additional permission fetching
 * - variable: The variable name in the response data (may differ from the endpoint name - e.g., /integration versus integrations)
 */
const TYPES_OF_DATA = [
  { endpoint: "/actions", hasPermissions: true, variable: "actions" },
  { endpoint: "/blueprints", hasPermissions: true, variable: "blueprints" },
  { endpoint: "/integration", hasPermissions: false, variable: "integrations" },
  { endpoint: "/pages", hasPermissions: true, variable: "pages" },
  { endpoint: "/scorecards", hasPermissions: false, variable: "scorecards" },
];

module.exports = TYPES_OF_DATA;
