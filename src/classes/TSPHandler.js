import { Input, Toggle } from "https://deno.land/x/cliffy@v0.25.7/mod.ts";
import { restartApp } from "../event/app-event.js";
import {
  asciiToHexBytes,
  endSlice,
  errorLog,
  hexToInt,
  intToHexBytes,
  pathGen,
} from "../utils/common-utils.js";
import { validators } from "../utils/cli-seelctors.js";
import {
  brightBlue,
  brightRed,
  brightYellow,
} from "https://deno.land/std@0.221.0/fmt/colors.ts";
import FileHandler from "./FileHandler.js";
import HexHandler from "./HexHandler.js";
import { hexBytesToAscii } from "../utils/common-utils.js";
import { readFileSync } from "node:fs";

/**
 * Class to handle TSP file operations.
 */
export class TSPHandler {
  #assetsDirectory = null; // Array of asset file paths
  #monoAssetTextBuffer = []; // Buffer for mono asset text
  #assetStructure = { // Structure to hold parsed asset data
    dependency: {
      offset: null,
      value: null,
    },
    firstFile: {
      offset: null,
      value: null,
    },
    dependencyObjects: [],
    oftensSpawn: {
      lengthOffset: null,
      lengthValue: null,
      offset: null,
    },
    sometimesSpawn: {
      lengthOffset: null,
      lengthValue: null,
      offset: null,
    },
    assetSize: {
      offset: null,
      value: null,
    },
    assetContainsLength: {
      offset: null,
      value: null,
    },
  };
  #tspPromptValues = { // Values collected from user prompts
    trafficSpawnMono: null,
    trafficMonoText: null,
    spawnType: null,
  };

  /**
   * Creates an instance of TSPHandler.
   * @param {string[]} assetsDirectory - Array of asset file paths.
   */
  constructor(assetsDirectory) {
    try {
      this.#assetsDirectory = assetsDirectory;
      this.#displayAssetPaths();
      this.#initializeTSPPrompt();
    } catch (error) {
      errorLog(error.message);
      restartApp();
    }
  }

  /**
   * Displays the asset paths in the console.
   */
  #displayAssetPaths() {
    this.#assetsDirectory.forEach((path, index) => {
      console.log(brightYellow(`${index} `), brightBlue(`${path}`));
    });
  }

  /**
   * Initializes the prompt for TSP parameters.
   */
  async #initializeTSPPrompt() {
    try {
      this.#tspPromptValues.trafficSpawnMono = await this.#promptForAssetIndex(
        "Input traffic spawn asset index",
      );
      this.#tspPromptValues.trafficMonoText = await this.#promptForAssetIndex(
        "Input traffic mono text index",
      );
      this.#tspPromptValues.spawnType = await this.#promptForSpawnType();

      const confirmPrompt = await Toggle.prompt({
        message: "Are you sure the above files are correct?",
        default: true,
      });

      if (confirmPrompt) {
        this.#initializeTSP();
      }
    } catch (error) {
      throw new Error(
        `Error occurred in ${
          brightRed(`#initializeTSPPrompt`)
        } method in TSPHandler: ${error.message}`,
      );
    } finally {
      restartApp();
    }
  }

  /**
   * Prompts the user for an asset index.
   * @param {string} message - The prompt message.
   * @returns {Promise<string>} The selected asset path.
   */
  async #promptForAssetIndex(message) {
    const index = parseInt(
      await Input.prompt({
        message,
        validate: validators[0].cb,
        pointer: brightYellow(":"),
      }),
    );
    return this.#assetsDirectory[index];
  }

  /**
   * Prompts the user for spawn type.
   * @returns {Promise<boolean>} True if "Sometimes", false if "Oftens".
   */
  async #promptForSpawnType() {
    return !!await Toggle.prompt({
      message: "Spawn as",
      inactive: "Oftens",
      active: "Sometimes",
      default: true,
    });
  }

  /**
   * Initializes TSP processing.
   */
  #initializeTSP() {
    try {
      const fileHandler = new FileHandler({
        inputPath: pathGen("assets", this.#tspPromptValues.trafficSpawnMono),
        outPath: pathGen("output", this.#tspPromptValues.trafficSpawnMono),
      });

      this.#parseAssetStructure(fileHandler.buffer);
      this.#addDependencies(fileHandler.buffer);
      fileHandler.writeBuffer();
    } catch (error) {
      throw new Error(
        `Error occurred in ${
          brightRed(`#initializeTSP`)
        } method in TSPHandler: ${error.message}`,
      );
    }
  }

  /**
   * Parses the asset structure from the provided buffer.
   * @param {string[]} buffer - The buffer containing asset data.
   */
  #parseAssetStructure(buffer) {
    try {
      const hexHandler = new HexHandler(buffer);
      this.#initializeDependencyObjects(hexHandler, buffer);
      this.#initializeMonoAssetBuffer();
      this.#initializeSpawnStructures(buffer);
      this.#fillDependencyObjects(buffer);
      this.#initializeAssetSize(buffer);
      this.#initializeAssetContainsLeng(buffer);
      // console.log(this.#assetStructure.dependencyObjects);
    } catch (error) {
      throw new Error(
        `Error occurred in ${
          brightRed(`#parseAssetStructure`)
        } method in TSPHandler: ${error.message}`,
      );
    }
  }

  /**
   * Initializes dependency objects and values.
   * @param {HexHandler} hexHandler - Instance of HexHandler to manage hex data.
   * @param {string[]} buffer - The buffer containing asset data.
   */
  #initializeDependencyObjects(hexHandler, buffer) {
    const globalDep =
      hexHandler.findIndex(asciiToHexBytes("globalgamemanagers.assets"))[0];
    const totalDependencies = hexToInt(
      buffer.slice(globalDep.start - 25, globalDep.start - 23),
      true,
    );

    this.#assetStructure.dependencyObjects.push({
      offset: globalDep.start - 22,
      assetName: "globalgamemanagers.assets",
      spawnType: null,
    });

    this.#assetStructure.firstFile = {
      offset: hexToInt(buffer.slice(38, 40)),
      value: buffer.slice(38, 40),
    };

    this.#assetStructure.dependency = {
      offset: hexHandler.findIndex(
        hexHandler.buffer.slice(
          this.#assetStructure.dependencyObjects[0].offset - 3,
          this.#assetStructure.dependencyObjects[0].offset - 1,
        ),
      )[0].start,
      value: hexHandler.buffer.slice(
        this.#assetStructure.dependencyObjects[0].offset - 3,
        this.#assetStructure.dependencyObjects[0].offset - 1,
      ),
    };

    for (let index = 1; index < totalDependencies; index++) {
      const previousDep = this.#assetStructure.dependencyObjects[index - 1];
      const currentDepOffset = previousDep.offset + 22 +
        previousDep.assetName.length;
      const assetName = hexBytesToAscii(
        buffer.slice(currentDepOffset + 22, currentDepOffset + 22 + 32),
      );
      this.#assetStructure.dependencyObjects.push({
        offset: currentDepOffset,
        assetName,
        spawnType: null,
      });
    }
  }

  /**
   * Initializes the mono asset buffer.
   */
  #initializeMonoAssetBuffer() {
    this.#monoAssetTextBuffer = endSlice(
      readFileSync(
        pathGen("assets", this.#tspPromptValues.trafficMonoText),
        "ascii",
      ).split("\n"),
      1,
    );
  }

  /**
   * Initializes spawn structures for oftens and sometimes.
   * @param {string[]} buffer - The buffer containing asset data.
   */
  #initializeSpawnStructures(buffer) {
    const oftensSpawnOffset = this.#assetStructure.firstFile.offset + 48;
    this.#assetStructure.oftensSpawn = {
      lengthOffset: oftensSpawnOffset,
      lengthValue: buffer.slice(oftensSpawnOffset, oftensSpawnOffset + 4),
      offset: oftensSpawnOffset + 4,
    };

    const sometimesSpawnOffset = this.#assetStructure.oftensSpawn.offset +
      (hexToInt(this.#assetStructure.oftensSpawn.lengthValue, true) * 12);
    this.#assetStructure.sometimesSpawn = {
      lengthOffset: sometimesSpawnOffset,
      lengthValue: buffer.slice(sometimesSpawnOffset, sometimesSpawnOffset + 4),
      offset: sometimesSpawnOffset + 4,
    };
  }

  /**
   * Fills the dependency objects with spawn type information.
   * @param {string[]} buffer - The buffer containing asset data.
   */
  #fillDependencyObjects(buffer) {
    this.#fillSpawnType(buffer, this.#assetStructure.oftensSpawn, "Oftens");
    this.#fillSpawnType(
      buffer,
      this.#assetStructure.sometimesSpawn,
      "Sometimes",
    );
  }

  /**
   * Fills spawn types in dependency objects.
   * @param {string[]} buffer - The buffer containing asset data.
   * @param {object} spawnStructure - Structure containing spawn information.
   * @param {string} spawnType - The type of spawn ("Oftens" or "Sometimes").
   */
  #fillSpawnType(buffer, spawnStructure, spawnType) {
    let currentOffset = spawnStructure.offset;

    for (
      let index = 1;
      index <= hexToInt(spawnStructure.lengthValue, true);
      index++
    ) {
      const endOffset = currentOffset + 12;
      const fileIdVal = hexToInt(
        buffer.slice(currentOffset, currentOffset + 4),
        true,
      );
      const currDep = this.#assetStructure.dependencyObjects[fileIdVal];

      if (currDep) {
        currDep.spawnType = `${currDep.spawnType ? " + " : ""}${spawnType}`;
      }

      currentOffset = endOffset;
    }
  }

  /**
   * Initializes the Asset Size offsets and values.
   * @param {string[]} buffer - The buffer containing asset data.
   */
  #initializeAssetSize(buffer) {
    this.#assetStructure.assetSize.offset = 30;
    this.#assetStructure.assetSize.value = buffer.slice(30, 32);
  }

  /**
   * Initializes the Asset Contains Total Files Length offsets and values.
   * @param {string[]} buffer - The buffer containing asset data.
   */
  #initializeAssetContainsLeng(buffer) {
    this.#assetStructure.assetContainsLength.offset = 128;
    this.#assetStructure.assetContainsLength.value = buffer.slice(128, 130)
      .reverse();
  }

  /**
   * Adds dependencies based on the parsed asset structure.
   * @param {string[]} buffer - The buffer containing asset data.
   */
  #addDependencies(buffer) {
    try {
      const hexHandler = new HexHandler(buffer);
      const newTotalDependencies = hexToInt(
        hexHandler.buffer.slice(
          this.#assetStructure.dependency.offset,
          this.#assetStructure.dependency.offset + 2,
        ),
        true,
      ) + this.#monoAssetTextBuffer.length;

      hexHandler.replaceBytes(
        this.#assetStructure.dependency.offset,
        intToHexBytes(newTotalDependencies),
      );

      this.#monoAssetTextBuffer.forEach((mono) => {
        const metaSize = hexToInt(buffer.slice(22, 24));

        const newFirstFile = {
          offset: this.#assetStructure.firstFile.offset + 64,
          value: intToHexBytes(this.#assetStructure.firstFile.offset + 64),
        };

        hexHandler.replaceBytes(38, newFirstFile.value);
        this.#assetStructure.firstFile = newFirstFile;

        const startOffset =
          this.#assetStructure.dependencyObjects.slice(-1)[0].offset + 54;

        hexHandler.replaceBytes(22, intToHexBytes(metaSize + 54));
        hexHandler.insertBytes(startOffset, new Array(32).fill("00"));
        hexHandler.insertBytes(startOffset + 22, asciiToHexBytes(mono));

        this.#assetStructure.dependencyObjects.push({
          offset: startOffset,
          assetName: mono,
          spawnType: this.#tspPromptValues.spawnType ? "Sometimes" : "Oftens",
        });
      });

      // modify asset contains length
      const newAssetContLeng =
        hexToInt(this.#assetStructure.assetContainsLength.value) +
        (12 * this.#monoAssetTextBuffer.length);

      hexHandler.replaceBytes(
        this.#assetStructure.assetContainsLength.offset,
        intToHexBytes(newAssetContLeng).reverse(),
      );

      // update sometimes & oftens offset length value
      const insertedNewByteLeng = (54 * this.#monoAssetTextBuffer.length) + 10;

      this.#assetStructure.sometimesSpawn = {
        lengthOffset: this.#assetStructure.sometimesSpawn.lengthOffset +
          insertedNewByteLeng,
        offset: this.#assetStructure.sometimesSpawn.offset +
          insertedNewByteLeng,
        lengthValue: buffer.slice(
          this.#assetStructure.sometimesSpawn.lengthOffset +
            insertedNewByteLeng,
          this.#assetStructure.sometimesSpawn.lengthOffset +
            insertedNewByteLeng + 4,
        ),
      };

      this.#assetStructure.oftensSpawn = {
        lengthOffset: this.#assetStructure.oftensSpawn.lengthOffset +
          insertedNewByteLeng,
        offset: this.#assetStructure.oftensSpawn.offset +
          insertedNewByteLeng,
        lengthValue: buffer.slice(
          this.#assetStructure.oftensSpawn.lengthOffset +
            insertedNewByteLeng,
          this.#assetStructure.oftensSpawn.lengthOffset +
            insertedNewByteLeng + 4,
        ),
      };

      // manipulate spawn type
      this.#addSpawnType(hexHandler.buffer);

      // modify total asset byte length
      hexHandler.replaceBytes(
        this.#assetStructure.assetSize.offset,
        intToHexBytes(buffer.length),
      );
    } catch (error) {
      console.log(error);
      throw new Error(
        `Error occurred in ${
          brightRed(`#addDependencies`)
        } method in TSPHandler: ${error.message}`,
      );
    }
  }

  /**
   * @param {string[]} buffer - The buffer containing asset data.
   */
  #addSpawnType(buffer) {
    const hexHandler = new HexHandler(buffer);

    let fileIdBuf = intToHexBytes(
      this.#assetStructure.dependencyObjects.length,
    );

    if (fileIdBuf.length < 4) {
      const gap = 4 - fileIdBuf.length;
      fileIdBuf = [...fileIdBuf, ...new Array(gap).fill("00")];
    }

    const newDepFileId = [
      ...fileIdBuf,
      "01",
      "00",
      "00",
      "00",
      ...new Array(4).fill("00"),
    ];

    let startOffset = this.#assetStructure.sometimesSpawn.lengthOffset;

    if (this.#tspPromptValues.spawnType) {
      // modify sometimes length value
      const newSometimesLeng = intToHexBytes(
        hexToInt(this.#assetStructure.sometimesSpawn.lengthValue, true) +
          this.#monoAssetTextBuffer.length,
      );

      hexHandler.replaceBytes(
        this.#assetStructure.sometimesSpawn.lengthOffset,
        newSometimesLeng,
      );
      startOffset = buffer.length;
    } else {
      // modify oftens length value
      const newSometimesLeng = intToHexBytes(
        hexToInt(this.#assetStructure.oftensSpawn.lengthValue, true) +
          this.#monoAssetTextBuffer.length,
      );

      hexHandler.replaceBytes(
        this.#assetStructure.oftensSpawn.lengthOffset,
        newSometimesLeng,
      );
    }
    // insert 12 bytes for dependency
    hexHandler.insertBytes(startOffset, newDepFileId);
  }
}
