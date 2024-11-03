import {
  type ClassSizeParams,
  type ClassSizeParserArg,
  initialAssetParserLabels,
  type ModifyFirstFileParams,
} from "../../types/AssetParsers-custom.ts";
import { currentVersion } from "../../unity/version-structure.ts";
import { errorLog, hexToInt } from "../../utils/common-utils.ts";
import { intToHexBytes } from "../../utils/common-utils.ts";
import HexHandler from "../HexHandler.ts";

/**
 * Class representing a parser for asset sizes in a hex buffer.
 */
export class ClassSizeParser {
  private buffer: string[];
  private hexIns: HexHandler;
  public classSize: ClassSizeParams = JSON.parse(
    JSON.stringify(initialAssetParserLabels),
  );

  /**
   * Creates an instance of ClassSizeParser.
   *
   * @param {ClassSizeParserArg} arg - The argument containing the buffer and offset.
   * @param {string[]} arg.buffer - The buffer containing hex values as strings.
   * @param {number} arg.offset - The offset in the buffer to read the class size from.
   *
   * @throws {Error} If the offset is null.
   */
  constructor(arg: ClassSizeParserArg) {
    this.buffer = arg.buffer;
    this.classSize.offsetInt = arg.offset;
    this.hexIns = new HexHandler(this.buffer);
    if (this.classSize.offsetInt === null) {
      throw new Error("Class Size Parser offsetInt field is null");
    }
    this.initClassSize();
  }

  /**
   * Initializes the asset size parser by setting up the offset and extracting
   * the asset size values from the buffer.
   *
   * @private
   */
  private initClassSize() {
    try {
      const { endian, dt } = currentVersion.classSize;
      this.classSize.endian = endian;
      this.classSize.dt = dt;

      const classSizeHex = this.buffer.slice(
        this.classSize.offsetInt!,
        this.classSize.offsetInt! + dt,
      );
      this.classSize.valueHex = classSizeHex;
      this.classSize.valueInt = hexToInt({
        hexBytes: classSizeHex,
        endian,
      });
    } catch (error) {
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
  public modifyClassSize({ int, operation = "inc" }: ModifyFirstFileParams) {
    try {
      let newClassSizeValue = this.classSize.valueInt!;

      const { dt, endian } = this.classSize;

      if (operation === "inc") {
        newClassSizeValue += int;
      } else if (operation === "dec") {
        newClassSizeValue! -= int;
      } else {
        throw new TypeError("Invalid operation. Use 'inc' or 'dec'.");
      }

      if (!endian || !dt) {
        throw new TypeError("Class Size Parser Wrong Data Type");
      }

      const newClassSizeBytes = intToHexBytes({
        int: newClassSizeValue!,
        endian,
        minLength: dt,
      });

      this.hexIns.replaceBytes(
        this.classSize.offsetInt!,
        newClassSizeBytes,
      );
      this.initClassSize();
    } catch (error) {
      errorLog({
        error,
        msg: "Error while modify class size",
      });
    }
  }
}
