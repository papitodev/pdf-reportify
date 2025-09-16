#!/usr/bin/env node

const { generateTestReports } = require('./index');
const yargs = require('yargs');
const path = require('path');

// Corrected yargs syntax for modern versions
const argv = yargs(process.argv.slice(2))
  .option('path', {
    alias: 'p',
    description: 'The path to the screenshots directory.',
    type: 'string',
    demandOption: true,
  })
  .help()
  .alias('help', 'h')
  .argv;

const screenshotsPath = argv.path;

const absolutePath = path.resolve(screenshotsPath);

console.log(`\nStarting report generation from: ${absolutePath}\n`);

generateTestReports(absolutePath)
  .then(() => {
    console.log('\nReport generation completed successfully!');
  })
  .catch((err) => {
    console.error('\nA fatal error occurred during report generation:', err);
    process.exit(1);
  });