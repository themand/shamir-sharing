const secrets = require('./modules/secrets.js-grempe/secrets');
const params = require('./lib/combine-params');
const read = require('./lib/read');
const fs = require('fs');

process.umask(0o077);

async function getShares() {
  if (Array.isArray(params.files) && params.files.length > 1) {
    const tasks = [];
    for (let fileName of params.files) {
      tasks.push(read.file(fileName, {encoding: 'utf-8'}));
    }
    return Promise.all(tasks);
  } else {
    console.log('Enter shares to combine. One share per line. Enter empty line to finish.');
    return await read.stdin();
  }
}

getShares()
  .then(shares => {

    /* Un-clean shares */
    shares = shares.map(share => share.replace(/[ \n]/g, ''));

    /* Combine secret from combined shares */
    let secret;
    try {
      secret = secrets.hex2str(secrets.combine(shares));
    } catch (err) {
      err.message = 'Error combining shares: ' + err.message;
      throw err;
    }

    /* Print secret if enabled */
    if (params.print === true) {
      console.log(secret);
    }

    /* Save secret to file if enabled */
    if (typeof params.out !== 'undefined') {
      try {
        fs.writeFileSync(params.out, secret, {mode: '0600', encoding: 'binary'});
        fs.chmodSync(params.out, '0600');
        console.log(`Saved secret to file: ${params.out}`);
      } catch (err) {
        err.message = 'Filesystem ' + err.message;
        throw err;
      }
    }
  })
  .catch(err => {
    console.log(`Error: ${err.message}`);
    process.exit(11);
  })
;