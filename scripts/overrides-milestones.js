const fs = require("fs");

const lookupTables = require("./overrides-lookup-tables");

const DATA_PATH = "data/milestones.json";

const BUCKET_PURSUITS = 1345459588;
const ITEM_CATEGORY_PROPHECY_TABLET = 2250046497;

const ITEM_CATEGORY_BOUNTY = 1784235469;
const ITEM_CATEGORY_BOUNTY_DAILY = 3441456675;
const ITEM_CATEGORY_BOUNTY_WEEKLY = 579365201;
const ITEM_CATEGORY_BOUNTY_GAMBIT = 2588263708;
const ITEM_CATEGORY_BOUNTY_SCRAPPER = 336913260;
const ITEM_CATEGORY_BOUNTY_TRIUMPH = 4274404816;
const ITEM_CATEGORY_BOUNTY_EVERVERSE = 1514318935;
const ITEM_CATEGORY_BOUNTY_EVERVERSE_IGR = 1493976446;
const ITEM_CATEGORY_BOUNTY_DREAMING_CITY = 3148179843;
const ITEM_CATEGORY_BOUNTY_IRON_BANNER = 1895523255;

const VENDOR_SPIDER = 863940356;
const VENDOR_SHAXX = 3603221665;
const VENDOR_ADA1 = 2917531897;
const VENDOR_EVA_LEVANTE = 919809084;

const ITEM_CATEGORY_QUEST = 53;
const ITEM_CATEGORY_QUEST_STEP = 16;

function getPursuits(manifestData) {
  const bounties = [];

  Object.keys(manifestData.DestinyInventoryItemDefinition).map(itemHash => {
    const itemDef = manifestData.DestinyInventoryItemDefinition[itemHash];

    if (itemDef.inventory.bucketTypeHash !== BUCKET_PURSUITS) {
      return;
    }

    const categoryHashes = itemDef.itemCategoryHashes || [];

    const vendorSources = itemDef.sourceData.vendorSources.map(
      vendorSource => vendorSource.vendorHash
    );

    if (categoryHashes.indexOf(ITEM_CATEGORY_BOUNTY) !== -1) {
      let categoryName = "Bounty";

      if (vendorSources.indexOf(VENDOR_SPIDER) !== -1) {
        return;
      }
      if (vendorSources.indexOf(VENDOR_SHAXX) !== -1) {
        return;
      }

      console.log(
        itemDef.hash + ", //",
        itemDef.displayProperties.name,
        `(${itemDef.itemTypeDisplayName})`,
        ` : [${vendorSources.join(",")}]`
      );
    }

    // console.log(itemDef.hash + ", //", itemDef.displayProperties.name);
  });
}

module.exports = manifestData => {
  const overrides = {};

  getPursuits(manifestData);

  // Object.keys(manifestData.DestinyMilestoneDefinition).map(milestoneHash => {
  //   const milestone = manifestData.DestinyMilestoneDefinition[milestoneHash];

  //   const quests = milestone.quests ? Object.keys(milestone.quests) : [];

  //   console.log(
  //     milestone.hash + ", //",
  //     milestone.displayProperties.name,
  //     `(${milestone.milestoneType})${
  //       quests.length > 0 ? " : [" + quests.join(",") + "]" : ""
  //     }`
  //   );
  // });
};
