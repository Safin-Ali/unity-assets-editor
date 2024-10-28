import type {
    AssetParserLabels,
    ModifyMetaSizeParams,
} from "../../types/AssetParsers-custom.ts";
import { currentVersion } from "../../unity/version-structure.ts";
import { errorLog, hexToInt } from "../../utils/common-utils.ts";
import { intToHexBytes } from "../../utils/common-utils.ts";
import HexHandler from "../HexHandler.ts";

export class MetaSizeParser {
    private buffer: string[];
    private hexIns: HexHandler;
    public metaSize: AssetParserLabels = {
        offsetHex: null,
        offsetInt: null,
        valueHex: null,
        valueInt: null,
        endian: null,
    };
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
            this.metaSize.endian = currentVersion.metaSize.endian;

            this.metaSize.offsetInt = currentVersion.metaSize.start;
            this.metaSize.offsetHex = intToHexBytes({
                int: currentVersion.metaSize.start,
            });

            const metaSizeHex = this.buffer.slice(
                this.metaSize.offsetInt,
                currentVersion.metaSize.end,
            );

            this.metaSize.valueHex = metaSizeHex;

            this.metaSize.valueInt = hexToInt({ hexBytes: metaSizeHex });
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
            if (
                !this.metaSize.valueInt || !this.metaSize.endian ||
                !this.metaSize.offsetInt
            ) {
                throw new Error("Meta Size Interface Issue");
            }
            const endian = currentVersion.metaSize.endian;
            let newMetaSizeBytes: string[] = intToHexBytes({
                int: this.metaSize.valueInt + int,
                endian,
            });
            if (operation === "dec") {
                newMetaSizeBytes = intToHexBytes({
                    int: this.metaSize.valueInt - int,
                    endian,
                });
            }

            this.hexIns.replaceBytes(this.metaSize.offsetInt, newMetaSizeBytes);
            this.initMetaSizeParser();
        } catch (error) {
            errorLog({
                error,
            });
        }
    }
}
