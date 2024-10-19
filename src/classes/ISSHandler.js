// import { confirm, input } from "npm:@inquirer/prompts";
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
import { errorLog } from "../utils/common-utils.ts";

/**
 * Handles the increasing of skin slots based on the provided Mono, Object, and Skin file paths.
 */
export class ISSHandler {
  #assetsDir = null;

  #baseAssets = {
    mono: null,
    obj: null,
    skin: null,
    skinAlias: null,
    quantity: 0,
  };

  /**
   * Creates an instance of ISSHandler.
   * @param {string[]} assetsDir - An array of asset directory paths.
   */
  constructor(assetsDir) {
    try {
      this.#assetsDir = assetsDir;
      this.#assetsDir.forEach((path, idx) => {
        console.log(brightYellow(`${idx} `), brightBlue(`${path}`));
      });
      this.#initISSAsking();
    } catch (error) {
      errorLog(error.message);
      restartApp();
    }
  }

  /**
   * Initializes the ISS asking process to gather user input.
   * @private
   */
  async #initISSAsking() {
    try {
      this.#baseAssets.mono = this.#assetsDir[
        parseInt(await this.#getInput("Input traffic Mono index"))
      ];
      this.#baseAssets.obj = this.#assetsDir[
        parseInt(await this.#getInput("Input traffic Object index"))
      ];
      this.#baseAssets.skin = this.#assetsDir[
        parseInt(await this.#getInput("Input traffic Skin index"))
      ];
      this.#baseAssets.skinAlias = await Input.prompt({
        message: "Input Skin Alias Name",
        pointer: brightYellow(":"),
        validate: (input) => !!input,
      });
      this.#baseAssets.quantity = parseInt(
        await this.#getInput("Input Quantity"),
      );

      console.dir(this.#baseAssets);

      const confirmIss = await Confirm.prompt({
        message: "Are you sure above files are correct?",
        default: true,
      });

      if (confirmIss) {
        this.#startISS();
      }
    } catch (_) {
      throw new Error("Error initializing ISS asking:");
    }
  }

  /**
   * Gets user input with validation.
   * @param {string} message - The message to display to the user.
   * @returns {Promise<string>} - The user input.
   * @private
   */
  async #getInput(message) {
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
  #startISS() {
    const spinner = createSpinner("Please Wait");
    spinner.start();
    const worker = new Worker(
      import.meta.resolve("../worker/iss-worker.js"),
      {
        type: "module",
      },
    );

    worker.postMessage(this.#baseAssets);

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
