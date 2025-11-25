const fs = require("fs");
const path = require("path");

// Constants for widget types
const WIDGET_TYPES = {
  TABLE_ENTITIES_EXPLORER: "table-entities-explorer",
  TABLE_ENTITIES_EXPLORER_BY_DIRECTION: "table-entities-explorer-by-direction",
  GRAPH_ENTITIES_EXPLORER: "graph-entities-explorer",
  DASHBOARD_WIDGET: "dashboard-widget",
  GROUPER: "grouper",
  RUNS_TABLE: "runs-table",
  TABLE_AUDIT_LOG: "table-audit-log",
};

// Constants for violation types
const VIOLATION_TYPES = {
  INVALID_PROPERTY: "invalid_property",
  MISSING_BLUEPRINT: "missing_blueprint",
  MISSING_RELATION: "missing_relation",
  MISSING_RELATION_TARGET_BLUEPRINT: "missing_relation_target_blueprint",
  COMPLEX_PROPERTY_PATH: "complex_property_path",
  AMBIGUOUS_BLUEPRINT_CONTEXT: "ambiguous_blueprint_context",
};

// Constants for location types
const LOCATION_TYPES = {
  DATASET_RULES: "dataset.rules",
  DATASET_RULES_RELATION: "dataset.rules.relation",
  DATASET_RULES_RELATED_TO: "dataset.rules.relatedTo",
  BLUEPRINT_CONFIG_FILTER: "blueprintConfig.filterSettings",
  BLUEPRINT_CONFIG_SORT: "blueprintConfig.sortSettings",
  BLUEPRINT_CONFIG_PROPERTIES: "blueprintConfig.propertiesSettings",
};

// Parse command-line arguments
const args = process.argv.slice(2);
const isVerbose = args.includes("--verbose");
const envFilter = args.find((arg) => arg.startsWith("--env="))?.split("=")[1];

// Output directory and file paths
const outputDir = path.join(__dirname, "output");
const logFilePath = path.join(outputDir, "page_validation_log.txt");
const resultsFilePath = path.join(outputDir, "page_validation_results.json");

// Log stream - initialized in main()
let logStream = null;

/**
 * Initializes the log stream
 * @returns {WritableStream} File write stream for logging
 */
function initializeLogStream() {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  return fs.createWriteStream(logFilePath, { flags: "w" });
}

/**
 * Custom logger function that logs to both console and file
 * @param {string} message - Message to log
 * @param {string} level - Log level: 'info', 'error', 'warning', 'verbose'
 */
function log(message, level = "info") {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

  // Log to file if stream is available (should be initialized in main)
  if (logStream) {
    logStream.write(formattedMessage + "\n");
  }

  // Log to console based on level and verbose flag
  if (level === "verbose") {
    if (isVerbose) {
      console.log(formattedMessage);
    }
  } else if (level === "error") {
    console.error(formattedMessage);
  } else if (level === "warning" || level === "info") {
    console.log(formattedMessage);
  }
}

/**
 * Discovers environment directories in the output folder
 * @returns {Promise<string[]>} Array of environment names
 */
async function discoverEnvironments() {
  try {
    const entries = await fs.promises.readdir(outputDir, {
      withFileTypes: true,
    });
    const environments = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);

    if (envFilter) {
      if (environments.includes(envFilter)) {
        return [envFilter];
      } else {
        throw new Error(
          `Environment "${envFilter}" not found in output directory. Available: ${environments.join(
            ", "
          )}`
        );
      }
    }

    return environments;
  } catch (error) {
    throw new Error(`Failed to discover environments: ${error.message}`);
  }
}

/**
 * Reads and parses a JSON file
 * @param {string} filePath - Path to JSON file
 * @returns {Promise<any>} Parsed JSON data
 */
