const cli = require('./cli');
const fs = require('fs');
const path = require('path');
const info = require('../package');

function showInfo() {
  console.log(`shamir-combine v${info.version}`);
  console.log('This tool combines a secret from shares using Shamir\'s Secret Sharing.');
}

function showUsage() {
  console.group('Usage:');
  console.log('shamir-combine [fileprefix] [-options]');
  console.groupEnd();
  console.log();
  console.group('Options');
  console.log('-dir dirname');
  console.log('   Looks for share files in a different directory than current working dir');
  console.log('-out [filename]');
  console.log('   Writes combined secret to file. If no filename is specified, fileprefix is used');
  console.log('   Does not print secret unless specified -print yes');
  console.log('-outdir dirname');
  console.log('   Stores output file in a different directory than current working dir');
  console.log('-overwrite yes');
  console.log('   Force overwrite output file if they already exist.');
  console.log('-print [yes]');
  console.log('   Forces printing secret to standard output when file output is specified');
  console.groupEnd();
  console.group('Example:');
  console.log('Assuming that two shares exist in files: mysecret-1 and mysecret-2.');
  console.log('Execute: shamir-combine mysecret');
  process.exit(1);
}

function showError(message, code = 1) {
  console.log(`Error: ${message}`);
  console.log('For help: shamir-combine -help');
  process.exit(code);
}

let params = {};
params.print = true;

/* Show usage on -help or invalid number of arguments */
if (cli.args.length > 1 || Object.keys(cli.opts).includes('help')) {
  showInfo();
  showUsage();
  process.exit(1);
}

/* Single argument means filename */
else if (cli.args.length === 1) {
  params.filePrefix = cli.args[0];
}

/* Shares directory option */
if (cli.hasOpt('dir')) {
  if (typeof cli.opts.dir === 'undefined') {
    showError('-dir requires specifying directory name of path');
  }
  params.dir = cli.opts.dir;
  try {
    if (fs.existsSync(params.dir) !== true) {
      showError(`Directory does not exist: ${params.dir}`);
    }
    if (fs.statSync(params.dir).isDirectory() === false) {
      showError(`-dir argument ${params.dir} is not a directory`);
    }
  } catch (err) {
    showError(`Filesystem error: ${err.message}`);
  }
}

/* Output directory option */
if (cli.hasOpt('outdir')) {
  if (typeof cli.opts.outdir === 'undefined') {
    showError('-outdir requires specifying directory name of path');
  }
  params.outDir = cli.opts.outdir;
  try {
    if (fs.existsSync(params.outDir) !== true) {
      showError(`Directory does not exist: ${params.outDir}`);
    }
    if (fs.statSync(params.outDir).isDirectory() === false) {
      showError(`-outdir argument ${params.outDir} is not a directory`);
    }
  } catch (err) {
    showError(`Filesystem error: ${err.message}`);
  }
}

/* Force files overwrite */
params.overwrite = false;
if (cli.hasOpt('overwrite')) {
  if (typeof cli.opts['overwrite'] !== 'string' || cli.opts.overwrite.toLowerCase() !== 'yes') {
    showError(`-overwrite ${cli.opts.overwrite} unrecognized. Expected "yes"`);
  } else {
    params.overwrite = true;
  }
}

/* Output option */
if (cli.hasOpt('out')) {
  if (typeof cli.opts['out'] === 'undefined') {
    if (typeof params.filePrefix === 'undefined') {
      showError('-out requires filename if no fileprefix was specified');
    } else {
      params.out = params.filePrefix
    }
  } else {
    params.out = cli.opts['out'];
  }
  if (params.outDir) {
    params.out = path.join(params.outDir, params.out);
  }
  params.print = false;

  if (params.overwrite !== true) {
    try {
      if (fs.existsSync(params.out)) {
        showError(`File ${params.out} already exists. To force overwrite use option -overwrite yes`);
      }
    } catch (err) {
      showError(`Filesystem error: ${err.message}`);
    }
  }
}

/* Print option */
if (cli.hasOpt('print')) {
  if (typeof cli.opts['print'] === 'undefined') {
    params.print = true;
  } else if (cli.opts['print'].toLowerCase() === 'yes') {
    params.print = true;
  } else {
    showError(`-print ${cli.opts.print} unrecognized. Expected "yes" or "clean"`);
  }
}

/* Search for share files */
if (params.filePrefix) {
  params.files = [];
  try {
    const files =
      fs.readdirSync(params.dir || './')
        .filter(name => name.match(new RegExp(`^${params.filePrefix}-[0-9]+$`)))
    ;
    if (files.length === 0) {
      showError(`No share files ${params.filePrefix}-X found`);
    }
    if (files.length === 1) {
      showError(`Only one share file ${files[0]} found. At least two shares are required for combine.`);
    }
    for (let fileName of files) {
      if (params.dir) {
        fileName = path.join(params.dir, fileName);
      }
      if (fs.statSync(fileName).isDirectory() === true) {
        showError(`${fileName} is not a directory, file expected`);
      }
      params.files.push(fileName);
    }
  } catch (err) {
    showError(`Filesystem error: ${err.message}`);
  }
}

module.exports = params;