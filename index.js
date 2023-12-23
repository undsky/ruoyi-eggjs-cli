#!/usr/bin/env node

const program = require("commander");
const requireDir = require("require-dir");
const chalk = require("chalk");
const os = require("os");

requireDir("./libs");

program
  .version(require("./package").version, "-v --version")
  .description("🐽")
  .option("-i, --input [input...]", chalk.blue("输入"))
  .option(
    "-o, --output [output]",
    chalk.blue("输出"),
    `${os.homedir()}/Downloads`
  )
  .parse(process.argv);
