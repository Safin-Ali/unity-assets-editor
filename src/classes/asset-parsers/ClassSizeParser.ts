import type {
    ClassSizeParams,
    ClassSizeParserArg,
    ModifyFirstFileParams
} from "../../types/AssetParsers-custom.ts";
import { currentVersion } from "../../unity/version-structure.ts";
import { hexToInt } from "../../utils/common-utils.ts";
import { intToHexBytes } from "../../utils/common-utils.ts";
import HexHandler from "../HexHandler.ts";

/**
 * Class representing a parser for asset sizes in a hex buffer.
 */
export class ClassSizeParser {
    private buffer: string[];
    private hexIns: HexHandler;
    public classSize: ClassSizeParams = {
        offsetInt: null,
        endian: null,
        valueHex: null,
        valueInt: null,
    };

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
        const { endian } = currentVersion.classSize;
        this.classSize.endian = endian;

        const classSizeHex = this.buffer.slice(this.classSize.offsetInt!, this.classSize.offsetInt! + 2);
        this.classSize.valueHex = classSizeHex;
        this.classSize.valueInt = hexToInt({ hexBytes: classSizeHex, endian: this.classSize.endian });
    }

    /**
     * Modifies the asset size value in the buffer.
     *
     * @param {ModifyFirstFileParams} params - Parameters to modify the asset size.
     * @param {number} params.int - The integer value to modify the asset size by.
     * @param {"inc" | "dec"} [params.operation="inc"] - The operation to perform on the asset size value ("inc" to increase, "dec" to decrease).
     * 
     * @throws {Error} If the asset size values are not properly initialized.
     */
    public modifyClassSize({ int, operation = "inc" }: ModifyFirstFileParams) {
        if (!this.classSize.valueInt || !this.classSize.endian || this.classSize.offsetInt === null) {
            throw new Error("Class Size Interface Issue");
        }

        let newClassSizeValue = this.classSize.valueInt;

        if (operation === "inc") {
            newClassSizeValue += int;
        } else if (operation === "dec") {
            newClassSizeValue -= int;
        } else {
            throw new Error("Invalid operation. Use 'inc' or 'dec'.");
        }

        const newClassSizeBytes = intToHexBytes({
            int: newClassSizeValue,
            endian: this.classSize.endian,
        });

        this.hexIns.replaceBytes(this.classSize.offsetInt, newClassSizeBytes);
        this.initClassSize();
    }
}
