import {
    BlockField,
    CDFH,
    EOCHD,
    LFH,
} from "../types/ZipDeserializer-custom.ts";
import {
    asciiToHexBytes,
    errorLog,
    getNullBytes,
    hexBytesToAscii,
    hexToInt,
    intToHexBytes,
} from "../utils/common-utils.ts";
import HexHandler from "./HexHandler.ts";

/**
 * A class responsible for deserializing and parsing ZIP file headers including EOCD, CDFH, and LFH.
 * It provides functionality for reading the End of Central Directory (EOCD), Central Directory File Header (CDFH),
 * and Local File Header (LFH) from a buffer of hex data.
 */
export class ZipDeserializer {
    // The End of Central Directory (EOCD) header, if found.
    public EOCD: EOCHD | null = null;

    /** List of Central Directory File Headers (CDFH) parsed from the buffer. */
    public CDFH: CDFH[] = [];

    /** List of Local File Headers (LFH) parsed from the buffer. */
    public LFH: LFH[] = [];

    /** Internal buffer holding the hexadecimal byte data. */
    private buffer: string[];

    /** Instance of HexHandler to assist in searching and processing hex data. */
    public hexHandler: HexHandler;

    // Signatures used for identifying EOCD and CDFH headers.
    private singnatures = {
        EOCHD: ["50", "4B", "05", "06"],
        CDFH: ["50", "4B", "01", "02"],
    };

    /**
     * Constructs a ZipDeserializer instance to process a ZIP file buffer.
     *
     * @param buffer - A buffer array of hex strings representing the ZIP file data.
     */
    constructor(buffer: string[]) {
        this.hexHandler = new HexHandler(buffer);
        this.buffer = buffer;
        this.initializeZipDeserializer();
    }

    /**
     * Initializes the deserialization process by parsing EOCD, CDFH, and LFH headers.
     * Logs errors if any of the headers cannot be parsed.
     */
    private initializeZipDeserializer() {
        try {
            this.initializeEOCD();
            if (!this.EOCD) {
                this.errorMsg("Invalid ZIP");
                return;
            }

            this.initializeCDFH();
            if (this.CDFH.length === 0) {
                this.errorMsg("Invalid ZIP");
                return;
            }

            this.initializeLFH();
        } catch (err) {
            this.errorMsg("Error during ZIP deserialization", err);
        }
    }

    /**
     * Parses and initializes the End of Central Directory (EOCD) header.
     * Extracts key information such as the total number of records, record size, and start offset.
     */
    private initializeEOCD() {
        try {
            const eochd_sing = this.hexHandler.findIndex(
                this.singnatures.EOCHD,
            );
            if (eochd_sing.length !== 1) {
                errorLog({
                    error: null,
                    cb: () => {},
                    msg: "EOCD signature not found.",
                });
            }
            const eochdStartOffset = eochd_sing[0].end;
            this.EOCD = this.extractEOCDFields(eochdStartOffset);
        } catch (err) {
            this.errorMsg("Error while initializing EOCD", err);
        }
    }

    /**
     * Extracts EOCD fields from the provided starting offset.
     *
     * @param eochdStartOffset - The start offset of the EOCD header in the buffer.
     * @returns EOCD object containing parsed fields (CDHFTotalRecord, CDHFNumberRecord, etc.).
     */
    private extractEOCDFields(eochdStartOffset: number): EOCHD {
        try {
            const CDHFTotalRecord = this.buffer.slice(
                eochdStartOffset + 7,
                eochdStartOffset + 9,
            );
            const CDHFNumberRecord = this.buffer.slice(
                eochdStartOffset + 5,
                eochdStartOffset + 7,
            );
            const CDHFBytesSize = this.buffer.slice(
                eochdStartOffset + 9,
                eochdStartOffset + 13,
            );
            const CDHFStartOffset = this.buffer.slice(
                eochdStartOffset + 13,
                eochdStartOffset + 17,
            );
            const offset = eochdStartOffset - 3;

            return {
                CDHFTotalRecord: this.createBlockField(CDHFTotalRecord),
                CDHFNumberRecord: this.createBlockField(CDHFNumberRecord),
                CDHFBytesTotalSize: this.createBlockField(CDHFBytesSize),
                CDHFStartOffset: this.createBlockField(CDHFStartOffset),
                offset,
            };
        } catch (err) {
            this.errorMsg("Error extracting EOCD fields", err);
            throw err; // Rethrow the error after logging it.
        }
    }

