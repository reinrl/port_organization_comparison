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
 *
 * @typedef {Object.<string, KeyConfig|undefined>} KeysToExclude
 */

/**
 * Keys to exclude when comparing items across environments.
 * If a key has an associated object with 'itemTypes', it only applies to those specific itemTypes.
 * ex: ownedByTeam: { itemTypes: ["Actions"] }
 * If a key has undefined as its value (not an object), it applies to all itemTypes.
 * ex: _id: undefined
 *
 * @type {KeysToExclude}
 */
const KEYS_TO_EXCLUDE = {
  _id: undefined,
  createdAt: undefined,
  createdBy: undefined,
  id: undefined,
  orgId: undefined, // expected to be different when comparing two different organizations/environments
  publish: undefined,
  updatedAt: undefined,
  updatedBy: undefined,
  ownedByTeam: { itemTypes: ["Actions"] },
};

/**
 * Helper function to check if a key should be excluded for a given itemType
 * @param {string} key - The key to check
 * @param {string} itemType - The itemType to check against
 * @returns {boolean} - Whether the key should be excluded
 */
function shouldExcludeKey(key, itemType) {
  const keyConfig = KEYS_TO_EXCLUDE[key];
  // If the key isn't in our exclusion list at all, don't exclude it
  if (keyConfig === undefined && !(key in KEYS_TO_EXCLUDE)) {
    return false;
  }

  // If the key is in our list but has no specific itemTypes, exclude for all types
  if (keyConfig === undefined) {
    return true;
  }

  // If the key has specific itemTypes, check if the current itemType is included
  return keyConfig.itemTypes && keyConfig.itemTypes.includes(itemType);
}

module.exports = {
  KEYS_TO_EXCLUDE,
  shouldExcludeKey,
};
