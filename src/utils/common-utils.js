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
