const https = require("https");
const fs = require("fs");

const scanActivities = require("./overrides-activities");
const scanMilestones = require("./overrides-milestones");

const OVERRIDE_DOCS = [
  {
    // https://docs.google.com/spreadsheets/d/16ljkZMWO2EIgui5HkARn3GFFsAt-tauRy2T_jwdScmc/edit?usp=sharing
    type: "DestinyActivityDefinition",
    id: "16ljkZMWO2EIgui5HkARn3GFFsAt-tauRy2T_jwdScmc",
    name: "activity-patrols"
  }
];
const CSV_URL = "https://docs.google.com/spreadsheets/d/%s/gviz/tq?tqx=out:csv";

function parseCsv(data) {
  const rows = data.split("\n");
  let keys = [];
  const csv = {};
  rows.map((line, lineIndex) => {
    const row = {};
    line = line.slice(1, line.length - 1).split(`","`);
    if (lineIndex === 0) {
      keys = line;
      return null;
    }
    line.map((cell, index) => {
      let key = keys[index];
      let value = cell;
      if (!key) {
        return;
      }
      if (value === "TRUE" || value === "FALSE") {
        value = value === "TRUE";
      } else if (value && value.replace(/[0-9]+/g, "").length === 0) {
        value = parseInt(value, 10);
      }
      if (key.indexOf("[]") !== -1) {
        key = key.replace("[]", "");
        if (row[key] === undefined) row[key] = [];
        if (value) row[key].push(value);
        return;
      }
      row[key] = value;
    });
    csv[row.hash] = row;
    delete row.hash;
  });
  return csv;
}

function getCsv(url) {
  return new Promise((resolve, reject) => {
    console.log("GET", url);
    const req = https.get(url, res => {
      let data = "";
      res.on("data", stream => {
        data += stream;
      });
      res.on("end", function() {
        resolve(parseCsv(data));
      });
    });
    req.on("error", function(e) {
      reject(e);
    });
    req.end();
  });
}

async function downloadSpreadsheets() {
  const manifest = {
    version: new Date().toISOString(),
    worldContent: {}
  };

  OVERRIDE_DOCS.map(async doc => {
    if (manifest[doc.type] === undefined) {
      manifest[doc.type] = {};
    }
    const url = CSV_URL.replace("%s", doc.id);
    const csv = await getCsv(url);

    // console.log(csv);
    fs.writeFileSync(
      "data/" + doc.name + ".json",
      JSON.stringify({ [`${doc.type}`]: csv }, null, "  ")
    );
  });
}

function scanManifest(manifestData) {
  scanActivities(manifestData);
}

function applyOverride(target, value, key) {
  const partIndex = key.indexOf(".");
  if (partIndex !== -1) {
    const keyPart = key.slice(0, partIndex);
    if (target[keyPart] === undefined) target[keyPart] = {};
    applyOverride(target[keyPart], value, key.slice(partIndex + 1));
  } else {
    target[key] = value;
  }
}

function generate() {
  const mergedOverrides = {};
  const files = fs.readdirSync("data");
  files.map(file => {
    if (file.indexOf(".") === 0) return;
    const path = "data/" + file;

    const overrideData = JSON.parse(fs.readFileSync(path));

    Object.keys(overrideData).map(type => {
      if (mergedOverrides[type] === undefined) mergedOverrides[type] = {};
      const mergedTable = mergedOverrides[type];
      const dataTable = overrideData[type];

      Object.keys(dataTable).map(hash => {
        const data = dataTable[hash];
        if (mergedTable[hash] === undefined) mergedTable[hash] = {};
        const mergedData = mergedTable[hash];

        Object.keys(data).map(key => {
          if (key.slice(0, 1) === "#") return;
          applyOverride(mergedData, data[key], key);
        });
      });
    });
  });

  fs.writeFileSync(
    "manifest-overrides.json",
    JSON.stringify(
      {
        version: new Date().toISOString(),
        worldContent: mergedOverrides
      },
      null,
      "  "
    )
  );
}

module.exports = {
  downloadSpreadsheets,
  generate,
  scanManifest,
  scanActivities,
  scanMilestones
};
