// deno-lint-ignore-file no-explicit-any
import {
  type AssetParserLabels,
  type DependencyParserArg,
  type ExistDependencies,
  initialAssetParserLabels,
  type ModifyDependencySizeParams,
} from "../../types/AssetParsers-custom.ts";
import { currentVersion } from "../../unity/version-structure.ts";
import {
  asciiToHexBytes,
  endSlice,
  errorLog,
  getNullBytes,
  hexBytesToAscii,
  hexToInt,
  warningLog,
} from "../../utils/common-utils.ts";
import { intToHexBytes } from "../../utils/common-utils.ts";
import HexHandler from "../HexHandler.ts";
import { AssetSizeParser } from "./AssetSizeParser.ts";
import { FirstFileParser } from "./FirstFileParser.ts";
import { MetaSizeParser } from "./MetaSizeParser.ts";

/**
 * Class representing a parser for dependencies within an asset.
 */
export class DependencyParser {
  private buffer: string[];
  private hexIns: HexHandler;
  public existDependencies: ExistDependencies[] = [];
  public dependency: AssetParserLabels = JSON.parse(
    JSON.stringify(initialAssetParserLabels),
  );

  /**
   * Creates an instance of DependencyParser.
   *
   * @param {DependencyParserArg} arg - The buffer containing hex values and offset.
   * @throws {TypeError} If the offsetInt is null.
   */
  constructor(arg: DependencyParserArg) {
    this.buffer = arg.buffer;
    this.dependency.offsetInt = arg.offset;

    if (!this.dependency.offsetInt) {
      throw new TypeError("Dependency Parser offsetInt field is null");
    }

    this.hexIns = new HexHandler(this.buffer);
    this.initDependencyParser();
  }

  /**
   * Initializes the dependency parser by extracting relevant data from the buffer.
   *
   * @private
   */
  private initDependencyParser() {
    try {
      const { dt, endian } = currentVersion.dep;
      this.dependency.endian = endian;
      this.dependency.dt = dt;

      const { offsetInt } = this.dependency;

      if (!offsetInt) {
        throw new TypeError("Wrong Data Type in Dependency Parser");
      }

      const depValueHex = this.buffer.slice(
        offsetInt,
        offsetInt + (this.dependency.dt - 1),
      );

      this.dependency.valueHex = depValueHex;
      this.dependency.valueInt = hexToInt({
        hexBytes: depValueHex,
        endian: this.dependency.endian,
      });

      this.initGetExistDependency();
    } catch (error: any) {
      errorLog({
        error,
      });
    }
  }

  /**
   * Modifies the size of the dependency in the buffer.
   *
   * @param {ModifyDependencySizeParams} params - Parameters for modifying the dependency size.
   * @param {string} params.name - The name of the dependency to modify.
   * @param {number} params.offset - The offset where the modification occurs.
   * @param {"add" | "dec"} [params.operation="add"] - The operation to perform on the dependency size.
   * @throws {TypeError} If the dependency values are not properly initialized.
   */
  public modifyDependencySize(
    { name, offset, operation = "add" }: ModifyDependencySizeParams,
  ) {
    const { dt, endian, offsetInt, valueInt } = this.dependency;
    if (
      !valueInt || !endian ||
      !offsetInt || !dt
    ) {
      throw new TypeError("Wrong Data Type in Dependency Parser");
    }

    const adjustment = operation === "add" ? 1 : -1;

    const newDepBytes = intToHexBytes({
      int: valueInt + adjustment,
      endian,
      minLength: (dt - 1),
    });

    let dependencyManipulateSts = false;
    if (operation === "add") {
      dependencyManipulateSts = this.addDependency(offset, name);
    } else {
      dependencyManipulateSts = this.removeDependency(name);
    }

    if (dependencyManipulateSts) {
      this.hexIns.replaceBytes(offsetInt, newDepBytes);
      this.initDependencyParser();
    }
  }

