const fs = require("fs");

const lookupTables = require("./overrides-lookup-tables");

const DATA_PATH = "data/activity-mode-types.json";

module.exports = manifestData => {
  const overrides = {};
  Object.keys(manifestData.DestinyActivityDefinition).map(activityHash => {
    const activity = manifestData.DestinyActivityDefinition[activityHash];

    // console.log("Activity", activity);

    const modeTypes = activity.activityModeTypes || [];
    let newModeTypes = [];

    // Ignore List
    if (modeTypes.indexOf(5) !== -1) return; // PvP
    if (modeTypes.indexOf(18) !== -1) return; // Strikes
    if (modeTypes.indexOf(4) !== -1) return; // Raid
    if (modeTypes.indexOf(40) !== -1) return; // Social

    if (modeTypes.indexOf(63) !== -1) return; // Gambit
    if (modeTypes.indexOf(75) !== -1) return; // Gambit Prime

    Object.keys(lookupTables.ModeTypes).map(modeType => {
      const hashes = lookupTables.ModeTypes[modeType];
      if (hashes.indexOf(activity.hash) !== -1) {
        newModeTypes.push(parseInt(modeType, 10));
      }
    });

    const logActivity = (logType = null) => {
      console.log(
        activity.hash + ", //",
        activity.displayProperties.name,
        `(${activity.activityLightLevel})` + (logType ? " : " + logType : "")
      );
    };

    if (modeTypes.indexOf(6) !== -1) {
      // Patrol
      if (newModeTypes.length === 0) {
        logActivity("Patrol");
      }
    } else if (modeTypes.indexOf(2) !== -1) {
      // Story
      if (newModeTypes.length === 0) {
        logActivity("Story");
      }
    } else if (newModeTypes.length === 0) {
      logActivity();
    }

    if (newModeTypes.length > 0) {
      overrides[activity.hash] = {
        "#name": activity.displayProperties.name || `[${activity.hash}]`,
        activityModeTypes: [
          ...modeTypes,
          ...newModeTypes.filter(modeType => modeTypes.indexOf(modeType) === -1)
        ]
      };
    }
  });

  console.log("ActivityOverrides", overrides);

  fs.writeFileSync(
    DATA_PATH,
    JSON.stringify({ DestinyActivityDefinition: overrides }, null, "  ")
  );
};
