import { join } from 'node:path';

/**
 * Generates an absolute path by joining the current working directory with the provided file name.
 * 
 * @param {string} fileName - The name of the file or directory to append to the current working directory.
 * @returns {string} The absolute path to the file or directory.
 */
export const pathGen = (fileName) => {
    if (typeof fileName !== 'string') {
        throw new TypeError('The fileName argument must be a string.');
    }
    return join(process.cwd(), fileName);
};

/**
 * Converts an ASCII string to an array of hexadecimal byte strings.
 * 
 * @param {string} ascii - The ASCII string to convert (e.g., 'Hello').
 * @returns {string[]} An array of hexadecimal byte strings (e.g., ['48', '65', '6c', '6c', '6f']).
 * @throws {Error} Throws an error if the input is not a string.
 */
export const asciiToHexBytes = (ascii) => {
    if (typeof ascii !== 'string') {
        throw new Error('The input must be a string.');
    }

    return Array.from(ascii).map(char => {
        const hexPair = char.charCodeAt(0).toString(16).padStart(2, '0');
        return hexPair.toUpperCase();
    });
};
