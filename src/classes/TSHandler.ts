// deno-lint-ignore-file no-explicit-any
import {
  brightBlue,
  brightGreen,
  brightYellow,
} from "https://deno.land/std@0.221.0/fmt/colors.ts";
import type {
  ManipulateSpeedTypeParams,
  TSPromptValues,
} from "../types/TSHandler-custom.ts";
import { Input, Toggle } from "https://deno.land/x/cliffy@v0.25.7/mod.ts";
import { restartApp } from "../event/app-event.ts";
import { validators } from "../utils/cli-seelctors.ts";
import FileHandler from "./FileHandler.ts";
import {
  convertToLF,
  errorLog,
  getBaseAssets,
  hexToInt,
  intToHexBytes,
  pathGen,
} from "../utils/common-utils.ts";
import { DependencyParser } from "./asset-parsers/DependencyParser.ts";
import { readFileSync } from "node:fs";
import { ClassSizeParser } from "./asset-parsers/ClassSizeParser.ts";
import { FirstFileParser } from "./asset-parsers/FirstFileParser.ts";
import HexHandler from "./HexHandler.ts";
import { AssetSizeParser } from "./asset-parsers/AssetSizeParser.ts";
import { currentVersion } from "../unity/version-structure.ts";

export class TSHandler {
  private assetsDirectory: string[] = [];
  private monoAssetTextBuffer: string[] = [];
  private tspPromptValues: TSPromptValues = {
    trafficSpawnMono: null,
    trafficMonoText: null,
    spawnType: null,
  };

  constructor() {
    try {
      this.assetsDirectory = getBaseAssets();
      this.displayAssetPaths();
      this.initializeTSPrompt();
    } catch (error: any) {
      errorLog({
        error,
      });
    }
  }

  /**
   * Logs asset paths in the console.
   */
  private displayAssetPaths(): void {
    this.assetsDirectory.forEach((path, index) => {
      console.log(brightYellow(`${index} `), brightBlue(`${path}`));
    });
  }

  /**
   * Prompts the user for TSP parameters, confirms inputs, and initializes TS processing.
   */
  private async initializeTSPrompt(): Promise<void> {
    try {
      this.tspPromptValues.trafficSpawnMono = await this
        .promptForAssetIndex(
          "Input traffic spawn asset index",
        );
      this.tspPromptValues.trafficMonoText = await this
        .promptForAssetIndex(
          "Input traffic mono text index",
        );
      this.tspPromptValues.spawnType = await this.promptForSpawnType();

      const confirmPrompt = await Toggle.prompt({
        message: "Are you sure the above files are correct?",
        default: true,
      });

      if (confirmPrompt) {
        this.initializeTS();
      }
    } catch (error: any) {
      errorLog({
        error,
        msg: "Error initializing TSPrompt values. Please check your inputs.",
      });
    } finally {
      restartApp();
    }
  }

  /**
   * Prompts the user for an asset index.
   * @param message - The message to display for the prompt.
   * @returns The selected asset path.
   */
  private async promptForAssetIndex(message: string): Promise<string> {
    const index = parseInt(
      await Input.prompt({
        message,
        validate: validators[0].cb,
        pointer: brightYellow(":"),
      }),
    );
    return this.assetsDirectory[index];
  }

  /**
   * Prompts the user to select spawn type.
   * @returns True if "Sometimes", false if "Oftens".
   */
  private async promptForSpawnType(): Promise<boolean> {
    return !!await Toggle.prompt({
      message: "Spawn as",
      inactive: "Oftens",
      active: "Sometimes",
      default: true,
    });
  }

  /**
   * Validates TSPrompt values and initiates TS processing steps.
   */
  private initializeTS(): void {
    try {
      if (!this.tspPromptValues.trafficSpawnMono) {
        throw new Error("Traffic Spawn Mono index is invalid.");
      }

      this.initializeMonoAssetBuffer();
      const fileHandler = new FileHandler({
        inputPath: pathGen(
          "assets",
          this.tspPromptValues.trafficSpawnMono,
        ),
        outPath: pathGen(
          "output",
          this.tspPromptValues.trafficSpawnMono,
        ),
      });

      if (
        fileHandler.buffer && fileHandler.buffer.length > 1 &&
        this.monoAssetTextBuffer.length > 0
      ) {
        this.manipulateDependencies(fileHandler.buffer);
        fileHandler.writeBuffer();
      }
    } catch (error: any) {
      errorLog({
        error,
      });
    }
  }

