const secrets = require('./modules/secrets.js-grempe/secrets');
const params = require('./lib/split-params');
const read = require('./lib/read');
const fs = require('fs');

process.umask(0o077);

async function getSecret() {
  if (params.filename) {
    return await read.file(params.filename, {encoding: 'binary'});
  } else {
    console.log('Enter secret to encode. Enter empty line to finish.');
    return (await read.stdin()).join(`\n`);
  }
}

function getClean(data) {
  return data
    .toUpperCase()
    .match(/.{1,4}/g).join(' ')
    .match(/.{1,25}/g).join(' ')
    .match(/.{1,78}/g).join("\n")
    ;
}

getSecret()
  .then(secret => {

    /* Split secret */
    const shares = secrets.share(secrets.str2hex(secret), params.shares, params.threshold);

    /* Verify */
    const combined = secrets.hex2str(secrets.combine(shares.slice(0, params.threshold)));
    if (combined !== secret) {
      throw new Error('Internal error. Could not verify validity of shares data');
    }

    /* Print shares if enabled */
    if (params.print === true) {
      for (let i in shares) {
        console.log(`----- Share ${parseInt(i) + 1} of ${shares.length}:`);
        console.log(params.cleanPrint ? getClean(shares[i]) : shares[i]);
        console.log();
      }
    }

    /* Save shares to files if enabled */
    if (typeof params.out !== 'undefined') {
      for (let i in shares) {
        try {
          let writeFilename = `${params.out}-${parseInt(i) + 1}`;
          fs.writeFileSync(writeFilename, shares[i], {mode: '0600'});
          fs.chmodSync(writeFilename, '0600');
          console.log(`Saved share ${parseInt(i) + 1} of ${shares.length} to file: ${writeFilename}`);
        } catch (err) {
          err.message = 'Filesystem ' + err.message;
          throw err;
        }
      }
    }

    /* Save clean shares to files if enabled */
    if (typeof params.outClean !== 'undefined') {
      for (let i in shares) {
        try {
          let writeFilename = `${params.outClean}-${parseInt(i) + 1}`;
          fs.writeFileSync(writeFilename, getClean(shares[i]), {mode: '0600'});
          fs.chmodSync(writeFilename, '0600');
          console.log(`Saved clean-formatted share ${parseInt(i) + 1} of ${shares.length} to file: ${writeFilename}`);
        } catch (err) {
          err.message = 'Filesystem ' + err.message;
          throw err;
        }
      }
    }

  })
  .catch(err => {
    console.log(`Error: ${err.message}`);
    process.exit(11);
  });