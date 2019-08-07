const manifest = require("./manifest");
const overrides = require("./overrides");

const args = process.argv;

let shouldCheckManifest = false;
let shouldCheckGoogleDocs = false;

let shouldScanManifest = false;
let shouldScanActivities = false;
let shouldScanMilestones = false;

let shouldGenerate = false;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];

  switch (arg) {
    case "--manifest":
      shouldCheckManifest = true;
      break;
    case "--docs":
      shouldCheckGoogleDocs = true;
      break;

    case "--scan":
      shouldScanManifest = true;
      break;
    case "--activities":
      shouldScanActivities = true;
      break;
    case "--milestones":
      shouldScanMilestones = true;
      break;

    case "--generate":
      shouldGenerate = true;
      break;
  }
}

async function run() {
  if (shouldCheckManifest) {
    await manifest.checkManifest();
  }
  const manifestData = await manifest.getManifest();
  if (shouldCheckGoogleDocs) {
    await overrides.downloadSpreadsheets();
  }
  if (shouldScanManifest) {
    await overrides.scanManifest(manifestData);
  } else {
    if (shouldScanActivities) {
      await overrides.scanActivities(manifestData);
    }
    if (shouldScanMilestones) {
      await overrides.scanMilestones(manifestData);
    }
  }
  if (shouldGenerate) {
    overrides.generate();
  }
}

run();