async function readJsonFile(filePath) {
  try {
    const content = await fs.promises.readFile(filePath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to read/parse ${filePath}: ${error.message}`);
  }
}

/**
 * Helper function to add properties from an object to a Set
 * @param {Set} targetSet - Target Set to add properties to
 * @param {Object} sourceObject - Source object with properties
 */
function addPropertiesFromObject(targetSet, sourceObject) {
  if (sourceObject && typeof sourceObject === "object") {
    for (const key of Object.keys(sourceObject)) {
      targetSet.add(key);
    }
  }
}

/**
 * Builds a blueprint property registry for an environment
 * @param {Array} blueprints - Array of blueprint objects
 * @returns {Map} Map of blueprint ID to properties, relations, and schema info
 */
function buildBlueprintRegistry(blueprints) {
  if (!Array.isArray(blueprints)) {
    throw new Error("buildBlueprintRegistry: blueprints must be an array");
  }

  const registry = new Map();

  // Port meta-properties available on all entities
  const metaProperties = new Set([
    "$identifier",
    "$title",
    "$blueprint",
    "$icon",
    "$team",
    "$createdAt",
    "$updatedAt",
    "$createdBy",
    "$updatedBy",
    "$relations",
  ]);

  for (const blueprint of blueprints) {
    if (!blueprint || !blueprint.identifier) {
      log("Skipping blueprint without identifier", "warning");
      continue;
    }

    const properties = new Set(metaProperties);
    const relations = new Map();

    // Extract properties from various sources using helper function
    addPropertiesFromObject(properties, blueprint.schema?.properties);
    addPropertiesFromObject(properties, blueprint.calculationProperties);
    addPropertiesFromObject(properties, blueprint.mirrorProperties);
    addPropertiesFromObject(properties, blueprint.aggregationProperties);

    // Extract relations
    if (blueprint.relations && typeof blueprint.relations === "object") {
      Object.entries(blueprint.relations).forEach(
        ([relationName, relation]) => {
          if (relation && relation.target) {
            relations.set(relationName, relation.target);
          }
        }
      );
    }

    registry.set(blueprint.identifier, {
      properties,
      relations,
      title: blueprint.title || blueprint.identifier,
    });

    log(
      `Blueprint registered: ${blueprint.identifier} (${
        properties.size - metaProperties.size
      } properties, ${relations.size} relations)`,
      "verbose"
    );
  }

  return registry;
}

/**
 * Checks if a property contains template variables
 * @param {string} property - Property name to check
 * @returns {boolean} True if property contains templates
 */
function hasTemplateVariables(property) {
  return (
    typeof property === "string" &&
    (property.includes("{{") || property.includes("}}"))
  );
}

/**
 * Checks if a property path is complex (requires manual review)
 * @param {string} property - Property name to check
 * @returns {boolean} True if property is complex
 */
function isComplexPropertyPath(property) {
  if (typeof property !== "string") return false;
  // Check for JQ expressions or array notation (but not simple relation paths)
  return (
    property.includes("[") ||
    property.includes("]") ||
    (property.includes(".") && !property.startsWith("$relations."))
  );
}

/**
 * Validates a multi-hop relation path like $relations.rel1.rel2.property
 * @param {string} propertyPath - Full property path
 * @param {string} sourceBlueprintId - Starting blueprint ID
 * @param {Map} registry - Blueprint registry
 * @returns {Object} Validation result with success flag and error details
 */
function validateRelationPath(propertyPath, sourceBlueprintId, registry) {
  if (!propertyPath.startsWith("$relations.")) {
    return { success: false, error: "Not a relation path" };
  }

  const pathParts = propertyPath.split(".");
  // Remove "$relations" prefix
  pathParts.shift();

  if (pathParts.length < 2) {
    return {
      success: false,
      error: "Relation path must have at least relation name and property",
    };
  }

  let currentBlueprintId = sourceBlueprintId;
  const relationChain = [];

  // Traverse relation chain (all parts except the last one, which is the property)
  for (let i = 0; i < pathParts.length - 1; i++) {
    const relationName = pathParts[i];
    const blueprintData = registry.get(currentBlueprintId);

    if (!blueprintData) {
      return {
        success: false,
        error: `Blueprint "${currentBlueprintId}" not found in registry`,
        errorType: VIOLATION_TYPES.MISSING_BLUEPRINT,
        atStep: i,
      };
    }

    if (!blueprintData.relations.has(relationName)) {
      return {
        success: false,
        error: `Relation "${relationName}" does not exist on blueprint "${currentBlueprintId}"`,
        errorType: VIOLATION_TYPES.MISSING_RELATION,
        atStep: i,
        blueprintId: currentBlueprintId,
      };
    }

    const targetBlueprintId = blueprintData.relations.get(relationName);
    relationChain.push({ relation: relationName, target: targetBlueprintId });
    currentBlueprintId = targetBlueprintId;
  }

  // Validate the final property on the target blueprint
  const finalProperty = pathParts[pathParts.length - 1];
  const finalBlueprintData = registry.get(currentBlueprintId);

  if (!finalBlueprintData) {
    return {
      success: false,
      error: `Target blueprint "${currentBlueprintId}" not found in registry`,
      errorType: VIOLATION_TYPES.MISSING_RELATION_TARGET_BLUEPRINT,
      relationChain,
    };
  }

  if (!finalBlueprintData.properties.has(finalProperty)) {
    return {
      success: false,
      error: `Property "${finalProperty}" does not exist on blueprint "${currentBlueprintId}"`,
      errorType: VIOLATION_TYPES.INVALID_PROPERTY,
      targetBlueprintId: currentBlueprintId,
      relationChain,
    };
  }

  return {
    success: true,
    relationChain,
    targetBlueprintId: currentBlueprintId,
  };
}

/**
 * Validates a property reference against the blueprint registry
 * @param {string} property - Property name
 * @param {string} blueprintId - Blueprint ID
 * @param {Map} registry - Blueprint registry
 * @returns {Object} Validation result
 */
function validateProperty(property, blueprintId, registry) {
  // Input validation
  if (typeof property !== "string" || !property) {
    return {
      valid: false,
      violationType: VIOLATION_TYPES.INVALID_PROPERTY,
      message: "Property must be a non-empty string",
    };
  }

  if (typeof blueprintId !== "string" || !blueprintId) {
    return {
      valid: false,
      violationType: VIOLATION_TYPES.MISSING_BLUEPRINT,
      message: "Blueprint ID must be a non-empty string",
    };
  }

  // Skip template variables
  if (hasTemplateVariables(property)) {
    return { valid: true, skipped: true, reason: "template_variable" };
  }

  // Check for complex paths that need manual review
  if (isComplexPropertyPath(property)) {
    return {
      valid: false,
      warning: true,
      violationType: VIOLATION_TYPES.COMPLEX_PROPERTY_PATH,
      message: "Manual review needed for complex property path",
    };
  }

  // Handle relation paths
  if (property.startsWith("$relations.")) {
    const result = validateRelationPath(property, blueprintId, registry);
    if (result.success) {
      return { valid: true };
    } else {
      return {
        valid: false,
        violationType: result.errorType,
        message: result.error,
        details: result,
      };
    }
  }

  // Simple property validation
  const blueprintData = registry.get(blueprintId);
  if (!blueprintData) {
    return {
      valid: false,
      violationType: VIOLATION_TYPES.MISSING_BLUEPRINT,
      message: `Blueprint "${blueprintId}" not found in registry`,
    };
  }

  // Check if it's a property OR a relation (relations can be displayed in table widgets)
  if (
    !blueprintData.properties.has(property) &&
    !blueprintData.relations.has(property)
  ) {
    return {
      valid: false,
      violationType: VIOLATION_TYPES.INVALID_PROPERTY,
      message: `Property "${property}" does not exist on blueprint "${blueprintId}"`,
    };
  }

  return { valid: true };
}

/**
 * Extracts property references from dataset rules recursively
 * @param {Array} rules - Array of rule objects
 * @param {Map} registry - Blueprint registry
 * @param {string} contextBlueprintId - Current blueprint context
 * @param {number} nestingLevel - Current nesting level
 * @returns {Array} Array of property references with context
 */
function extractPropertiesFromRules(
  rules,
  registry,
  contextBlueprintId,
  nestingLevel = 0
) {
  const propertyRefs = [];

  if (!Array.isArray(rules)) return propertyRefs;
  if (!contextBlueprintId) return propertyRefs;

  for (const rule of rules) {
    // Handle nested rules with combinator
    if (rule.rules && Array.isArray(rule.rules)) {
      propertyRefs.push(
        ...extractPropertiesFromRules(
          rule.rules,
          registry,
          contextBlueprintId,
          nestingLevel + 1
        )
      );
      continue;
    }

    // Extract property from property-based rules
    if (rule.property) {
      propertyRefs.push({
        property: rule.property,
        blueprintId: contextBlueprintId,
        location: LOCATION_TYPES.DATASET_RULES,
        nestingLevel,
        rule,
      });
    }

    // Extract property from relation-based rules
    if (rule.relation && rule.targetProperty) {
      propertyRefs.push({
        property: rule.targetProperty,
        blueprintId: contextBlueprintId,
        location: LOCATION_TYPES.DATASET_RULES_RELATION,
        nestingLevel,
        rule,
      });
    }

    // Validate relatedTo operators
    if (rule.operator === "relatedTo" && rule.blueprint) {
      propertyRefs.push({
        relatedToValidation: true,
        sourceBlueprintId: contextBlueprintId,
        targetBlueprintId: rule.blueprint,
        location: LOCATION_TYPES.DATASET_RULES_RELATED_TO,
        nestingLevel,
        rule,
      });
    }
  }

  return propertyRefs;
}

/**
 * Extracts properties from blueprintConfig settings
 * @param {Object} blueprintConfig - Blueprint configuration object
 * @param {string} blueprintId - Blueprint ID
 * @returns {Array} Array of property references
 */
function extractPropertiesFromBlueprintConfig(blueprintConfig, blueprintId) {
  const propertyRefs = [];

  if (!blueprintConfig || typeof blueprintConfig !== "object")
    return propertyRefs;

  if (!blueprintId) return propertyRefs;

  // Extract from filterSettings
  if (blueprintConfig.filterSettings?.filterBy?.rules) {
    const filterProps = extractPropertiesFromRules(
      blueprintConfig.filterSettings.filterBy.rules,
      null,
      blueprintId,
      0
    );
    filterProps.forEach((prop) => {
      prop.location = LOCATION_TYPES.BLUEPRINT_CONFIG_FILTER;
    });
    propertyRefs.push(...filterProps);
  }

  // Extract from sortSettings
  if (
    blueprintConfig.sortSettings?.sortBy &&
    Array.isArray(blueprintConfig.sortSettings.sortBy)
  ) {
    blueprintConfig.sortSettings.sortBy.forEach((sortItem) => {
      if (sortItem && sortItem.property) {
        propertyRefs.push({
          property: sortItem.property,
          blueprintId,
          location: LOCATION_TYPES.BLUEPRINT_CONFIG_SORT,
        });
      }
    });
  }

  // Extract from propertiesSettings
  if (blueprintConfig.propertiesSettings) {
    const { order = [], shown = [] } = blueprintConfig.propertiesSettings;

    [...order, ...shown].forEach((property) => {
      if (property && typeof property === "string") {
        propertyRefs.push({
          property,
          blueprintId,
          location: LOCATION_TYPES.BLUEPRINT_CONFIG_PROPERTIES,
        });
      }
    });
  }

  return propertyRefs;
}

/**
 * Extracts property references from a widget based on its type
 * @param {Object} widget - Widget object
 * @param {Map} registry - Blueprint registry
 * @param {string} pageId - Page identifier
 * @returns {Object} Extracted properties and validation issues
 */
function extractPropertiesFromWidget(widget, registry, pageId) {
  const propertyRefs = [];
  const issues = [];

  if (!widget || typeof widget !== "object") return { propertyRefs, issues };

  log(
    `Processing widget: ${widget.id} (type: ${widget.type}) on page: ${pageId}`,
    "verbose"
  );

  // Track widget context for all property references
  const widgetContext = {
    widgetId: widget.id,
    widgetType: widget.type,
    widgetTitle: widget.title || "Untitled Widget",
  };

  // Determine blueprint context
  let blueprintContext = null;
  const blueprintConfigs = [];

  if (widget.blueprint) {
    blueprintContext = widget.blueprint;
    blueprintConfigs.push(widget.blueprint);
  }

  if (widget.blueprintConfig && typeof widget.blueprintConfig === "object") {
    const configBlueprintIds = Object.keys(widget.blueprintConfig);
    blueprintConfigs.push(...configBlueprintIds);
  }

  // Handle widget types with query.blueprint
  if (
    (widget.type === WIDGET_TYPES.RUNS_TABLE ||
      widget.type === WIDGET_TYPES.TABLE_AUDIT_LOG) &&
    widget.query?.blueprint
  ) {
    blueprintContext = widget.query.blueprint;
    if (!hasTemplateVariables(widget.query.blueprint)) {
      blueprintConfigs.push(widget.query.blueprint);
    }
  }

  // Extract from dataset (for entity explorer widgets)
  if (
    widget.dataset &&
    (widget.type === WIDGET_TYPES.TABLE_ENTITIES_EXPLORER ||
      widget.type === WIDGET_TYPES.TABLE_ENTITIES_EXPLORER_BY_DIRECTION ||
      widget.type === WIDGET_TYPES.GRAPH_ENTITIES_EXPLORER)
  ) {
    // Check for ambiguous blueprint context
    if (blueprintConfigs.length > 1 && !blueprintContext) {
      // Check if dataset specifies blueprint in rules
      const datasetSpecifiesBlueprint = widget.dataset.rules?.some(
        (rule) => rule.property === "$blueprint" || rule.blueprint
      );

      if (!datasetSpecifiesBlueprint) {
        issues.push({
          widgetId: widgetContext.widgetId,
          widgetType: widgetContext.widgetType,
          widgetTitle: widgetContext.widgetTitle,
          violationType: VIOLATION_TYPES.AMBIGUOUS_BLUEPRINT_CONTEXT,
          message: `Widget has multiple blueprint configurations (${blueprintConfigs.join(
            ", "
          )}) but dataset doesn't specify which blueprint applies`,
          blueprintIds: blueprintConfigs,
          location: "dataset",
        });
      }
    }

    // Try to extract blueprint from dataset rules if not already set
    if (!blueprintContext && widget.dataset.rules) {
      for (const rule of widget.dataset.rules) {
        if (rule.property === "$blueprint" && rule.value) {
          blueprintContext = rule.value;
          break;
        }
      }
    }

    // Extract properties from dataset rules
    if (widget.dataset.rules && blueprintContext) {
      const datasetProps = extractPropertiesFromRules(
        widget.dataset.rules,
        registry,
        blueprintContext,
        0
      );
      // Add widget context to each property reference
      datasetProps.forEach((prop) => {
        prop.widgetId = widgetContext.widgetId;
        prop.widgetType = widgetContext.widgetType;
        prop.widgetTitle = widgetContext.widgetTitle;
      });
      propertyRefs.push(...datasetProps);
    }
  }

  // Extract from blueprintConfig for each configured blueprint
  if (widget.blueprintConfig && typeof widget.blueprintConfig === "object") {
    Object.entries(widget.blueprintConfig).forEach(([blueprintId, config]) => {
      if (!config) return;
      const configProps = extractPropertiesFromBlueprintConfig(
        config,
        blueprintId
      );
      // Add widget context to each property reference
      configProps.forEach((prop) => {
        prop.widgetId = widgetContext.widgetId;
        prop.widgetType = widgetContext.widgetType;
        prop.widgetTitle = widgetContext.widgetTitle;
      });
      propertyRefs.push(...configProps);
    });
  }

  // Handle nested widgets in dashboard widgets
  if (
    widget.type === WIDGET_TYPES.DASHBOARD_WIDGET &&
    Array.isArray(widget.widgets)
  ) {
    widget.widgets.forEach((nestedWidget) => {
      if (!nestedWidget) return;
      const { propertyRefs: nestedProps, issues: nestedIssues } =
        extractPropertiesFromWidget(nestedWidget, registry, pageId);
      propertyRefs.push(...nestedProps);
      issues.push(...nestedIssues);
    });
  }

  // Handle nested widgets in grouper widgets
  if (widget.type === WIDGET_TYPES.GROUPER && Array.isArray(widget.groups)) {
    widget.groups.forEach((group) => {
      if (group && Array.isArray(group.widgets)) {
        group.widgets.forEach((nestedWidget) => {
          if (!nestedWidget) return;
          const { propertyRefs: nestedProps, issues: nestedIssues } =
            extractPropertiesFromWidget(nestedWidget, registry, pageId);
          propertyRefs.push(...nestedProps);
          issues.push(...nestedIssues);
        });
      }
    });
  }

  return { propertyRefs, issues };
}

