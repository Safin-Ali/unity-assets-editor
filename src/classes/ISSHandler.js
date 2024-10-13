// import { confirm, input } from "npm:@inquirer/prompts";
import { validators } from "../utils/cli-seelctors.js";
import { createSpinner } from "npm:nanospinner";
import {
  Confirm,
  Input,
} from "https://deno.land/x/cliffy@v0.25.7/prompt/mod.ts";
import { brightYellow } from "https://deno.land/std@0.221.0/fmt/colors.ts";

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
    this.#assetsDir = assetsDir;
    this.#assetsDir.forEach((path, idx) => {
      console.log(`${idx} ${path}`);
    });
    this.#initISSAsking();
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
        validate: (input) => !!input,
      });
      this.#baseAssets.quantity = parseInt(
        await this.#getInput("Input Quantity"),
      );

      console.log(this.#baseAssets);

      const confirmIss = await Confirm.prompt({
        message: "Are you sure above files are correct?",
        default: true,
      });

      if (confirmIss) {
        this.#startISS();
      }
    } catch (error) {
      console.error("Error initializing ISS asking:", error);
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
      if (message.data === "done") {
        worker.terminate();
        spinner.success({
          text: "Increased Skin Slots",
        });
      }
    };

    worker.onerror = (error) => {
      console.error(error);
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
