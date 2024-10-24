import type {
    AssetSizeParserParams,
    ModifyFirstFileParams
} from "../../types/AssetParsers-custom.ts";
import { currentVersion } from "../../unity/version-structure.ts";
import { hexToInt } from "../../utils/common-utils.ts";
import { intToHexBytes } from "../../utils/common-utils.ts";
import HexHandler from "../HexHandler.ts";

/**
 * Class representing a parser for asset sizes in a hex buffer.
 */
export class AssetSizeParser {
    private buffer: string[];
    private hexIns: HexHandler;
    public assetSize: AssetSizeParserParams = {
        offsetInt: null,
        endian: null,
        valueHex: null,
        valueInt: null,
    };

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
        const { endian, start, end } = currentVersion.assetSize;
        this.assetSize.endian = endian;
        this.assetSize.offsetInt = start;

        const assetSizeHex = this.buffer.slice(start, end);
        this.assetSize.valueHex = assetSizeHex;
        this.assetSize.valueInt = hexToInt({ hexBytes: assetSizeHex });
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
    public modifyAssetSize({ int, operation = "inc" }: ModifyFirstFileParams) {
        if (
            !this.assetSize.valueInt || !this.assetSize.endian ||
            !this.assetSize.offsetInt
        ) {
            throw new Error("Asset Size Interface Issue");
        }
        let newAssetSizeBytes: string[] = intToHexBytes({
            int: this.assetSize.valueInt + int,
            endian:this.assetSize.endian,
        });

        if (operation === "dec") {
            newAssetSizeBytes = intToHexBytes({
                int: this.assetSize.valueInt - int,
                endian:this.assetSize.endian,
            });
        }

        this.hexIns.replaceBytes(this.assetSize.offsetInt, newAssetSizeBytes);
        this.initAssetSizeParser();
    }
}
