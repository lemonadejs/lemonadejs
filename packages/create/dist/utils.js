const path = require("path");
const fs = require("fs/promises");

const copyDir = async (from, to) => {
  const directoryEntries = await fs.readdir(from, {
    withFileTypes: true,
  });

  await Promise.all(
    directoryEntries.map(async (directoryEntry) => {
      if (directoryEntry.isDirectory()) {
        const subDir = path.join(to, directoryEntry.name);

        await fs.mkdir(subDir);

        return copyDir(path.join(from, directoryEntry.name), subDir);
      }

      return fs.copyFile(
        path.join(from, directoryEntry.name),
        path.join(to, directoryEntry.name)
      );
    })
  );
};

module.exports = { copyDir };
