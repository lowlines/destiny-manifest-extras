const manifest = require("./manifest");
const overrides = require("./overrides");

async function run() {
  const manifestData = await manifest.getManifest();
  //   console.log(Object.keys(manifestData));
  await overrides.downloadSpreadsheets();
  await overrides.scanManifest(manifestData);
  overrides.generate();
}

run();
