import { readFileSync, writeFileSync } from 'node:fs';

/**
 * Handles file operations, including reading from and writing to files.
 */
export default class FileHandler {
    /**
     * Creates an instance of FileHandler.
     * 
     * @param {Object} options - Configuration options for the FileHandler.
     * @param {string} options.inputPath - Path to the input file to read.
     * @param {string} [options.outPath=''] - Path to the output file to write. Defaults to an empty string.
     * @throws {Error} Throws an error if the input file cannot be read.
     */
    constructor({ inputPath, outPath = '' }) {
        if (typeof inputPath !== 'string') {
            throw new TypeError('The inputPath must be a string.');
        }

        this.destPath = outPath;

        try {
            const fileContent = readFileSync(inputPath, 'hex');
            this.buffer = (fileContent.toUpperCase().match(/.{1,2}/g) || []);
        } catch (error) {
            throw new Error(`Failed to read file at ${inputPath}: ${error.message}`);
        }
    }

    /**
     * Writes the buffer to the specified output file in hexadecimal format.
     * @throws {Error} Throws an error if the file cannot be written.
     */
    writeBuffer() {
        if (typeof this.destPath !== 'string') {
            throw new TypeError('The destPath must be a string.');
        }

        try {
            const hexString = this.buffer.join('').toLowerCase();
            writeFileSync(this.destPath, hexString, 'hex');
        } catch (error) {
            throw new Error(`Failed to write file at ${this.destPath}: ${error.message}`);
        }
    }
}
