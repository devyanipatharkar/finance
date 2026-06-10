require('dotenv').config();
const { runAgent } = require('./src/agent');
const { error } = require('./src/utils/logger');

function parseArgs(argv) {
  const args = {
    configPath: 'config.json',
    symbolsPath: undefined,
    limit: undefined,
    dryRun: false,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--config' && argv[i + 1]) {
      args.configPath = argv[++i];
    } else if (token === '--symbols' && argv[i + 1]) {
      args.symbolsPath = argv[++i];
    } else if (token === '--limit' && argv[i + 1]) {
      args.limit = Number(argv[++i]);
    } else if (token === '--dry-run') {
      args.dryRun = true;
    }
  }

  return args;
}

(async () => {
  try {
    const options = parseArgs(process.argv);
    const result = await runAgent(options);
    console.log('Agent completed successfully.');
    if (result?.files) {
      console.log(result.files);
    }
  } catch (err) {
    error(err.message);
    process.exitCode = 1;
  }
})();