/**
 * Recursively counts all widgets including nested ones
 * @param {Array} widgets - Array of widget objects
 * @returns {number} Total widget count
 */
function countAllWidgets(widgets) {
  if (!Array.isArray(widgets)) return 0;

  let count = 0;

  for (const widget of widgets) {
    if (!widget) continue;
    count++; // Count this widget

    // Count nested widgets in dashboard-widget
    if (
      widget.type === WIDGET_TYPES.DASHBOARD_WIDGET &&
      Array.isArray(widget.widgets)
    ) {
      count += countAllWidgets(widget.widgets);
    }

    // Count nested widgets in grouper
    if (widget.type === WIDGET_TYPES.GROUPER && Array.isArray(widget.groups)) {
      widget.groups.forEach((group) => {
        if (group && Array.isArray(group.widgets)) {
          count += countAllWidgets(group.widgets);
        }
      });
    }
  }

  return count;
}

/**
 * Validates all pages in an environment
 * @param {Array} pages - Array of page objects
 * @param {Map} registry - Blueprint registry
 * @returns {Object} Validation results
 */
function validatePages(pages, registry) {
  const results = {
    pages: {},
    summary: {
      totalPages: pages.length,
      pagesValidated: 0,
      pagesWithErrors: 0,
      pagesWithWarnings: 0,
      totalViolations: 0,
      totalWarnings: 0,
      violationsByType: {},
      warningsByType: {},
    },
  };

  for (const page of pages) {
    log(`Validating page: ${page.identifier} (${page.title})`, "verbose");

    const pageResult = {
      pageTitle: page.title || page.identifier,
      pageType: page.type || "unknown",
      widgetCount: countAllWidgets(page.widgets),
      violations: [],
      warnings: [],
    };

    if (!page.widgets || !Array.isArray(page.widgets)) {
      log(`Page ${page.identifier} has no widgets, skipping`, "verbose");
      results.pages[page.identifier] = pageResult;
      continue;
    }

    // Process each widget
    page.widgets.forEach((widget) => {
      const { propertyRefs, issues } = extractPropertiesFromWidget(
        widget,
        registry,
        page.identifier
      );

      // Add ambiguous context issues
      issues.forEach((issue) => {
        pageResult.violations.push({
          widgetId: issue.widgetId || widget.id,
          widgetType: issue.widgetType || widget.type,
          widgetTitle: issue.widgetTitle || widget.title || "Untitled Widget",
          ...issue,
        });
      });

      // Validate each property reference
      propertyRefs.forEach((propRef) => {
        // Handle relatedTo validation
        if (propRef.relatedToValidation) {
          // Check if target blueprint exists
          if (!registry.has(propRef.targetBlueprintId)) {
            pageResult.violations.push({
              widgetId: propRef.widgetId,
              widgetType: propRef.widgetType,
              widgetTitle: propRef.widgetTitle,
              blueprintIdentifier: propRef.sourceBlueprintId,
              invalidProperty: `relatedTo: ${propRef.targetBlueprintId}`,
              locationType: propRef.location,
              violationType: VIOLATION_TYPES.MISSING_BLUEPRINT,
              message: `Target blueprint "${propRef.targetBlueprintId}" in relatedTo operator not found in registry`,
              ruleNestingLevel: propRef.nestingLevel,
            });
            return;
          }

          // Check if relation exists on source blueprint
          const sourceBlueprintData = registry.get(propRef.sourceBlueprintId);
          if (sourceBlueprintData) {
            // For relatedTo, we need to check if there's a relation to the target blueprint
            let relationExists = false;
            for (const [
              relationName,
              targetId,
            ] of sourceBlueprintData.relations) {
              if (targetId === propRef.targetBlueprintId) {
                relationExists = true;
                break;
              }
            }

            if (!relationExists) {
              pageResult.violations.push({
                widgetId: propRef.widgetId,
                widgetType: propRef.widgetType,
                widgetTitle: propRef.widgetTitle,
                blueprintIdentifier: propRef.sourceBlueprintId,
                invalidProperty: `relatedTo: ${propRef.targetBlueprintId}`,
                locationType: propRef.location,
                violationType: VIOLATION_TYPES.MISSING_RELATION,
                message: `No relation from blueprint "${propRef.sourceBlueprintId}" to "${propRef.targetBlueprintId}" found`,
                ruleNestingLevel: propRef.nestingLevel,
              });
            }
          }
          return;
        }

        // Validate regular property
        const validation = validateProperty(
          propRef.property,
          propRef.blueprintId,
          registry
        );

        log(
          `Validating property "${propRef.property}" on blueprint "${
            propRef.blueprintId
          }" in ${propRef.location}: ${
            validation.valid ? "valid" : validation.violationType
          }`,
          "verbose"
        );

        if (!validation.valid) {
          const violation = {
            widgetId: propRef.widgetId,
            widgetType: propRef.widgetType,
            widgetTitle: propRef.widgetTitle,
            blueprintIdentifier: propRef.blueprintId,
            invalidProperty: propRef.property,
            locationType: propRef.location,
            violationType: validation.violationType,
            message: validation.message,
            ruleNestingLevel: propRef.nestingLevel,
          };

          if (validation.details) {
            violation.details = validation.details;
          }

          if (validation.warning) {
            pageResult.warnings.push(violation);
          } else {
            pageResult.violations.push(violation);
          }
        }
      });
    });

    // Update summary statistics
    results.summary.pagesValidated++;
    if (pageResult.violations.length > 0) {
      results.summary.pagesWithErrors++;
      results.summary.totalViolations += pageResult.violations.length;

      // Count by type
      pageResult.violations.forEach((v) => {
        results.summary.violationsByType[v.violationType] =
          (results.summary.violationsByType[v.violationType] || 0) + 1;
      });
    }

    if (pageResult.warnings.length > 0) {
      results.summary.pagesWithWarnings++;
      results.summary.totalWarnings += pageResult.warnings.length;

      // Count by type
      pageResult.warnings.forEach((w) => {
        results.summary.warningsByType[w.violationType] =
          (results.summary.warningsByType[w.violationType] || 0) + 1;
      });
    }

    if (pageResult.violations.length > 0 || pageResult.warnings.length > 0) {
      log(
        `Page ${page.identifier}: ${pageResult.violations.length} violations, ${pageResult.warnings.length} warnings`,
        "info"
      );
    }

    results.pages[page.identifier] = pageResult;
  }

  return results;
}