    /**
     * Helper method to create a BlockField object containing both the hex string array and the integer value.
     *
     * @param hexBytes - The hex bytes array to process.
     * @returns A BlockField object containing the hex and integer value.
     */
    private createBlockField(hexBytes: string[]): BlockField {
        try {
            return {
                hex: hexBytes,
                int: hexToInt({ hexBytes, endian: "little" }),
            };
        } catch (err) {
            this.errorMsg("Error creating BlockField", err);
            throw err;
        }
    }

    /**
     * Parses and initializes the Central Directory File Headers (CDFH) from the EOCD data.
     * CDFH headers are sliced from the buffer and parsed based on the EOCD information.
     */
    private initializeCDFH() {
        try {
            const { CDHFBytesTotalSize, CDHFStartOffset } = this.EOCD!;

            const CDFHBuffer = this.buffer.slice(
                CDHFStartOffset.int,
                CDHFStartOffset.int + CDHFBytesTotalSize.int,
            );
            const nestHexHandler = new HexHandler(CDFHBuffer);
            const CDFHBufferArr = nestHexHandler.findIndex(
                this.singnatures.CDFH,
            );

            CDFHBufferArr.forEach(({ start }) => {
                const startOffset = CDHFStartOffset.int + start;
                this.parseCDFHFields(startOffset);
            });
        } catch (err) {
            this.errorMsg("Error while initializing CDFH", err);
        }
    }

    /**
     * Parses a CDFH entry and extracts relevant fields such as extVersion, crc32, and fileName.
     *
     * @param startOffset - The start offset of the current CDFH header in the buffer.
     * @param endOffset - The end offset of the current CDFH header.
     */
    private parseCDFHFields(startOffset: number) {
        try {
            const extVersion = this.createBlockField(
                this.buffer.slice(startOffset + 6, startOffset + 8),
            );
            const crc32 = this.createBlockField(
                this.buffer.slice(startOffset + 16, startOffset + 20),
            );
            const fileNameLength = hexToInt({
                hexBytes: this.buffer.slice(startOffset + 28, startOffset + 30),
                endian: "little",
            });
            const fileName = hexBytesToAscii(
                this.buffer.slice(
                    startOffset + 46,
                    startOffset + (46 + fileNameLength),
                ),
            );

            this.CDFH.push({
                offset: startOffset,
                extVersion,
                crc32,
                fileName,
            });
        } catch (err) {
            this.errorMsg("Error parsing CDFH fields", err);
        }
    }

    /**
     * Parses and initializes the Local File Headers (LFH) based on the CDFH data.
     */
    private initializeLFH() {
        try {
            this.CDFH.forEach(({ offset, fileName, crc32 }) => {
                const LFHoffset = hexToInt({
                    hexBytes: this.buffer.slice(offset + 42, offset + 46),
                    endian: "little",
                });

                this.LFH.push({
                    offset: LFHoffset,
                    crc32,
                    fileName,
                });
            });
        } catch (err) {
            this.errorMsg("Error while initializing LFH", err);
        }
    }

    /**
     * Logs an error message and performs any additional error handling.
     *
     * @param message - The error message to display.
     * @param error - The actual error object that was thrown.
     */
    // deno-lint-ignore no-explicit-any
    private errorMsg(message: string, error?: any) {
        errorLog({ msg: message, error: error });
    }

