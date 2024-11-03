// deno-lint-ignore-file no-explicit-any
import {
initialAssetParserLabels,
  type AssetSizeParserParams,
  type ModifyFirstFileParams,
} from "../../types/AssetParsers-custom.ts";
import { currentVersion } from "../../unity/version-structure.ts";
import { errorLog, hexToInt } from "../../utils/common-utils.ts";
import { intToHexBytes } from "../../utils/common-utils.ts";
import HexHandler from "../HexHandler.ts";

/**
 * Class representing a parser for asset sizes in a hex buffer.
 */
export class AssetSizeParser {
  private buffer: string[];
  private hexIns: HexHandler;
  public assetSize: AssetSizeParserParams = JSON.parse(JSON.stringify(initialAssetParserLabels));

  /**
   * Creates an instance of AssetSizeParser.
   *
   * @param {string[]} buffer - The buffer containing hex values as strings.
   */
  constructor(buffer: string[]) {
    this.buffer = buffer;
    this.hexIns = new HexHandler(this.buffer);
    this.initAssetSizeParser();
  }

  /**
   * Initializes the asset size parser by setting up the offset and extracting
   * the asset size values from the buffer.
   *
   * @private
   */
  private initAssetSizeParser() {
    try {
      const { endian, start, dt } = currentVersion.assetSize;
      this.assetSize.endian = endian;
      this.assetSize.offsetInt = start;
      this.assetSize.dt = dt;
      const assetSizeHex = this.buffer.slice(start, (start+dt));
      this.assetSize.valueHex = assetSizeHex;
      this.assetSize.valueInt = hexToInt({
        hexBytes: assetSizeHex,
        endian
      });
    } catch (error: any) {
      errorLog({
        error,
      });
    }
  }

  /**
   * Modifies the asset size value in the buffer.
   *
   * @param {ModifyFirstFileParams} params - Parameters to modify the asset size.
   * @param {number} params.int - The integer value to modify the asset size by.
   * @param {"inc" | "dec"} [params.operation="inc"] - The operation to perform on the asset size value ("inc" to increase, "dec" to decrease).
   *
   * @throws {TypeError} If the asset size values are not properly initialized.
   */
  public modifyAssetSize({ int, operation = "inc" }: ModifyFirstFileParams) {
    try {
      const {dt,endian,offsetInt,valueInt} = this.assetSize;
      if (
        !valueInt || !endian ||
        !offsetInt || !dt
      ) {
        throw new TypeError("Asset Size Interface Issue");
      }
      let newAssetSizeBytes: string[] = intToHexBytes({
        int: valueInt + int,
        endian,
        minLength:dt
      });

      if (operation === "dec") {
        newAssetSizeBytes = intToHexBytes({
          int: valueInt - int,
          endian,
          minLength:dt
        });
      }

      this.hexIns.replaceBytes(
        offsetInt,
        newAssetSizeBytes,
      );
      this.initAssetSizeParser();
    } catch (error: any) {
      errorLog({
        error,
        msg: "Error while modify asset size",
      });
    }
  }
}
