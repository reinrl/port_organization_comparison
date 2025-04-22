// Add additional endpoints here as needed
module.exports = [
    { endpoint: "/actions", hasPermissions: true, variable: "actions" },
    { endpoint: "/blueprints", hasPermissions: true, variable: "blueprints" },
    { endpoint: "/integration", hasPermissions: false, variable: "integrations" },
    { endpoint: "/pages", hasPermissions: true, variable: "pages" },
    { endpoint: "/scorecards", hasPermissions: false, variable: "scorecards" },
  ];