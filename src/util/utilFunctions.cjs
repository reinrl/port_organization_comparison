const fs = require("fs");

function deepSortObject(obj) {
  if (Array.isArray(obj)) {
    return obj
      .map(deepSortObject)
      .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  } else if (obj && typeof obj === "object") {
    return Object.keys(obj)
      .sort((a, b) => a.localeCompare(b))
      .reduce((sortedObj, key) => {
        sortedObj[key] = deepSortObject(obj[key]);
        return sortedObj;
      }, {});
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
      deepSortObject(sortedItem),
      keysToExclude
    );
    return filteredItem;
  });
}

function removeKeysRecursively(obj, keysToExclude) {
  if (Array.isArray(obj)) {
    return obj.map((item) => removeKeysRecursively(item, keysToExclude));
  } else if (obj && typeof obj === "object") {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      if (!keysToExclude.includes(key)) {
        acc[key] = removeKeysRecursively(value, keysToExclude);
      }
      return acc;
    }, {});
  }
  return obj;
}

module.exports = {
  deepSortObject,
  listFiles,
  sortArrayOfItems,
};
