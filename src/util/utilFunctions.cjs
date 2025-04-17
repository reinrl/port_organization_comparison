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
  return sortedItems.map((blueprint) => {
    const filteredItem = Object.fromEntries(
      Object.entries(deepSortObject(blueprint)).filter(
        ([key]) => !keysToExclude.includes(key)
      )
    );
    return filteredItem;
  });
}

module.exports = {
  deepSortObject,
  listFiles,
  sortArrayOfItems,
};
