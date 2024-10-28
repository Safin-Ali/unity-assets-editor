import type {
  FoundSequence,
  InsertResult,
  ReplaceResult,
} from "../types/HexHandler-custom.ts";

/**
 * A class to handle operations on a buffer of hexadecimal values.
 */
export default class HexHandler {
  private buffer: string[];

  /**
   * Creates an instance of HexHandler.
   * @param {string[]} buf - An array of bytes (hex values) representing the buffer.
   * @throws {Error} Throws an error if the input is not an array.
   */
  constructor(buf: string[]) {
    if (!Array.isArray(buf)) {
      throw new Error("The HexHandler constructor argument must be an array.");
    }
    this.buffer = buf;
  }

  /**
   * Finds the index of a sequence of bytes in the buffer.
   * @param {string[]} bytesArr - An array of bytes to search for.
   * @returns {FoundSequence[]} An array of objects representing the found sequences.
   * @throws {Error} Throws an error if the argument is not a non-empty array.
   */
  findIndex(bytesArr: string[]): FoundSequence[] {
    if (!Array.isArray(bytesArr) || !bytesArr.length) {
      throw new Error(
        "The bytesArr argument must be a non-empty hex byte array.",
      );
    }

    const result: FoundSequence[] = [];

    for (let bufI = 0; bufI <= this.buffer.length - bytesArr.length; bufI++) {
      for (let i = 0; i < bytesArr.length; i++) {
        if (this.buffer[bufI + i] !== bytesArr[i]) {
          break;
        }

        if (i + 1 === bytesArr.length) {
          result.push({
            start: bufI,
            end: bufI + bytesArr.length - 1,
            hex: this.buffer.slice(bufI, bufI + bytesArr.length),
          });
        }
      }
    }

    return result;
  }

  /**
   * Replaces a segment of the buffer with new bytes.
   * @param {number} startIndex - The starting index in the buffer where replacement begins.
   * @param {string[]} newBytes - An array of bytes to replace the existing bytes in the buffer.
   * @returns {ReplaceResult} An object containing the old and modified bytes.
   * @throws {Error} Throws an error if `newBytes` is not a non-empty array or if `startIndex` is out of bounds.
   */
  replaceBytes(startIndex: number, newBytes: string[]): ReplaceResult {
    if (!Array.isArray(newBytes) || !newBytes.length) {
      throw new Error(
        "The newBytes argument must be a non-empty hex byte array.",
      );
    }

    if (startIndex < 0 || startIndex >= this.buffer.length) {
      throw new Error("The startIndex is out of bounds.");
    }

    const endIndex = startIndex + newBytes.length;

    if (endIndex > this.buffer.length) {
      throw new Error("The replacement exceeds buffer boundaries.");
    }

    const oldBytes = this.buffer.slice(startIndex, endIndex);
    this.buffer.splice(startIndex, newBytes.length, ...newBytes);
    const modifiedBytes = this.buffer.slice(startIndex, endIndex);

    return {
      oldBytes,
      modifiedBytes,
    };
  }

  /**
   * Inserts a segment of new bytes into the buffer.
   * @param {number} startIndex - The starting index in the buffer where insertion begins.
   * @param {string[]} newBytes - An array of bytes to insert into the buffer.
   * @returns {InsertResult} An object containing the start and end indices of the inserted bytes.
   * @throws {Error} Throws an error if `newBytes` is not a non-empty array or if `startIndex` is out of bounds.
   */
  insertBytes(startIndex: number, newBytes: string[]): InsertResult {
    if (!Array.isArray(newBytes) || !newBytes.length) {
      throw new Error(
        "The newBytes argument must be a non-empty hex byte array.",
      );
    }

    if (startIndex < 0 || startIndex > this.buffer.length) {
      throw new Error("The startIndex is out of bounds.");
    }

    const endIndex = startIndex + newBytes.length;

    this.buffer.splice(startIndex, 0, ...newBytes);

    return {
      start: startIndex,
      end: endIndex - 1,
      insertedBytes: this.buffer.slice(startIndex, endIndex),
    };
  }

  /**
   * Removes a segment of bytes from the buffer.
   * @param {number} position - The starting index in the buffer where removal begins.
   * @param {number} byteLength - The number of bytes to remove.
   * @returns {string[]} The bytes that are removed.
   * @throws {Error} Throws an error if `position` or `byteLength` are not positive values or are out of bounds.
   */
  removeBytes(position: number, byteLength: number): string[] {
    if (
      position === null || typeof position === "undefined" ||
      byteLength === null || typeof byteLength === "undefined"
    ) {
      throw new Error("The position and byteLength arguments must be defined.");
    }

    if (position < 0 || byteLength < 0) {
      throw new Error(
        "The position and byteLength arguments must be non-negative.",
      );
    }

    if (position >= this.buffer.length) {
      throw new Error("The position is out of bounds.");
    }

    const removedBytes = this.buffer.slice(position, position + byteLength);
    this.buffer.splice(position, byteLength);

    return removedBytes;
  }
}
