/**
 * @fileoverview Defines keys to exclude when comparing items across environments
 * @module keysToExclude
 * 
 * @description
 * This module exports an array of property names that should be excluded when 
 * comparing objects across different environments. These are typically metadata
 * properties that are expected to differ between environments and shouldn't
 * trigger comparison differences.
 * 
 * @typedef {string[]} KeysToExclude
 * @constant
 * @type {KeysToExclude}
 * 
 * @example
 * // Import the keys to exclude
 * const KEYS_TO_EXCLUDE = require('./config/keysToExclude.cjs');
 * 
 * // Use when comparing objects
 * function compareObjects(obj1, obj2) {
 *   // Filter out the keys to exclude before comparison
 *   // ...
 * }
 */
// These are the keys that we want to ignore when comparing items across environments
const KEYS_TO_EXCLUDE = [
  "createdAt",
  "createdBy",
  "id",
  "updatedAt",
  "updatedBy",
];

module.exports = KEYS_TO_EXCLUDE;
