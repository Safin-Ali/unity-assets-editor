import { BlockField, CDFH, EOCHD, LFH } from "../types/ZipDeserializer-custom.ts";
import { errorLog, hexBytesToAscii, hexToInt } from "../utils/common-utils.ts";
import HexHandler from "./HexHandler.ts";

/**
 * A class responsible for deserializing and parsing ZIP file headers including EOCD, CDFH, and LFH.
 * It provides functionality for reading the End of Central Directory (EOCD), Central Directory File Header (CDFH),
 * and Local File Header (LFH) from a buffer of hex data.
 */
export class ZipDeserializer {
    /** The End of Central Directory (EOCD) header, if found. */
    public EOCD: EOCHD | null = null;

    /** List of Central Directory File Headers (CDFH) parsed from the buffer. */
    public CDFH: CDFH[] = [];

    /** List of Local File Headers (LFH) parsed from the buffer. */
    public LFH: LFH[] = [];

    /** Internal buffer holding the hexadecimal byte data. */
    private buffer: string[];

    /** Instance of HexHandler to assist in searching and processing hex data. */
    public hexHandler: HexHandler;

    /** Signatures used for identifying EOCD and CDFH headers. */
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
                throw new Error("EOCD signature not found.");
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

            return {
                CDHFTotalRecord: this.createBlockField(CDHFTotalRecord),
                CDHFNumberRecord: this.createBlockField(CDHFNumberRecord),
                CDHFBytesTotalSize: this.createBlockField(CDHFBytesSize),
                CDHFStartOffset: this.createBlockField(CDHFStartOffset),
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
}
