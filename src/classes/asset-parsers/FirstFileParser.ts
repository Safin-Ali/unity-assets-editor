import type {
    FirstFileParserParams,
    ModifyFirstFileParams
} from "../../types/AssetParsers-custom.ts";
import { currentVersion } from "../../unity/version-structure.ts";
import { hexToInt } from "../../utils/common-utils.ts";
import { intToHexBytes } from "../../utils/common-utils.ts";
import HexHandler from "../HexHandler.ts";

/**
 * Class representing a parser for the first file.
 */
export class FirstFileParser {
    private buffer: string[];
    private hexIns: HexHandler;
    public firstFile: FirstFileParserParams = {
        offsetInt: null,
        endian: null,
        valueHex: null,
        valueInt: null
    };

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
        const { endian, start,end } = currentVersion.firstFile;
        this.firstFile.endian = endian;
        this.firstFile.offsetInt = start;

        const firstFileHex = this.buffer.slice(start, end);
        this.firstFile.valueHex = firstFileHex;
        this.firstFile.valueInt = hexToInt({ hexBytes: firstFileHex });
    }

    /**
     * Modifies the first file value in the buffer.
     *
     * @param {ModifyFirstFileParams} params - Parameters to modify the first file value.
     * @param {number} params.int - The integer value to modify the first file by.
     * @param {"inc" | "dec"} [params.operation="inc"] - The operation to perform on the first file value ("inc" to increase, "dec" to decrease).
     *
     * @throws {Error} If the first file values are not properly initialized.
     */
    public modifyFirstFile({ int, operation = "inc" }: ModifyFirstFileParams) {
        if (
            !this.firstFile.valueInt || !this.firstFile.endian ||
            !this.firstFile.offsetInt
        ) {
            throw new Error("First file Interface Issue");
        }

        const { endian } = currentVersion.firstFile;
        let newFirstFileBytes: string[] = intToHexBytes({
            int: this.firstFile.valueInt + int,
            endian,
        });

        if (operation === "dec") {
            newFirstFileBytes = intToHexBytes({
                int: this.firstFile.valueInt - int,
                endian,
            });
        }

        this.hexIns.replaceBytes(this.firstFile.offsetInt, newFirstFileBytes);
    }
}

