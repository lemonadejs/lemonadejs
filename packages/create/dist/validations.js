const path = require("path");
const fs = require("fs");
const validatePackageName = require("validate-npm-package-name");
const chalk = require("chalk");

const projectDirectoryIsValid = (absoluteProjectPath) => {
  const projectName = path.basename(absoluteProjectPath);

  const packageNameValidationResult = validatePackageName(projectName);

  if (!packageNameValidationResult.validForNewPackages) {
    let errors = "";

    packageNameValidationResult.errors?.forEach((error) => {
      errors += `\n- ${error}`;
    });

    packageNameValidationResult.warnings?.forEach((warning) => {
      errors += `\n- ${warning}`;
    });

    console.error(
      chalk.bgRed.bold(" ERROR "),
      chalk.red.bold("The name ") +
        projectName +
        chalk.red.bold(
          " cannot be the name of the project due to npm's naming rules."
        )
    );

    console.error("");

    console.error("The broken rules are as follows:" + errors);

    process.exit(1);
  }

  if (fs.existsSync(absoluteProjectPath)) {
    console.error(
      chalk.bgRed.bold(" ERROR "),
      chalk.red.bold("You cannot create a new project to an existing folder")
    );
    process.exit(1);
  }
};

module.exports = {
  projectDirectoryIsValid,
};
