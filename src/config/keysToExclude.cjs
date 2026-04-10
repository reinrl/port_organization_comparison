/**
 * @fileoverview Defines keys to exclude when comparing items across environments
 * @module keysToExclude
 *
 * @description
 * This module exports an object that defines property names that should be excluded when
 * comparing objects across different environments. These are typically metadata
 * properties that are expected to differ between environments and shouldn't
 * trigger comparison differences. Keys can be excluded for all item types or
 * only for specific item types.
 *
 * @example
 * // Import the keys to exclude and helper function
 * const { KEYS_TO_EXCLUDE, shouldExcludeKey } = require('./config/keysToExclude.cjs');
 *
 * // Use when comparing objects
 * function compareObjects(obj1, obj2, itemType) {
 *   // Filter out the keys to exclude before comparison
 *   const keys1 = Object.keys(obj1).filter(key => !shouldExcludeKey(key, itemType));
 *   // ...
 * }
 */
/**
 * Keys to exclude when comparing items across environments
 *
 * @typedef {Object} KeyConfig
 * @property {string[]} [itemTypes] - Array of itemTypes this key applies to. If undefined, applies to all itemTypes.
 * @property {boolean} [topLevelOnly] - If true, only exclude this key at the root level of each entity (depth 0).
 *                                      Use this for Port platform metadata fields (e.g. createdAt) that happen to
 *                                      share a name with user-defined blueprint schema properties.
 *
 * @typedef {Object.<string, KeyConfig|undefined>} KeysToExclude
 */

/**
 * Keys to exclude when comparing items across environments.
 * If a key has an associated object with 'itemTypes', it only applies to those specific itemTypes.
 * ex: ownedByTeam: { itemTypes: ["Actions"] }
 * If a key has undefined as its value (not an object), it applies to all itemTypes.
 * ex: _id: undefined
 * If a key has topLevelOnly: true, it is only excluded at the root of each entity (depth 0),
 * not at deeper nesting levels where the same name may be a user-defined property identifier.
 * ex: createdAt: { topLevelOnly: true }
 *
 * @type {KeysToExclude}
 */
const KEYS_TO_EXCLUDE = {
  _id: undefined,
  createdAt: { topLevelOnly: true },
  createdBy: { topLevelOnly: true },
  id: undefined,
  orgId: undefined, // expected to be different when comparing two different organizations/environments
  publish: undefined,
  updatedAt: { topLevelOnly: true },
  updatedBy: { topLevelOnly: true },
  ownedByTeam: { itemTypes: ["Actions"] },
};

/**
 * Helper function to check if a key should be excluded for a given itemType and depth
 * @param {string} key - The key to check
 * @param {string} itemType - The itemType to check against
 * @param {number} [depth=0] - Nesting depth of the key within the entity object (0 = root)
 * @returns {boolean} - Whether the key should be excluded
 */
function shouldExcludeKey(key, itemType, depth = 0) {
  const keyConfig = KEYS_TO_EXCLUDE[key];
  // If the key isn't in our exclusion list at all, don't exclude it
  if (keyConfig === undefined && !(key in KEYS_TO_EXCLUDE)) {
    return false;
  }

  // If the key is in our list but has no specific config, exclude for all types at all depths
  if (keyConfig === undefined) {
    return true;
  }

  // If topLevelOnly is set, only exclude at the root level of each entity
  if (keyConfig.topLevelOnly && depth !== 0) {
    return false;
  }

  // If the key has specific itemTypes, check if the current itemType is included
  if (keyConfig.itemTypes) {
    return keyConfig.itemTypes.includes(itemType);
  }

  // Config exists (e.g. topLevelOnly: true) but no itemTypes restriction — exclude for all types
  return true;
}

module.exports = {
  KEYS_TO_EXCLUDE,
  shouldExcludeKey,
};
