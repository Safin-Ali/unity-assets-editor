import {
  type AssetParserLabels,
  initialAssetParserLabels,
  type ModifyMetaSizeParams,
} from "../../types/AssetParsers-custom.ts";
import { currentVersion } from "../../unity/version-structure.ts";
import { errorLog, hexToInt } from "../../utils/common-utils.ts";
import { intToHexBytes } from "../../utils/common-utils.ts";
import HexHandler from "../HexHandler.ts";

export class MetaSizeParser {
  private buffer: string[];
  private hexIns: HexHandler;
  public metaSize: AssetParserLabels = JSON.parse(
    JSON.stringify(initialAssetParserLabels),
  );
  /**
   * Creates an instance of MetaSizeParser.
   *
   * @param {string[]} buffer - The buffer containing hex values as strings.
   */
  constructor(buffer: string[]) {
    this.buffer = buffer;
    this.hexIns = new HexHandler(this.buffer);
    this.initMetaSizeParser();
  }

  /**
   * Initializes the meta size parser by setting up the offset and extracting the
   * meta size values from the buffer.
   *
   * @private
   */
  private initMetaSizeParser() {
    try {
      const { dt, endian, start } = currentVersion.metaSize;
      this.metaSize.endian = endian;

      this.metaSize.offsetInt = start;
      this.metaSize.dt = dt;

      const metaSizeHex = this.buffer.slice(
        start,
        start + dt,
      );

      this.metaSize.valueHex = metaSizeHex;

      this.metaSize.valueInt = hexToInt({
        hexBytes: metaSizeHex,
        endian,
      });
    } catch (error) {
      errorLog({
        error,
      });
    }
  }

  /**
   * Modifies the meta size value in the buffer.
   *
   * @param {ModifyMetaSizeParams} params - Parameters to modify the meta size.
   * @param {number} params.int - The integer value to modify the meta size by.
   * @param {"inc" | "dec"} [params.operation="inc"] - The operation to perform on the meta size ("inc" to increase, "dec" to decrease).
   *
   * @throws {Error} If the meta size values are not properly initialized.
   */
  public modifyMetaSize({ int, operation = "inc" }: ModifyMetaSizeParams) {
    try {
      const { dt, endian, valueInt, offsetInt } = this.metaSize;
      if (
        !valueInt || !endian ||
        !offsetInt || !dt
      ) {
        throw new TypeError("Wrong Data Type in MetaSize Parser");
      }
      let newMetaSizeBytes: string[] = intToHexBytes({
        int: valueInt + int,
        endian,
        minLength: dt,
      });

      if (operation === "dec") {
        newMetaSizeBytes = intToHexBytes({
          int: valueInt - int,
          endian,
          minLength: dt,
        });
      }

      this.hexIns.replaceBytes(offsetInt, newMetaSizeBytes);

      this.initMetaSizeParser();
    } catch (error) {
      errorLog({
        error,
      });
    }
  }
}
