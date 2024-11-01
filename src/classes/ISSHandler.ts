import { validators } from "../utils/cli-seelctors.ts";
import { createSpinner } from "npm:nanospinner";
import {
  Confirm,
  Input,
} from "https://deno.land/x/cliffy@v0.25.7/prompt/mod.ts";
import {
  brightBlue,
  brightYellow,
} from "https://deno.land/std@0.221.0/fmt/colors.ts";
import { restartApp } from "../event/app-event.ts";
import { errorLog, getBaseAssets } from "../utils/common-utils.ts";
import type { BaseAssets } from "../types/ISSHandler-custom.ts";

/**
 * Handles the increasing of skin slots based on the provided Mono, Object, and Skin file paths.
 */
export class ISSHandler {
  private assetsDirectory: string[] = [];

  private baseAssets: BaseAssets = {
    mono: null,
    obj: null,
    skin: null,
    skinAlias: null,
    quantity: 0,
  };

  /**
   * Creates an instance of ISSHandler.
   * @param {string[]} assetDirectory - An array of asset directory paths.
   */
  constructor() {
    try {
      this.assetsDirectory = getBaseAssets();
      this.displayAssetPaths();
      this.initializeISSPrompt();
      // deno-lint-ignore no-explicit-any
    } catch (error: any) {
      errorLog({
        error,
      });
    }
  }

  /**
   * Logs asset paths in the console.
   */
  private displayAssetPaths(): void {
    this.assetsDirectory.forEach((path, index) => {
      console.log(brightYellow(`${index} `), brightBlue(`${path}`));
    });
  }

  /**
   * Initializes the ISS asking process to gather user input.
   * @private
   */
  private async initializeISSPrompt() {
    try {
      this.baseAssets.mono = this.assetsDirectory[
        parseInt(await this.promptForBaseAssetIndex("Input traffic Mono index"))
      ];
      this.baseAssets.obj = this.assetsDirectory[
        parseInt(
          await this.promptForBaseAssetIndex("Input traffic Object index"),
        )
      ];
      this.baseAssets.skin = this.assetsDirectory[
        parseInt(await this.promptForBaseAssetIndex("Input traffic Skin index"))
      ];
      this.baseAssets.skinAlias = await Input.prompt({
        message: "Input Skin Alias Name",
        pointer: brightYellow(":"),
        validate: (input) => !!input,
      });
      this.baseAssets.quantity = parseInt(
        await this.promptForBaseAssetIndex("Input Quantity"),
      );

      console.dir(this.baseAssets);

      const confirmIss = await Confirm.prompt({
        message: "Are you sure above files are correct?",
        default: true,
      });

      if (confirmIss) {
        this.initializeISS();
      }
      // deno-lint-ignore no-explicit-any
    } catch (error: any) {
      errorLog({
        error,
      });
    }
  }

  /**
   * Gets user input with validation.
   * @param {string} message - The message to display to the user.
   * @returns {Promise<string>} - The user input.
   * @private
   */
  private async promptForBaseAssetIndex(message: string): Promise<string> {
    return await Input.prompt({
      message,
      validate: validators[0].cb,
      pointer: brightYellow(":"),
    });
  }

  /**
   * Starts the ISS processing in `iss-worker.js` worker thread based on the user input.
   * @private
   */
  private initializeISS() {
    const spinner = createSpinner("Please Wait");
    spinner.start();
    const worker = new Worker(
      import.meta.resolve("../worker/iss-worker.ts"),
      {
        type: "module",
      },
    );

    worker.postMessage(this.baseAssets);

    worker.onmessage = (message) => {
      if (message.data === "error") {
        restartApp();
        spinner.error({ text: "ISS Handling Worker Failed" });
        worker.terminate();
      }
      if (message.data === "done") {
        worker.terminate();
        spinner.success({
          text: "Increased Skin Slots",
        });
        restartApp();
      }
    };

    worker.onerror = (_) => {
      spinner.error({ text: "ISS Handling Worker Failed" });
      worker.terminate();
    };

    worker.onmessageerror = () => {
      spinner.error({
        text: "ISS Handling Worker Failed To Worker Data Deserialized",
      });
      worker.terminate();
    };
  }
}