/**
 * Main validation function
 */
async function main() {
  try {
    // Initialize log stream at the start
    logStream = initializeLogStream();

    log("=== Page Validation Started ===", "info");
    log(
      `Command-line args: verbose=${isVerbose}, env=${envFilter || "all"}`,
      "info"
    );

    // Clear previous results
    if (fs.existsSync(resultsFilePath)) {
      await fs.promises.unlink(resultsFilePath);
    }

    // Discover environments
    const environments = await discoverEnvironments();
    log(
      `Discovered ${environments.length} environment(s): ${environments.join(
        ", "
      )}`,
      "info"
    );

    const finalResults = {
      generatedAt: new Date().toISOString(),
      commandLineArgs: {
        verbose: isVerbose,
        envFilter: envFilter || null,
      },
      environments: {},
    };

    // Process each environment sequentially
    for (const env of environments) {
      log(`\n=== Processing environment: ${env} ===`, "info");

      const blueprintsPath = path.join(outputDir, env, "Blueprints.json");
      const pagesPath = path.join(outputDir, env, "Pages.json");

      // Check if files exist
      if (!fs.existsSync(blueprintsPath)) {
        log(
          `Blueprints.json not found for environment "${env}", skipping`,
          "error"
        );
        continue;
      }

      if (!fs.existsSync(pagesPath)) {
        log(`Pages.json not found for environment "${env}", skipping`, "error");
        continue;
      }

      // Read data
      const blueprints = await readJsonFile(blueprintsPath);
      const pages = await readJsonFile(pagesPath);

      log(
        `Loaded ${blueprints.length} blueprints and ${pages.length} pages`,
        "info"
      );

      // Build blueprint registry
      const registry = buildBlueprintRegistry(blueprints);
      log(`Built registry with ${registry.size} blueprints`, "verbose");

      // Validate pages
      const validationResults = validatePages(pages, registry);

      finalResults.environments[env] = validationResults;

      // Log summary for this environment
      log(`\n--- Summary for ${env} ---`, "info");
      log(
        `Pages validated: ${validationResults.summary.pagesValidated}`,
        "info"
      );
      log(
        `Pages with errors: ${validationResults.summary.pagesWithErrors}`,
        "info"
      );
      log(
        `Pages with warnings: ${validationResults.summary.pagesWithWarnings}`,
        "info"
      );
      log(
        `Total violations: ${validationResults.summary.totalViolations}`,
        "info"
      );
      log(`Total warnings: ${validationResults.summary.totalWarnings}`, "info");

      if (Object.keys(validationResults.summary.violationsByType).length > 0) {
        log("Violations by type:", "info");
        Object.entries(validationResults.summary.violationsByType).forEach(
          ([type, count]) => {
            log(`  - ${type}: ${count}`, "info");
          }
        );
      }

      if (Object.keys(validationResults.summary.warningsByType).length > 0) {
        log("Warnings by type:", "info");
        Object.entries(validationResults.summary.warningsByType).forEach(
          ([type, count]) => {
            log(`  - ${type}: ${count}`, "info");
          }
        );
      }
    }

    // Write results to file
    await fs.promises.writeFile(
      resultsFilePath,
      JSON.stringify(finalResults, null, 2),
      "utf8"
    );
    log(`\nValidation results written to: ${resultsFilePath}`, "info");

    log("\n=== Page Validation Completed ===", "info");

    // Close log stream
    if (logStream) {
      logStream.end();
    }

    process.exit(0);
  } catch (error) {
    log(`Fatal error: ${error.message}`, "error");
    if (error.stack) {
      log(error.stack, "error");
    }

    // Close log stream
    if (logStream) {
      logStream.end();
    }

    process.exit(1);
  }
}

// Run the validation
main();
