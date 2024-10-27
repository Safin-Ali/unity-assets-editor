import {
  brightGreen,
  brightRed,
  brightYellow,
} from "https://deno.land/std@0.221.0/fmt/colors.ts";
import { join } from "node:path";
import type {
  ErrorLogParams,
  hexToIntParams,
  intToHexBytesParams,
  PadHexOffsetParams,
  PadHexOffsetResult,
} from "../types/common-utils-custom.ts";

/**
 * Generates an absolute path by joining the current working directory with the provided file names.
 *
 * @param fileNames - The names of the files or directories to append.
 * @returns The absolute path to the file or directory.
 * @throws {TypeError} Throws a TypeError if any file name is not a string.
 */
export const pathGen = (...fileNames: string[]): string => {
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
 * @param hexBytes - An array of hexadecimal byte strings.
 * @returns The corresponding ASCII string.
 * @throws {Error} Throws an error if any item in the array is not a valid hexadecimal byte string.
 */
export const hexBytesToAscii = (hexBytes: string[]): string => {
  if (
    !Array.isArray(hexBytes) ||
    !hexBytes.every((item) => /^[0-9a-fA-F]{2}$/.test(item))
  ) {
    throw new Error(
      "The input must be an array of valid hexadecimal byte strings.",
    );
  }

  return hexBytes.map((hex) => String.fromCharCode(parseInt(hex, 16))).join("");
};

/**
 * Converts an ASCII string to an array of hexadecimal byte strings.
 *
 * @param ascii - The ASCII string to convert.
 * @returns An array of hexadecimal byte strings.
 * @throws {Error} Throws an error if the input is not a string.
 */
export const asciiToHexBytes = (ascii: string): string[] => {
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
 * @param originalVal - The input string or array to be sliced.
 * @param sliceValue - The number of elements to remove from the end.
 * @returns The sliced value.
 * @throws {Error} Throws an error if sliceValue is negative.
 */
export const endSlice = (
  originalVal: string | unknown[],
  sliceValue: number,
): string | unknown[] => {
  if (sliceValue < 0) {
    throw new Error("sliceValue must be non-negative");
  }
  return originalVal.slice(0, originalVal.length - sliceValue);
};

/**
 * Logs a message with the specified color function.
 *
 * @param msg - The message to log.
 * @param colorFn - The color function to apply to the message.
 */
const logWithColor = (msg: string, colorFn: (msg: string) => string): void => {
  console.log(colorFn(msg));
};

/**
 * Logs an error message in bright red if running in a specific Deno environment.
 *
 * @param params - The parameters for logging the error.
 * @param params.msg - The error message to log, default is "Something is wrong".
 * @param params.error - The error object to log.
 */
export const errorLog = (
  { msg = "Something is wrong", error }: ErrorLogParams,
): void => {
  const denoEnv = Deno.env.get("UABE_BUSSID");
  if (typeof denoEnv === "string" && parseInt(denoEnv)) {
    logWithColor(msg, brightRed);
  } else {
    error && console.error(error);
  }
};

/**
 * Logs a success message in bright green.
 *
 * @param msg - The success message to log.
 */
export const successLog = (msg: string): void => logWithColor(msg, brightGreen);

/**
 * Logs a warning message in bright yellow.
 *
 * @param msg - The warning message to log.
 */
export const warningLog = (msg: string): void =>
  logWithColor(msg, brightYellow);

/**
 * Returns a compact date-time string in the format YYYYMMDDHHMMSSAM/PM.
 *
 * @param date - The date to format, default is the current date.
 * @returns The compact date-time string.
 */
export const getCompactDateTime = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";

  hours = parseInt(String(hours % 12 || 12).padStart(2, "0"));

  return `${year}${month}${day}${hours}${minutes}${seconds}${ampm}`;
};

/**
 * Converts an array of hexadecimal byte strings to integer values.
 *
 * @param {hexToIntParams} params - The parameters for the conversion.
 * @returns {number} The resulting integer value or sum of integer values.
 * @throws {Error} Throws an error if any item in the array is not a valid hexadecimal byte string.
 */
export const hexToInt = ({
  hexBytes,
  endian = "big",
  sum = false,
}: hexToIntParams): number => {
  if (endian === "little") {
    hexBytes = hexBytes.reverse();
  }

  if (
    !Array.isArray(hexBytes) ||
    !hexBytes.every((item) => /^[0-9a-fA-F]{2}$/.test(item))
  ) {
    throw new Error(
      "The input must be an array of valid hexadecimal byte strings.",
    );
  }

  const int = sum
    ? hexBytes.reduce((acc, hex) => acc + parseInt(hex, 16), 0)
    : parseInt(hexBytes.join(""), 16);

  return int;
};

/**
 * Converts an integer to an array of hexadecimal byte strings.
 *
 * @param {intToHexBytesParams} params - The parameters for the conversion.
 * @returns {string[]} An array of hexadecimal byte strings representing the integer.
 * @throws {Error} Throws an error if the input integer is not valid (i.e., not an integer).
 */
export const intToHexBytes = (
  { int, endian = "big", minLength = 0 }: intToHexBytesParams,
): string[] => {
  if (!Number.isInteger(int)) {
    throw new Error("The input must be a valid integer.");
  }

  const hexArray: string[] = [];
  let tempInt = int;

  while (tempInt > 0) {
    const byte = (tempInt & 0xff).toString(16).padStart(2, "0").toUpperCase();
    hexArray.unshift(byte);
    tempInt >>= 8;
  }

  let hexBytes = hexArray.length > 0 ? hexArray : ["00"];

  if(hexBytes.length < minLength && minLength > 0) 
    hexBytes = [...hexBytes,...getNullBytes(minLength-1)];

  return endian === "little" ? hexBytes.reverse() : hexBytes;
};

/**
 * Generates an array of null bytes represented as strings.
 *
 * @param {number} length - The number of null bytes to generate.
 * @returns {string[]} An array filled with the string "00".
 */
export const getNullBytes = (length: number): string[] => {
  return new Array(length).fill("00");
};

/**
 * Pads an array of hexadecimal values to align the offset to a specified boundary.
 *
 * @param params - Object containing the parameters.
 * @param params.hexBytes - Array of hex strings to be concatenated and checked for alignment.
 * @param params.offsetBoundary - Optional hex boundary value to align with, default is `0x10`.
 *
 * @returns {PadHexOffsetResult} - An object containing the new hex array and the gap length.
 */
export const padHexOffset = (
  { hexBytes, offsetBoundary = 0x10 }: PadHexOffsetParams,
): PadHexOffsetResult => {
  const concatenatedHex = hexBytes.join(""); // Concatenate hex values
  const hexValue = parseInt(concatenatedHex, 16); // Parse the concatenated hex as an integer
  const remainder = hexValue % offsetBoundary; // Check for alignment

  if (remainder !== 0) {
    const gapLength = offsetBoundary - remainder; // Calculate the gap needed
    const newHexBytes = intToHexBytes({
      int:hexValue+gapLength,
      minLength:hexBytes.length
    })

    return {
      newHexBytes,
      gapLength: gapLength,
    };
  } else {
    console.log("Offset ends on the boundary.");
    return {
      newHexBytes: hexBytes, // No padding needed
      gapLength: 0,
    };
  }
};
