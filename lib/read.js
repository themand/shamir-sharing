const readline = require('readline');
const fs = require('fs');

async function file(filename, options = {}) {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, options, function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

async function stdin(single = false) {
  return new Promise(resolve => {
    let rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    let lines = [];

    function getLine(callback) {
      rl.question(': ', line => {
        if (line.length > 0) {
          lines.push(line);
          if (single) {
            rl.close();
            callback();
          } else {
            getLine(callback);
          }
        } else {
          rl.close();
          callback();
        }
      });
    }

    getLine(() => resolve(lines));
  });
}

module.exports = {stdin, file};