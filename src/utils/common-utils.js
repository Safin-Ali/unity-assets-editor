import {
  brightGreen,
  brightRed,
  brightYellow,
} from "https://deno.land/std@0.221.0/fmt/colors.ts";
import { join } from "node:path";

/**
 * Generates an absolute path by joining the current working directory with the provided file name.
 *
 * @param {string} fileName - The name of the file or directory to append to the current working directory.
 * @returns {string} The absolute path to the file or directory.
 */
export const pathGen = (...fileNames) => {
  fileNames.forEach((fn) => {
    if (typeof fn !== "string") {
      throw new TypeError("The fileName argument must be a string.");
    }
  });
  return join(Deno.cwd(), ...fileNames);
};

/**
 * Converts an array of hexadecimal byte strings to an ASCII string.
 *
 * @param {string[]} hexBytes - An array of hexadecimal byte strings (e.g., ["48", "65", "6c", "6c", "6f"]).
 * @returns {string} The corresponding ASCII string (e.g., "Hello").
 * @throws {Error} Throws an error if any item in the array is not a valid hexadecimal byte string.
 */
export const hexBytesToAscii = (hexArray) => {
  if (
    !Array.isArray(hexArray) ||
    !hexArray.every((item) => /^[0-9a-fA-F]{2}$/.test(item))
  ) {
    throw new Error(
      "The input must be an array of valid hexadecimal byte strings.",
    );
  }

  return hexArray.map((hex) => String.fromCharCode(parseInt(hex, 16))).join("");
};

/**
 * Converts an ASCII string to an array of hexadecimal byte strings.
 *
 * @param {string} ascii - The ASCII string to convert (e.g., "Hello").
 * @returns {string[]} An array of hexadecimal byte strings (e.g., ["48", "65", "6c", "6c", "6f"]).
 * @throws {Error} Throws an error if the input is not a string.
 */
export const asciiToHexBytes = (ascii) => {
  if (typeof ascii !== "string") {
    throw new Error("The input must be a string.");
  }

  return Array.from(ascii).map((char) => {
    const hexPair = char.charCodeAt(0).toString(16).padStart(2, "0");
    return hexPair.toUpperCase();
  });
};

/**
 * Slices a string from the end based on the specified slice value.
 *
 * @param {string} string - The input string to be sliced.
 * @param {number} sliceValue - The number of characters to remove from the end of the string.
 * @returns {string} The sliced string.
 * @throws {Error} Will throw an error if sliceValue is negative.
 */
export const endStringSlice = (string, sliceValue) => {
  if (sliceValue < 0) {
    throw new Error("sliceValue must be non-negative");
  }
  return string.slice(0, string.length - sliceValue);
};

/**
 * Logs a message with the specified color function.
 * @param {string} msg - The message to log.
 * @param {function} colorFn - The color function to apply to the message.
 */
const logWithColor = (msg, colorFn) => {
  console.log(colorFn(msg));
};

/**
 * Logs an error message in bright red.
 * @param {string} msg - The error message to log.
 */
export const errorLog = (msg) => logWithColor(msg, brightRed);

/**
 * Logs a success message in bright green.
 * @param {string} msg - The success message to log.
 */
export const successLog = (msg) => logWithColor(msg, brightGreen);

/**
 * Logs a warning message in bright yellow.
 * @param {string} msg - The warning message to log.
 */
export const warningLog = (msg) => logWithColor(msg, brightYellow);
