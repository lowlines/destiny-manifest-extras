const manifest = require("./manifest");
const overrides = require("./overrides");

async function run() {
  const manifestData = await manifest.getManifest();
  //   console.log(Object.keys(manifestData));
  // overrides.downloadSpreadsheets();
  // overrides.scanManifest(manifestData);
  overrides.generate();
}

run();