  /**
   * Populates mono asset buffer with lines from a specified file.
   */
  private initializeMonoAssetBuffer(): void {
    this.monoAssetTextBuffer = convertToLF(readFileSync(
      pathGen("assets", this.tspPromptValues.trafficMonoText!),
      "ascii",
    )).split("\n").filter((path) => path);

    if (!this.monoAssetTextBuffer || this.monoAssetTextBuffer.length < 1) {
      throw new Error(
        `No valid Mono assets found in ${this.tspPromptValues.trafficMonoText}`,
      );
    }
  }

  /**
   * Adds dependencies to the dependency parser's buffer.
   * @param buffer - Buffer of dependency data to modify.
   */
  private manipulateDependencies(buffer: string[]): void {
    try {
      const depParserIns = new DependencyParser({
        buffer: buffer,
        offset: 152,
      });

      this.monoAssetTextBuffer.forEach((name) => {
        depParserIns.modifyDependencySize({
          offset: depParserIns.existDependencies.slice(-1)[0].endOffset,
          name,
        });
        const { firstFile } = new FirstFileParser(buffer);

        this.manipulateSpeedType({
          buffer,
          firstFileOffset: firstFile.valueInt!,
          index: depParserIns.existDependencies.slice(-1)[0].index,
        });
        console.dir(`added => ${brightGreen(name)}`);
      });
    } catch (error: any) {
      errorLog({
        error,
        msg: `Error while manipulate dependencies operation`,
      });
    }
  }

  /**
   * Modifies the speed type settings in the provided buffer.
   *
   * This method updates the class size, calculates the offsets for "oftens"
   * and "sometimes" values, and replaces or inserts bytes in the buffer
   * according to the specified spawn type.
   *
   * @param arg - An object containing parameters for manipulation.
   * @param arg.buffer - The buffer to modify.
   * @param arg.firstFileOffset - The offset of the first file.
   * @param arg.index - The index of the dependency to manipulate.
   */
  private manipulateSpeedType(arg: ManipulateSpeedTypeParams): void {
    try {
      const classSizeParser = new ClassSizeParser({
        buffer: arg.buffer,
        offset: 128,
      });

      // Modify class size to a fixed value of 12
      classSizeParser.modifyClassSize({ int: 12 });

      const { pptr } = currentVersion.monoBehavior;
      const hexHandlerIns = new HexHandler(arg.buffer);
      const scriptId = arg.firstFileOffset + 48;
      const pptrByteLength = 12;

      // Retrieve "oftens" value from the buffer
      const oftensValue = hexToInt({
        hexBytes: arg.buffer.slice(scriptId, scriptId + pptr.arraySize),
        endian: pptr.endian,
      });

      const oftens = {
        start: scriptId,
        end: scriptId + pptr.arraySize,
        value: oftensValue,
      };

      // Retrieve "sometimes" value from the buffer
      const sometimesValue = hexToInt({
        hexBytes: arg.buffer.slice(
          (scriptId + pptr.arraySize) + (oftens.value * pptrByteLength),
          (scriptId + pptr.arraySize) + (oftens.value * pptrByteLength) +
            pptr.arraySize,
        ),
        endian: pptr.endian,
      });

      const sometimes = {
        start: (scriptId + pptr.arraySize) + (oftens.value * pptrByteLength),
        end: (scriptId + pptr.arraySize) + (oftens.value * pptrByteLength) +
        pptr.arraySize,
        value: sometimesValue,
      };

      // Create new PPtr BSITCarSettings path and file ID hex byte
      const newPPtr = [
        ...intToHexBytes({
          int: arg.index,
          minLength: pptr.fileId,
          endian: pptr.endian,
        }),
        ...intToHexBytes({
          int: 1,
          minLength: pptr.pathId,
          endian: pptr.endian,
        }),
      ];

      // Replace array length bytes based on the spawn type
      if (!this.tspPromptValues.spawnType) {
        hexHandlerIns.replaceBytes(
          oftens.start,
          intToHexBytes({
            int: oftens.value + 1,
            endian: pptr.endian,
            minLength: pptr.fileId,
          }),
        );

        hexHandlerIns.insertBytes(sometimes.start, newPPtr);
      } else {
        hexHandlerIns.replaceBytes(
          sometimes.start,
          intToHexBytes({ int: sometimes.value + 1, endian:pptr.endian, minLength: pptr.fileId }),
        );
        hexHandlerIns.insertBytes(arg.buffer.length, newPPtr);
      }

      // Modify asset size to a fixed value of 12
      const assetSizeParser = new AssetSizeParser(arg.buffer);
      assetSizeParser.modifyAssetSize({ int: 12 });
    } catch (error: any) {
      errorLog({
        error,
        msg: "Error while manipulating speed type",
      });
    }
  }
}
