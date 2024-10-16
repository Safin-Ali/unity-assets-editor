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
 * Slices a string or array from the end based on the specified slice value.
 *
 * @param {string | any[]} orginalVal - The input string or array to be sliced.
 * @param {number} sliceValue - The number of elements to remove from the end of the string.
 * @returns {string | any[]} The sliced value.
 * @throws {Error} Will throw an error if sliceValue is negative.
 */
export const endSlice = (orginalVal, sliceValue) => {
  if (sliceValue < 0) {
    throw new Error("sliceValue must be non-negative");
  }
  return orginalVal.slice(0, orginalVal.length - sliceValue);
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

/**
 * Returns a compact date-time string in the format YYYYMMDDHHMMSSAM/PM.
 *
 * @param {Date} [date=new Date()] - The date to format. Defaults to the current date and time.
 * @returns {string} The compact date-time string.
 */
export const getCompactDateTime = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
  const day = String(date.getDate()).padStart(2, "0");

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";

  hours = String(hours % 12 || 12).padStart(2, "0"); // Convert to 12-hour format

  return `${year}${month}${day}${hours}${minutes}${seconds}${ampm}`;
};

/**
 * Converts an array of hexadecimal byte strings to integer values.
 *
 * @param {string[]} hexBytes - An array of hexadecimal byte strings (e.g., ["1F", "01"]).
 * @param {boolean} [sum=false] - If true, returns the sum of the integer values; otherwise, returns the concatenated integer value.
 * @returns {number} The resulting integer value or sum of integer values.
 * @throws {Error} Throws an error if any item in the array is not a valid hexadecimal byte string.
 */
export const hexToInt = (hexBytes, sum = false) => {
  if (
    !Array.isArray(hexBytes) ||
    !hexBytes.every((item) => /^[0-9a-fA-F]{2}$/.test(item))
  ) {
    throw new Error(
      "The input must be an array of valid hexadecimal byte strings.",
    );
  }

  return sum
    ? hexBytes.reduce((sum, hex) => sum + parseInt(hex, 16), 0)
    : parseInt(hexBytes.join(""), 16);
};

/**
 * Converts an integer to an array of hexadecimal byte strings.
 *
 * @param {number} num - The integer to convert (e.g., 256).
 * @returns {string[]} An array of hexadecimal byte strings (e.g., ["00", "01"] for 256).
 * @throws {Error} Throws an error if the input is not a valid integer.
 */
export const intToHexBytes = (num) => {
  if (!Number.isInteger(num)) {
    throw new Error("The input must be a valid integer.");
  }

  const hexArray = [];
  let tempNum = num;

  // Break down the number into bytes
  while (tempNum > 0) {
    const byte = (tempNum & 0xff).toString(16).padStart(2, "0");
    hexArray.unshift(byte); // Add to the beginning of the array
    tempNum >>= 8; // Shift right by 8 bits to process the next byte
  }

  return hexArray.length > 0 ? hexArray : ["00"]; // Return ["00"] if the number is 0
};
