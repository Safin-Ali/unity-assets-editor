import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, parse } from "node:path";
import type { FileHandlerOptions } from "../types/FileHandler-custom.ts";
import { errorLog } from "../utils/common-utils.ts";
import { restartApp } from "../event/app-event.ts";

/**
 * Handles file operations, including reading from and writing to files.
 */
export default class FileHandler {
  private destPath: string | null = null;

  readonly buffer: string[] | null = null;
  /**
   * Creates an instance of FileHandler.
   *
   * @param {FileHandlerOptions} options - Configuration options for the FileHandler.
   * @param {string} options.inputPath - Path to the input file to read.
   * @param {string} [options.outPath=""] - Path to the output file to write. Defaults to an empty string.
   */

  constructor({ inputPath, outPath }: FileHandlerOptions) {
    if (typeof inputPath !== "string") {
      throw new TypeError("The inputPath must be a string.");
    }

    this.destPath = outPath ? outPath : null;

    try {
      const fileContent = readFileSync(inputPath, "hex");
      this.buffer = fileContent.toUpperCase().match(/.{1,2}/g) || [];
    // deno-lint-ignore no-explicit-any
    } catch (error: any) {
      errorLog({ error });
    }
  }

  /**
   * Writes the buffer to the specified output file in hexadecimal format.
   */
  writeBuffer() {
    if (typeof this.destPath !== "string") {
      errorLog({ error: null, msg: "The destPath must be a string." });
      return;
    }

    if (!this.buffer) {
      errorLog({ error: null, msg: "Can't resolve input file buffer" });
      restartApp();
      return;
    }

    const { dir, name } = parse(this.destPath);

    try {
      const hexString = this.buffer.join("").toLowerCase();

      if (!existsSync(this.destPath)) {
        mkdirSync(dir, { recursive: true });
      }
      writeFileSync(join(dir, name), hexString, "hex");
    } catch (error) {
      errorLog({
        error,
        msg: `Failed to write file at ${this.destPath}`,
      });
    }
  }
}
