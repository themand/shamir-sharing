const cli = require('./cli');
const fs = require('fs');
const info = require('../package');

function showInfo() {
  console.log(`shamir-split v${info.version}`);
  console.log('This tool splits a secret into N-of-M shares using Shamir\'s Secret Sharing.');
}

function showUsage() {
  console.group('Usage:');
  console.log('shamir-split [[threshold shares] filename] [-options]');
  console.groupEnd();
  console.log();
  console.group('Options');
  console.log('-out fileprefix');
  console.log('   Writes shares to files named fileprefix-N');
  console.log('   Does not print shares unless specified -print yes|clean');
  console.log('-outclean fileprefix');
  console.log('   Writes shares in clean/printable format to files named fileprefix-N');
  console.log('   Does not print shares unless specified -print yes|clean');
  console.log('-overwrite yes');
  console.log('   Force overwrite output files if they already exist.');
  console.log('   WARNING: It doesn\'t delete all old shares.');
  console.log('   If there are less shares than files matching fileprefix, some old share.');
  console.log('   files will remain, which might lead to confusion and data loss.');
  console.log('-print [yes|clean]');
  console.log('   Forces printing shares to standard output when file output is specified');
  console.groupEnd();
}

function showError(message, code = 1) {
  console.log(`Error: ${message}`);
  console.log('For help: shamir-split -help');
  process.exit(code);
}

let params = {};

/* Show usage on -help or invalid number of arguments */
if (cli.args.length > 3 || cli.args.length === 0 || Object.keys(cli.opts).includes('help')) {
  showInfo();
  showUsage();
  process.exit(1);
}

/* Single argument means filename */
else if (cli.args.length === 1) {
  params.filename = cli.args[0];
}

/* Extract arguments */
else {

  /* Threshold */
  params.threshold = parseInt(cli.args[0]);
  if (params.threshold.toString() !== cli.args[0]) {
    showError('Threshold should be an integer number');
  }
  if (params.threshold < 2) {
    showError('Threshold should be 2 or more');
  }
  if (params.threshold > 254) {
    showError('Threshold should be 254 or less');
  }

  /* Number of shares */
  params.shares = parseInt(cli.args[1]);
  if (params.shares.toString() !== cli.args[1]) {
    showError('Number of shares should be an integer number');
  }
  if (params.shares < 2) {
    showError('Number of shares should be 2 or more');
  }
  if (params.shares > 255) {
    showError('Shares should be 255 or less');
  }
  if (params.shares < params.threshold) {
    showError('Threshold cannot be bigger than number of shares');
  }

  /* Filename */
  if (typeof cli.args[2] !== 'undefined') {
    params.filename = cli.args[2];
  }
}

/* Validate file existence */
if (typeof params.filename !== 'undefined') {
  try {
    if (fs.existsSync(params.filename) !== true) {
      showError(`File does not exist: ${params.filename}`);
    }
    if (fs.statSync(params.filename).isDirectory()) {
      showError('I can only work on files, not directories');
    }
  } catch (err) {
    showError(`Filesystem error: ${err.message}`);
  }
}

params.print = true;
params.cleanPrint = false;
params.overwrite = false;

/* Force files overwrite */
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
    showError('-out requires filename prefix');
  }
  params.out = cli.opts['out'];
  params.print = false;

  if (params.overwrite !== true) {
    for (let i = 1; i <= params.shares; i++) {
      let checkFilename = `${params.out}-${i}`;
      try {
        if (fs.existsSync(checkFilename)) {
          showError(`File ${checkFilename} already exists. To force overwrite use option -overwrite yes`);
        }
      } catch (err) {
        showError(`Filesystem error: ${err.message}`);
      }
    }
  }
}

/* Clean output option */
if (cli.hasOpt('outclean')) {
  if (typeof cli.opts['outclean'] === 'undefined') {
    showError('-outclean requires filename prefix');
  }
  params.outClean = cli.opts['outclean'];
  params.print = false;

  if (params.overwrite !== true) {
    for (let i = 1; i <= params.shares; i++) {
      let checkFilename = `${params.outClean}-${i}`;
      try {
        if (fs.existsSync(checkFilename)) {
          showError(`File ${checkFilename} already exists. To force overwrite use option -overwrite yes`);
        }
      } catch (err) {
        showError(`Filesystem error: ${err.message}`);
      }
    }
  }
}

if (params.out === params.outClean && typeof params.out !== 'undefined') {
  showError('-out and -outclean needs different filename prefixes');
}

/* Print option */
if (cli.hasOpt('print')) {
  if (typeof cli.opts['print'] === 'undefined') {
    params.print = true;
  } else if (cli.opts['print'].toLowerCase() === 'yes') {
    params.print = true;
  } else if (cli.opts['print'].toLowerCase() === 'clean') {
    params.print = true;
    params.cleanPrint = true;
  } else {
    showError(`-print ${cli.opts.print} unrecognized. Expected "yes" or "clean"`);
  }
}

module.exports = params;