import FileHandler from "../classes/FileHandler.js";
import HexHandler from "../classes/HexHandler.js";
import { asciiToHexBytes, pathGen } from "../utils/common-utils.js";

const busHD_01Alias = "BusHD_01";
let baseAssets = null;

// Listen for messages from the parent thread
self.onmessage = (event) => {
  baseAssets = event.data;
  for (let i = 0; i < baseAssets.quantity; i++) {
    const fileIndex = (i + 1).toString().padStart(2, "0");
    manipulateFiles(fileIndex);
  }
  self.postMessage("done");
};

/**
 * Manipulates the Mono, Object, and Skin files based on the provided index string.
 * @param {string} indexStr - The index string for the current file iteration.
 */
const manipulateFiles = (indexStr) => {
  manipulateMono(indexStr);
  manipulateObj(indexStr);
  manipulateSkin(indexStr);
};

/**
 * Manipulates the Mono file based on the provided index string.
 * @param {string} indexStr - The index string for the current file iteration.
 * @throws Will log an error if the manipulation fails.
 */
const manipulateMono = (indexStr) => {
  try {
    const newObjDep = baseAssets.obj.slice(0, 30) + indexStr;
    const newMonoFile = baseAssets.mono.slice(0, 30) + indexStr;

    const fileIns = new FileHandler({
      inputPath: pathGen("assets", baseAssets.mono),
      outPath: pathGen("output", newMonoFile),
    });

    const hexIns = new HexHandler(fileIns.buffer);
    const objDepOffset = hexIns.findIndex(asciiToHexBytes(baseAssets.obj));
    const monoAliasOffset = hexIns.findIndex(
      asciiToHexBytes(busHD_01Alias),
    );

    // Modify file dependencies and aliases
    hexIns.replaceBytes(objDepOffset[0].start, asciiToHexBytes(newObjDep));
    hexIns.replaceBytes(
      monoAliasOffset[0].start,
      asciiToHexBytes(`BusHD_${indexStr}`),
    );

    fileIns.writeBuffer();
  } catch (error) {
    console.error(
      `Error manipulating Mono file for index ${indexStr}:`,
      error.message,
    );
  }
};

/**
 * Manipulates the Object file based on the provided index string.
 * @param {string} indexStr - The index string for the current file iteration.
 * @throws Will log an error if the manipulation fails.
 */
const manipulateObj = (indexStr) => {
  try {
    const newMonoDep = baseAssets.mono.slice(0, 30) + indexStr;
    const newSkinDep = baseAssets.skin.slice(0, 30) + indexStr;
    const newObjFile = baseAssets.obj.slice(0, 30) + indexStr;

    const fileIns = new FileHandler({
      inputPath: pathGen("assets", baseAssets.obj),
      outPath: pathGen("output", newObjFile),
    });

    const hexIns = new HexHandler(fileIns.buffer);
    const monoDepOffset = hexIns.findIndex(
      asciiToHexBytes(baseAssets.mono),
    );
    const skinDepOffset = hexIns.findIndex(
      asciiToHexBytes(baseAssets.skin),
    );
    const monoAliasOffset = hexIns.findIndex(
      asciiToHexBytes(busHD_01Alias),
    );

    // Modify file dependencies and aliases
    hexIns.replaceBytes(
      skinDepOffset[0].start,
      asciiToHexBytes(newSkinDep),
    );
    hexIns.replaceBytes(
      monoDepOffset[0].start,
      asciiToHexBytes(newMonoDep),
    );
    hexIns.replaceBytes(
      monoAliasOffset[0].start,
      asciiToHexBytes(`BusHD_${indexStr}`),
    );

    fileIns.writeBuffer();
  } catch (error) {
    console.error(
      `Error manipulating Object file for index ${indexStr}:`,
      error.message,
    );
  }
};

/**
 * Manipulates the Skin file based on the provided index string.
 * @param {string} indexStr - The index string for the current file iteration.
 * @throws Will log an error if the manipulation fails.
 */
const manipulateSkin = (indexStr) => {
  try {
    const newSkinFile = baseAssets.skin.slice(0, 30) + indexStr;

    const fileIns = new FileHandler({
      inputPath: pathGen("assets", baseAssets.skin),
      outPath: pathGen("output", newSkinFile),
    });

    const hexIns = new HexHandler(fileIns.buffer);
    const skinAliasOffset = hexIns.findIndex(
      asciiToHexBytes(baseAssets.skinAlias),
    );
    const newSkinAlias = `${baseAssets.skinAlias.slice(0, -2)}${indexStr}`;

    // Modify Skin Alias in Mat and Tex
    hexIns.replaceBytes(
      skinAliasOffset[0].start,
      asciiToHexBytes(newSkinAlias),
    );
    hexIns.replaceBytes(
      skinAliasOffset[1].start,
      asciiToHexBytes(newSkinAlias),
    );

    fileIns.writeBuffer();
  } catch (error) {
    console.error(
      `Error manipulating Skin file for index ${indexStr}:`,
      error.message,
    );
  }
};
