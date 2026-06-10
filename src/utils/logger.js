function timestamp() {
  return new Date().toISOString();
}

function info(message) {
  console.log(`[INFO] ${timestamp()} - ${message}`);
}

function warn(message) {
  console.warn(`[WARN] ${timestamp()} - ${message}`);
}

function error(message) {
  console.error(`[ERROR] ${timestamp()} - ${message}`);
}

module.exports = {
  info,
  warn,
  error,
};
