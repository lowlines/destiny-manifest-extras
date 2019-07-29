const https = require("https");
const fs = require("fs");

const scanActivities = require("./overrides-activities");

const OVERRIDE_DOCS = [
  {
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
  scanManifest
};

// function get_manifest_overrides(Api_Request $request) {
// 	$manifest = file_exists(MANIFESTPATH) ? json_decode(file_get_contents(MANIFESTPATH)) : (object)array(
// 		'version' => date('c'),
// 		'worldContent' => (object)array()
// 	);

// 	if ($_SERVER['HTTP_HOST'] == 'lowlidev.io') {
//

// 		$locale = isset($_GET['locale']) ? $_GET['locale'] : 'en';

// 		$_GET['destiny2'] = '';
// 		$definitionType = 'DestinyActivityDefinition';

// 		if (!isset($manifest->worldContent->{$definitionType})) $manifest->worldContent->{$definitionType} = (object)array();

// 		$result = queryDatabase('SELECT * FROM DestinyInventoryItemDefinition WHERE json LIKE "%questlineItemHash%activityHash%"', $locale);

// 		if ($result) {
// 			while($row = $result->fetchArray()) {
// 				$def = json_decode($row[1]);

// 				//if (!in_array(53, $def->itemCategoryHashes)) continue;
// 				if (!isset($def->displayProperties->name) || !$def->displayProperties->name) continue;
// 				if (!$def->objectives->questlineItemHash) continue;

// 				$skip = false;
// 				foreach($def->objectives->perObjectiveDisplayProperties as $displayProperties) {
// 					echo $displayProperties->activityHash."\n";
// 				}
// 				if ($skip) continue;

// //			foreach($def->setData->itemList as $item) {
// //				$itemHashes[] = $item->itemHash;
// //			}
// //
// //			$quests->{$def->hash} = $def;

// 				echo $def->hash.' // '.$def->displayProperties->name.' | '.$def->objectives->questTypeIdentifier.' | '.$def->objectives->questlineItemHash."\n";
// 			}
// 		}

// 		$result = queryDatabase('SELECT * FROM DestinyActivityDefinition');
// 		if ($result === 1) {

// 			while($row = $result->fetchArray()) {
// 				$key = is_numeric($row[0]) ? sprintf('%u', $row[0] & 0xFFFFFFFF) : $row[0];
// 				$data = json_decode($row[1]);
// 				if (!isset($data->displayProperties->name) || !$data->displayProperties->name || !isset($data->activityModeTypes)) continue;
// 				$modeTypes = $data->activityModeTypes;

// 				$hash = $key;

// 				$overrideData = $manifest->worldContent->{$definitionType};
// 				$overrideDefinition = isset($overrideData->{$hash}) ? $overrideData->{$hash} : (object)array();

// 				$newModeTypes = isset($overrideDefinition->activityModeTypes) ? $overrideDefinition->activityModeTypes : array();
// 				$newModeTypes = array();

// 				if (isset($heroicStoryMissions[$key])) {
// 					$overrideDefinition->storyMissionProperties = (object)array(
// 						'name' => $heroicStoryMissions[$key]
// 					);

// 					$data->{$hash} = $overrideDefinition;
// 					$manifest->worldContent->{$definitionType} = $data;
// 				}

// 				if (in_array(6, $modeTypes)) { // Patrol
// 					$is_patrol = false;
// 					if (isset($manifest->worldContent->{$definitionType})) {
// 						$overrides = $manifest->worldContent->{$definitionType};
// 						if (isset($overrides->{$hash})) {
// 							$override = $overrides->{$hash};
// 							if (isset($override->missionObjective)) {
// 								$is_patrol = true;
// 							}
// 						}
// 					}
// 					if ($is_patrol) {
// 						$newModeTypes[] = 601; // Patrols
// 						//echo $key.' | '.$data->displayProperties->name.' | '.json_encode($modeTypes).' | '.json_encode($newModeTypes)."\n";
// 					} else {
// 						//if (count($newModeTypes) == 0) $newModeTypes[] = 602; // Assume Adventure
// 						if (isset($_GET['debug']) && count($newModeTypes) == 0) {
// 							echo $key.', // '.$data->displayProperties->name.' ('.$data->activityLightLevel.')'."\n";
// 						};
// 					}
// 				}

// 				if (in_array(2, $modeTypes)) { // Story
// 					//if (count($newModeTypes) == 0) $newModeTypes[] = 203; // Assume Red War Story
// 					//if (count($newModeTypes) == 0) $newModeTypes[] = 208; // Assume Forsaken

// 					if (isset($_GET['debug']) && count($newModeTypes) == 0) {
// 						echo $key.', // '.$data->displayProperties->name.' ('.$data->activityLightLevel.')'."\n";
// 					}
// 				}

// 				if (count($newModeTypes) > 0) {
// 					$cleanModeTypes = array();
// 					$newModeTypes = array_merge($modeTypes, $newModeTypes);
// 					foreach($newModeTypes as $modeType) {
// 						if (!in_array($modeType, $cleanModeTypes)) $cleanModeTypes[] = $modeType;
// 					}
// 					$newModeTypes = $cleanModeTypes;

// 					$overrideDefinition->activityModeTypes = $newModeTypes;

// 					$overrideData->{$hash} = $overrideDefinition;
// 					$manifest->worldContent->{$definitionType} = $overrideData;
// 				}
// 				//$results->{$key} = $data;
// 				//break;
// 			}
// 		}

// 		//file_put_contents(MANIFESTPATH, json_encode($manifest, JSON_PRETTY_PRINT));
// 	}

// 	$request->result = $manifest;
// }
