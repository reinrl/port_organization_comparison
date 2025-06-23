const fs = require("fs");

function deepSortObject(obj, keysToExclude = []) {
  if (Array.isArray(obj)) {
    const sortedArray = obj.map((item) => deepSortObject(item, keysToExclude));

    // Use sortArrayOfItems if all items are objects with "identifier"
    if (
      sortedArray.every(
        (item) =>
          item &&
          typeof item === "object" &&
          !Array.isArray(item) &&
          "identifier" in item
      )
    ) {
      return sortArrayOfItems(sortedArray, keysToExclude);
    }

    // Sort arrays of primitives
    if (
      sortedArray.every(
        (item) =>
          item === null || ["string", "number", "boolean"].includes(typeof item)
      )
    ) {
      return sortedArray.sort((a, b) => {
        if (typeof a === "string" && typeof b === "string") {
          return a.localeCompare(b);
        }
        return a < b ? -1 : a > b ? 1 : 0;
      });
    }

    return sortedArray;
  } else if (obj && typeof obj === "object") {
    const sortedObj = {};
    for (const key of Object.keys(obj).sort((a, b) => a.localeCompare(b))) {
      sortedObj[key] = deepSortObject(obj[key], keysToExclude);
    }
    return sortedObj;
  }

  return obj;
}

async function listFiles(directory) {
  const files = await fs.promises.readdir(directory, { withFileTypes: true });
  return files
    .filter((file) => file.isFile() && file.name.endsWith(".cjs"))
    .map((file) => file.name);
}

function sortArrayOfItems(items, keysToExclude) {
  const sortedItems = items.sort((a, b) =>
    a.identifier.localeCompare(b.identifier)
  );
  return sortedItems.map((sortedItem) => {
    const filteredItem = removeKeysRecursively(
      deepSortObject(sortedItem, keysToExclude),
      keysToExclude
    );
    return filteredItem;
  });
}

function removeKeysRecursively(obj, keysToExclude) {
  if (Array.isArray(obj)) {
    const cleanedArray = obj
      .map((item) => removeKeysRecursively(item, keysToExclude))
      .filter((item) => {
        // Remove empty arrays and empty objects
        if (Array.isArray(item)) return item.length > 0;
        if (item && typeof item === "object")
          return Object.keys(item).length > 0;
        return true;
      });
    return cleanedArray;
  } else if (obj && typeof obj === "object") {
    const cleanedObj = Object.entries(obj).reduce((acc, [key, value]) => {
      if (!keysToExclude.includes(key)) {
        const cleanedValue = removeKeysRecursively(value, keysToExclude);
        const isEmptyArray =
          Array.isArray(cleanedValue) && cleanedValue.length === 0;
        const isEmptyObject =
          cleanedValue &&
          typeof cleanedValue === "object" &&
          !Array.isArray(cleanedValue) &&
          Object.keys(cleanedValue).length === 0;

        if (!isEmptyArray && !isEmptyObject) {
          acc[key] = cleanedValue;
        }
      }
      return acc;
    }, {});
    return cleanedObj;
  }
  return obj;
}

module.exports = {
  deepSortObject,
  listFiles,
  sortArrayOfItems,
};
