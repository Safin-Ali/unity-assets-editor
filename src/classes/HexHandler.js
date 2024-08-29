/**
 * A class to handle operations on a buffer of hexadecimal values.
 */
export default class HexHandler {
    /**
     * Creates an instance of HexHandler.
     * @param {number[]} buf - An array of bytes (hex values) representing the buffer.
     * @throws {Error} Throws an error if the input is not an array.
     */
    constructor(buf) {
        if (!Array.isArray(buf)) {
            throw new Error('The HexHandler constructor argument must be an array.');
        }
        this.buffer = buf;
    }

    /**
     * Finds the index of a sequence of bytes in the buffer.
     * @param {number[]} bytesArr - An array of bytes to search for.
     * @returns {Object[]} An array of objects representing the found sequences.
     * Each object has the following properties:
     *   - {number} start - The start index of the found sequence.
     *   - {number} end - The end index of the found sequence.
     *   - {number[]} hex - The hex values of the found sequence.
     * @throws {Error} Throws an error if the argument is not an array.
     */
    findIndex(bytesArr) {
        if (!Array.isArray(bytesArr)) {
            throw new Error('The bytesArr argument must be an array.');
        }

        const result = [];

        for (let bufI = 0; bufI <= this.buffer.length - bytesArr.length; bufI++) {

            for (let i = 0; i < bytesArr.length; i++) {
                if (this.buffer[bufI + i] !== bytesArr[i]) {
                    break;
                }

				if (i+1 === bytesArr.length) {
					result.push({
						start: bufI,
						end: bufI + bytesArr.length - 1,
						hex: this.buffer.slice(bufI, bufI + bytesArr.length)
					});
				}
            }
        }

        return result;
    }
}
