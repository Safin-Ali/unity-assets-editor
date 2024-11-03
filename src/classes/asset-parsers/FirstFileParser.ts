// deno-lint-ignore-file no-explicit-any
import {
initialAssetParserLabels,
  type FirstFileParserParams,
  type ModifyFirstFileParams,
} from "../../types/AssetParsers-custom.ts";
import { currentVersion } from "../../unity/version-structure.ts";
import { errorLog, getNullBytes } from "../../utils/common-utils.ts";
import { hexToInt, padHexOffset } from "../../utils/common-utils.ts";
import { intToHexBytes } from "../../utils/common-utils.ts";
import HexHandler from "../HexHandler.ts";

/**
 * Class representing a parser for the first file.
 */
export class FirstFileParser {
  private buffer: string[];
  private hexIns: HexHandler;
  public firstFile: FirstFileParserParams = JSON.parse(JSON.stringify(initialAssetParserLabels));

  /**
   * Creates an instance of FirstFileParser.
   *
   * @param {string[]} buffer - The buffer containing hex values as strings.
   */
  constructor(buffer: string[]) {
    this.buffer = buffer;
    this.hexIns = new HexHandler(this.buffer);
    this.initFirstFileParser();
  }

  /**
   * Initializes the first file parser by setting up the offset and extracting
   * the meta size values from the buffer.
   *
   * @private
   */
  private initFirstFileParser() {
    try {
      const { endian, start, dt } = currentVersion.firstFile;
      this.firstFile.endian = endian;
      this.firstFile.offsetInt = start;
      this.firstFile.dt = dt;

      const firstFileHex = this.buffer.slice(start, (start+dt));
      this.firstFile.valueHex = firstFileHex;
      this.firstFile.valueInt = hexToInt({
         hexBytes: firstFileHex,
         endian
        });
    } catch (error: any) {
      errorLog({
        error,
      });
    }
  }

  /**
   * Modifies the first file value in the buffer.
   *
   * @param {ModifyFirstFileParams} params - Parameters to modify the first file value.
   * @param {number} params.int - The integer value to modify the first file by.
   * @param {"inc" | "dec"} [params.operation="inc"] - The operation to perform on the first file value ("inc" to increase, "dec" to decrease).
   *
   * @throws {TypeError} If the first file values are not properly initialized.
   */
  public modifyFirstFile({ int, operation = "inc" }: ModifyFirstFileParams) {
    try {
      const {dt,endian,valueInt,offsetInt} = this.firstFile;
      if (
        !valueInt || !endian ||
        !offsetInt || !dt
      ) {
        throw new TypeError("Wrong Data Type in FirstFile Parser");
      }

      const { offsetBoundary } = currentVersion.firstFile;
      let newFirstFileBytes: string[] = intToHexBytes({
        int:valueInt + int,
        endian,
        minLength:dt
      });

      if (operation === "dec") {
        newFirstFileBytes = intToHexBytes({
          int: valueInt - int,
          endian,
          minLength:dt
        });
      }

      this.hexIns.replaceBytes(
        offsetInt,
        newFirstFileBytes,
      );

      this.initFirstFileParser();

      if (offsetBoundary.status && offsetBoundary.boundary) {
        this.firstFileOffsetAlignFix();
      }
    } catch (error: any) {
      errorLog({
        error,
      });
    }
  }

  /**
   * Adjusts the first file's offset to align with the specified boundary.
   *
   * This method checks if the current offset ends at the specified offset boundary.
   * If not, it calculates the necessary padding and updates the buffer with the
   * aligned offset, inserting null bytes as needed to ensure correct alignment.
   *
   * @private
   * @throws {TypeError} If the first file values are not properly initialized.
   */
  private firstFileOffsetAlignFix() {
    try {
      const {dt,endian,valueInt,offsetInt,valueHex} = this.firstFile;
      if (
        !valueInt || !endian ||
        !offsetInt || !dt || !valueHex
      ) {
        throw new TypeError("Wrong Data Type in FirstFile Parser");
      }

      // Calculate gap length and new hex bytes for alignment
      const { gapLength, newHexBytes } = padHexOffset({
        hexBytes: valueHex,
        offsetBoundary: currentVersion.firstFile.offsetBoundary.boundary,
      });

      // Generate null bytes for padding
      const nullBytes = getNullBytes(gapLength);

      // Replace original bytes with aligned bytes
      this.hexIns.replaceBytes(offsetInt, newHexBytes);

      // Insert padding null bytes at the appropriate position
      this.hexIns.insertBytes(valueInt, nullBytes);

      // Re-initialize the first file parser to reflect updates
      this.initFirstFileParser();
    } catch (error: any) {
      errorLog({
        error,
      });
    }
  }
}
