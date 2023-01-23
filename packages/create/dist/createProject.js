const path = require("path");
const crossSpawn = require("cross-spawn");
const fs = require("fs/promises");
const chalk = require("chalk");

const { projectDirectoryIsValid } = require("./validations");
const { copyDir } = require("./utils");

const createProject = async (projectDirectory, options) => {
  const absoluteProjectPath = path.resolve(projectDirectory);

  projectDirectoryIsValid(absoluteProjectPath);

  let firstDirectoryCreated;

  try {
    firstDirectoryCreated = await fs.mkdir(absoluteProjectPath, {
      recursive: true,
    });

    console.log("Getting base template");

    const projectName = path.basename(absoluteProjectPath);

    const packageJsonInitialSettings = {
      name: projectName,
      version: "0.0.0",
    };

    await fs.writeFile(
      path.join(absoluteProjectPath, "package.json"),
      JSON.stringify(packageJsonInitialSettings, undefined, 2)
    );

    let command;
    let argsToInstallTemplate = undefined;

    if (options.useYarn) {
      command = "yarn";

      argsToInstallTemplate = ["add", "--no-lockfile"];
    } else {
      command = "npm";

      argsToInstallTemplate = ["i", "--save=false"];
    }

    argsToInstallTemplate.push("@lemonadejs/template");

    const installTemplateCommandResult = crossSpawn.sync(
      command,
      argsToInstallTemplate,
      {
        cwd: absoluteProjectPath,
        stdio: "inherit",
      }
    );

    if (installTemplateCommandResult.status !== 0) {
      console.log("");
      console.error(
        chalk.bgRed.bold(" ERROR "),
        chalk.red.bold("Unable to get base project")
      );

      throw new Error();
    }

    const templateDir = path.dirname(
      require.resolve("@lemonadejs/template/template/package.json", {
        paths: [absoluteProjectPath],
      })
    );

    const templatePackageJsonPath = path.join(templateDir, "package.json");
    const templatePackageJson = require(templatePackageJsonPath);

    await fs.rm(templatePackageJsonPath);

    if (!options.tests) {
      await fs.rm(path.join(templateDir, "tests"), { recursive: true });

      delete templatePackageJson.scripts.tests;
    }

    await copyDir(path.join(templateDir), absoluteProjectPath);

    await fs.rm(path.join(absoluteProjectPath, "node_modules"), {
      recursive: true,
    });

    templatePackageJson.name = projectName;

    await fs.writeFile(
      path.join(absoluteProjectPath, "package.json"),
      JSON.stringify(templatePackageJson, null, 2)
    );

    console.log("");
    console.log("Installing template dependencies");

    let argsForInstallingDependencies;

    if (options.useYarn) {
      argsForInstallingDependencies = undefined;
    } else {
      argsForInstallingDependencies = ["i", "--save"];
    }

    const commandResult = crossSpawn.sync(
      command,
      argsForInstallingDependencies,
      {
        cwd: absoluteProjectPath,
        stdio: "inherit",
      }
    );

    if (commandResult.status !== 0) {
      console.log("");
      console.warn(
        chalk.bgYellow.bold(" WARNING "),
        chalk.yellow.bold("Unable to install dependencies")
      );

      console.warn(
        "Installation of project dependencies did not proceed correctly. You will have to do this step manually."
      );
    }

    console.log("");
    console.log(
      "Your new project has been created in the directory: " +
        absoluteProjectPath
    );
  } catch (err) {
    if (firstDirectoryCreated) {
      await fs
        .rm(firstDirectoryCreated, {
          recursive: true,
        })
        .catch(() => {
          console.log("");
          console.error(
            chalk.bgRed.bold(" ERROR "),
            chalk.red.bold(
              "Unable to remove the created files, please manually remove the folder "
            ) + firstDirectoryCreated
          );
        });
    }

    process.exit(1);
  }
};

module.exports = { createProject };
