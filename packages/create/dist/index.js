#! /usr/bin/env node

const chalk = require("chalk");

process.on("unhandledRejection", (err) => {
  console.log("");
  console.error(
    chalk.bgRed.bold(" ERROR "),
    chalk.red.bold("Some unexpected error has occurred")
  );
  console.log(
    "Please, if possible, let us know what happened by creating an issue on github at https://github.com/lemonadejs/lemonadejs/issues."
  );

  console.log("");

  console.error(err);
});

const { program } = require("commander");
const { createProject } = require("./createProject");

program
  .argument(
    "<project-directory>",
    "directory where the project will be created"
  )
  .option("-t, --tests", "create basic structure for testing", false)
  .option(
    "-Y, --use-yarn",
    "if true, use yarn as package manager, otherwise use npm",
    false
  )
  .parse(process.argv);

(async () => {
  await createProject(program.args[0], program.opts());
})();