  /**
   * Adds a new dependency to the buffer.
   *
   * @param {number} offset - The offset where the new dependency will be inserted.
   * @param {string} newDepName - The name of the new dependency.
   * @returns {boolean} - True if the dependency was added successfully, otherwise false.
   */
  private addDependency(offset: number, newDepName: string): boolean {
    try {
      if (
        this.existDependencies.length > 0 &&
        this.dependencyExist(newDepName)
      ) {
        warningLog(`${newDepName} already exist`);
        return false;
      }

      const { dependencyByteLeng, nullByte } = currentVersion.dep;

      this.hexIns.insertBytes(offset, [
        ...getNullBytes(nullByte),
        ...asciiToHexBytes(newDepName),
      ]);

      const newInsertBytes = dependencyByteLeng + nullByte;

      new AssetSizeParser(this.buffer).modifyAssetSize({
        int: newInsertBytes + 10,
      });
      new FirstFileParser(this.buffer).modifyFirstFile({
        int: newInsertBytes,
      });
      new MetaSizeParser(this.buffer).modifyMetaSize({
        int: newInsertBytes,
      });

      return true;
    } catch (error) {
      errorLog({
        error,
        msg: "Error while add dependencies",
      });
      return false;
    }
  }

  /**
   * Removes an existing dependency from the buffer.
   *
   * @param {string} name - The name of the dependency to remove.
   * @returns {boolean} - True if the dependency was removed successfully, otherwise false.
   */
  private removeDependency(name: string): boolean {
    try {

      if (this.existDependencies.length < 0) {
        warningLog(`no dependencies exist`);
        return false;
      }

      const existDependency = this.dependencyExist(name);;

      if(!existDependency) {
         warningLog(`${name} dependency exist`);
         return false
      }

      const { dependencyByteLeng, nullByte } = currentVersion.dep;
      const removeInsertBytes = dependencyByteLeng + nullByte;

      new AssetSizeParser(this.buffer).modifyAssetSize({
        int: removeInsertBytes,
      });
      this.hexIns.removeBytes(existDependency.startOffset, existDependency.name.length);

      new FirstFileParser(this.buffer).modifyFirstFile({
        int: removeInsertBytes,
        operation: "dec",
      });
      new MetaSizeParser(this.buffer).modifyMetaSize({
        int: removeInsertBytes,
        operation: "dec",
      });

      this.existDependencies.splice(existDependency.index - 1, 1);

      return true;
    } catch (error) {
      errorLog({
        error,
        msg: "Error while remove dependencies",
      });
      return false;
    }
  }

  /**
   * Initializes and retrieves existing dependencies from the buffer.
   *
   * @private
   */
  private initGetExistDependency() {
    this.existDependencies = [];
    try {
      const { dependencyByteLeng, nullByte } = currentVersion.dep;
      const { offsetInt, dt, valueInt, endian } = this.dependency;

      if (!valueInt) {
        return;
      }

      if (
        !endian ||
        !offsetInt || !dt
      ) {
        throw new TypeError("Wrong Data Type in Dependency Parser");
      }
      let currDepOffset = offsetInt! + (dt - 1);

      for (let index = 1; index <= this.dependency.valueInt!; index++) {
        let currDepByteLeng = dependencyByteLeng;
        let depName = hexBytesToAscii(
          this.buffer.slice(
            currDepOffset + nullByte,
            currDepOffset + (nullByte + currDepByteLeng),
          ),
        );

        if (this.isGlobalManager(depName)) {
          currDepByteLeng = 25; // Adjust byte length for global manager
          depName = hexBytesToAscii(
            this.buffer.slice(
              currDepOffset + nullByte,
              currDepOffset + (nullByte + currDepByteLeng),
            ),
          );
        }

        const endOffset = currDepOffset + (currDepByteLeng + nullByte);
        this.existDependencies.push({
          name: depName,
          index,
          startOffset: currDepOffset,
          endOffset,
        });

        currDepOffset = endOffset;
      }
    } catch (error) {
      errorLog({
        error,
        msg: "Error while finding existing dependencies",
      });
    }
  }

  /**
   * Checks if the dependency name is a global manager.
   *
   * @param {string} depName - The name of the dependency to check.
   * @returns {boolean} - True if the dependency is a global manager, otherwise false.
   */
  private isGlobalManager(depName: string): boolean {
    return endSlice(depName, 7) === "globalgamemanagers.assets";
  }

  /**
   * Checks if a dependency exists by its name.
   *
   * @param {string} dependencyName - The name of the dependency to check.
   * @returns {ExistDependencies | null} - The existing dependency if found, otherwise null.
   */
  public dependencyExist (dependencyName:string):ExistDependencies | null   {
    return this.existDependencies.find(({ name }) => name === dependencyName) || null;
  }
}
