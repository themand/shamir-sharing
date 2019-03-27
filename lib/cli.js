let args = process.argv.slice(2);
let opts = {};

/* Extract options from command line arguments */
let paramsExtracted = -1;
while (paramsExtracted !== 0) {
  paramsExtracted = 0;
  for (let i in args) {
    if (args[i].startsWith('-')) {
      let key = args[i].substr(1);
      let value = args[parseInt(i) + 1];
      if (typeof value === 'string' && value.startsWith('-')) {
        value = undefined;
        args.splice(i, 1);
      } else {
        args.splice(i, 2);
      }
      if (Object.keys(opts).includes(key)) {
        console.error(`Error: Option ${key} specified more than once`);
        process.exit(101);
      }
      opts[key] = value;
      paramsExtracted = 1;
      break;
    }
  }
}

function hasOpt(key) {
  return Object.keys(opts).includes(key);
}

module.exports = {args, opts, hasOpt};