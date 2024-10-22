import type { EndianessValue } from "./AssetParsers-custom.ts";

/**
 * Interface for the parameters of the errorLog function.
 */
export interface ErrorLogParams {
  msg?: string; // The error message to log, default is "Something is wrong".
  error: any; // The error object to log.
}

/**
 * Parameters for the hexToInt function.
 *
 * @interface hexToIntParams
 * @property {string[]} hexBytes - An array of hexadecimal byte strings.
 * @property {keyof typeof UABE_BUSSID.Endianess} [endian="B"] - The byte order for conversion; "B" for big-endian and "L" for little-endian.
 * @property {boolean} [sum=false] - If true, returns the sum of the integer values; otherwise, returns the concatenated integer value.
 */
export interface hexToIntParams {
  hexBytes: string[];
  endian?: EndianessValue;
  sum?: boolean;
}

export interface intToHexBytesParams
  extends Omit<hexToIntParams, "sum" | "hexBytes"> {
  int: number;
  endian?:EndianessValue
}
