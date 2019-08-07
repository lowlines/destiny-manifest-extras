const https = require("https");
const fs = require("fs");
const AdmZip = require("adm-zip");

const API_KEY = fs.readFileSync("api-key.txt").toString();
const BUNGIE_HOSTNAME = "www.bungie.net";
const MANIFEST_LOCALE = "en";
const MANIFEST_CACHE_PATH = "cache/manifest.json";
const MANIFEST_DATA_PATH = "cache/manifest-" + MANIFEST_LOCALE + ".json";
const MANIFEST_DATA_MOBILE_PATH = "cache/manifest-" + MANIFEST_LOCALE + ".db";
const MANIFEST_DATA_MOBILE_ZIP_PATH =
  "cache/manifest-" + MANIFEST_LOCALE + ".zip";

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

function requestFile(path, json = false, isApi = false) {
  return new Promise((resolve, reject) => {
    const headers = {};
    if (isApi) {
      headers["X-API-KEY"] = API_KEY;
    }
    const options = {
      hostname: BUNGIE_HOSTNAME,
      port: 443,
      path: path,
      encoding: null,
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
      const chunks = [];
      res.on("data", chunk => {
        chunks.push(chunk);
      });
      res.on("end", function() {
        const data = Buffer.concat(chunks);
        if (json) {
          const dataJson = JSON.parse(data.toString());
          resolve(dataJson);
          return;
        }
        resolve(data);
      });
    });
    req.on("error", function(e) {
      reject(e);
    });
    req.end();
  });
}

function requestJson(path, isApi = false) {
  return requestFile(path, true, isApi);
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
  const jsonUrl = cachedManifest.jsonWorldContentPaths[locale];
  const mobileUrl = cachedManifest.mobileWorldContentPaths[locale];

  const hasJson = fs.existsSync(MANIFEST_DATA_PATH);
  const hasMobile = fs.existsSync(MANIFEST_DATA_MOBILE_PATH);

  const requestJsonPromise = hasJson
    ? Promise.resolve(manifestData)
    : requestJson(jsonUrl).then(data => {
        fs.writeFileSync(MANIFEST_DATA_PATH, JSON.stringify(data));
        return data;
      });

  const requestMobilePromise = hasMobile
    ? Promise.resolve(null)
    : requestFile(mobileUrl).then(data => {
        fs.writeFileSync(MANIFEST_DATA_MOBILE_ZIP_PATH, data);

        const zip = new AdmZip(MANIFEST_DATA_MOBILE_ZIP_PATH);
        const zipEntries = zip.getEntries();

        zipEntries.forEach(function(zipEntry) {
          fs.writeFileSync(MANIFEST_DATA_MOBILE_PATH, zipEntry.getData());
        });
      });

  return Promise.all([requestJsonPromise, requestMobilePromise]).then(
    res => res[0]
  );
}

function checkManifest() {
  console.log("Checking Manifest...");
  return requestManifest().then(res => {
    if (res.ErrorCode === 1) {
      const manifest = res.Response;

      // console.log(JSON.stringify(manifest, null, "  "));

      const hasChanged =
        !cachedManifest ||
        cachedManifest.jsonWorldContentPaths[MANIFEST_LOCALE] !==
          manifest.jsonWorldContentPaths[MANIFEST_LOCALE];
      const noCache =
        !fs.existsSync(MANIFEST_DATA_PATH) ||
        !fs.existsSync(MANIFEST_DATA_MOBILE_PATH);

      if (hasChanged) {
        cachedManifest = manifest;
        fs.writeFileSync(
          MANIFEST_CACHE_PATH,
          JSON.stringify(manifest, null, "  ")
        );
      }

      if (hasChanged || noCache) {
        console.log("Download Manifest Data...");
        return requestManifestData().then(manifestDataJson => {
          manifestData = manifestDataJson;
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