        /**
     * Damages the ZIP file by modifying key headers (LFH, CDFH, EOCD) to render it invalid.
     * This can be used for protection purposes to prevent unauthorized extraction or manipulation
     * of the ZIP file. The modifications include nullifying specific fields and inserting fake data
     * to disrupt standard ZIP extraction tools.
     *
     * The modifications performed by this method include:
     * - Nullifying CRC32 values and file/folder name characters in the Local File Headers (LFH).
     * - Nullifying version information in the Central Directory File Headers (CDFH) for specific files.
     * - Modifying the End of Central Directory (EOCD) header, including altering the number of records
     *   and total records, as well as adding custom data (e.g., credit message and fake CDFH entry) to prevent ZIP repair tools from reading it.
     *
     * This method is specifically designed to interfere with standard ZIP repair or extraction processes
     * while maintaining the integrity of the ZIP structure.
     *
     * @returns {boolean} - Returns `true` if the ZIP was successfully damaged, `false` otherwise. 
     *                      The method will return `false` if any critical ZIP headers (EOCD, CDFH, LFH)
     *                      are missing or invalid.
     */
    public damageZip(): boolean {
        if (!this.LFH || !this.CDFH || !this.EOCD) {
            errorLog({
                error: null,
                cb: () => {},
                msg: "Invalid ZIP! Can't Protect",
            });

            return false;
        }

        /**
         * modify LFH
         * CRC32 bytes to null
         *
         * file or folder name first character byte to null
         */

        this.LFH.forEach(({ offset }) => {
            // null CRC2
            this.hexHandler.replaceBytes(offset + 14, getNullBytes(4));

            // null file or folder name first character
            this.hexHandler.replaceBytes(offset + 30, getNullBytes(1));
        });

        /**
         * modify CDFH
         * the version needed to extract bytes to null
         */

        this.CDFH.forEach(({ offset,fileName }) => {

            if(fileName === "unity_obb_guid")
                return;
            // null version needed to extract bytes
            this.hexHandler.replaceBytes(offset + 6, getNullBytes(2));
        });

        /**
         * modify EOCD
         * Addition 5 Number of central directory records on this disk each byte.
         *
         * Addition 5 Total number of central directory records each byte.
         *
         * Add Credit and then add another unknown CDFH
         */

        // addition 5 NCDR and TCDR
        const {
            CDHFNumberRecord,
            CDHFTotalRecord,
            offset,
        } = this.EOCD;

        const damagedNCDRBytes = CDHFNumberRecord.hex.map((byte) => {
            const currentByteInt = hexToInt({
                hexBytes: [byte],
                endian: "little",
            });

            return intToHexBytes({ int: currentByteInt + 5, endian: "little" });
        });

        const damagedTCDRBytes = CDHFTotalRecord.hex.map((byte) => {
            const currentByteInt = hexToInt({
                hexBytes: [byte],
                endian: "little",
            });

            return intToHexBytes({ int: currentByteInt + 5, endian: "little" });
        });

        this.hexHandler.replaceBytes(
            offset + 8,
            damagedNCDRBytes.flat(),
        );

        this.hexHandler.replaceBytes(
            offset + 10,
            damagedTCDRBytes.flat(),
        );

        /**
         * Add Credit and AEM CDFH
         */

        const creditByte = asciiToHexBytes(
            "This Achive Protected By ZDamager (SA)",
        );

        // that anti extract bytes prevents some zip repair tool to read that zip as invalid and tools can't unpack
        const AEMCDFHByte = [
            "00",
            "50",
            "4B",
            "01",
            "02",
            "1F",
            "00",
            "0A",
            "00",
            "01",
            ...getNullBytes(3),
            "43",
            "03",
            "0D",
            "03",
            "34",
            "97",
            "C0",
            "53",
            "59",
            ...getNullBytes(3),
            "59",
            ...getNullBytes(3),
            "29",
            "00",
            "23",
            ...getNullBytes(7),
            "20",
            ...getNullBytes(3),
            "90",
            "C6",
            "6C",
            "05",
        ];

        this.hexHandler.insertBytes(offset + 22, [
            ...creditByte,
            ...AEMCDFHByte,
        ]);
        return true;
    }
}
