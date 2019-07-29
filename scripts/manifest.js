const https = require("https");
const fs = require("fs");

const API_KEY = fs.readFileSync("api-key.txt").toString();
const BUNGIE_HOSTNAME = "www.bungie.net";
const MANIFEST_LOCALE = "en";
const MANIFEST_CACHE_PATH = "cache/manifest.json";
const MANIFEST_DATA_PATH = "cache/manifest-" + MANIFEST_LOCALE + ".json";

if (!fs.existsSync("cache")) {
  fs.mkdirSync("cache");
}

let cachedManifest = null;
let manifestData = null;
if (fs.existsSync(MANIFEST_CACHE_PATH)) {
  cachedManifest = JSON.parse(fs.readFileSync(MANIFEST_CACHE_PATH));
  console.log("Loaded Manifest");
}
if (fs.existsSync(MANIFEST_DATA_PATH)) {
  manifestData = JSON.parse(fs.readFileSync(MANIFEST_DATA_PATH));
  console.log("Loaded Manifest Data [" + MANIFEST_LOCALE + "]");
}

function requestJson(path, isApi = false) {
  return new Promise((resolve, reject) => {
    const headers = {};
    if (isApi) {
      headers["X-API-KEY"] = API_KEY;
    }
    const options = {
      hostname: BUNGIE_HOSTNAME,
      port: 443,
      path: path,
      method: "GET",
      headers: headers
    };
    console.log(
      options.method,
      `http${options.port === 443 ? "s" : ""}://${options.hostname}${
        options.path
      }`
    );
    const req = https.request(options, res => {
      let data = "";
      res.on("data", stream => {
        data += stream;
      });
      res.on("end", function() {
        resolve(JSON.parse(data));
      });
    });
    req.on("error", function(e) {
      reject(e);
    });
    req.end();
  });
}

function requestManifest() {
  return requestJson("/Platform/Destiny2/Manifest/", true);
}

function requestManifestData(locale) {
  if (locale === undefined) {
    locale = MANIFEST_LOCALE;
  }
  if (!cachedManifest) {
    return Promise.reject();
  }
  const url = cachedManifest.jsonWorldContentPaths[locale];
  return requestJson(url);
}

function checkManifest() {
  return requestManifest().then(res => {
    if (res.ErrorCode === 1) {
      const manifest = res.Response;

      // console.log(JSON.stringify(manifest, null, "  "));

      const hasChanged =
        !cachedManifest ||
        cachedManifest.jsonWorldContentPaths[MANIFEST_LOCALE] !==
          manifest.jsonWorldContentPaths[MANIFEST_LOCALE];

      if (hasChanged) {
        cachedManifest = manifest;
        fs.writeFileSync(
          MANIFEST_CACHE_PATH,
          JSON.stringify(manifest, null, "  ")
        );
        return requestManifestData().then(manifestDataJson => {
          manifestData = manifestDataJson;
          fs.writeFileSync(MANIFEST_DATA_PATH, JSON.stringify(manifestData));
          return manifestData;
        });
      }
    }
  });
}

module.exports = {
  checkManifest,
  getManifest: async () => {
    if (!cachedManifest || !manifestData) {
      await checkManifest();
    }
    return manifestData;
  }
};
