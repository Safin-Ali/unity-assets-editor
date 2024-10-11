import { confirm, input } from "@inquirer/prompts";
import { validators } from "../utils/cli-seelctors.js";
import { Worker } from "node:worker_threads";
import { createSpinner } from "nanospinner";
import { pathGen } from "../utils/common-utils.js";
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
			this.#baseAssets.mono = this.#assetsDir[parseInt(await this.#getInput("Input traffic Mono index"))];
			this.#baseAssets.obj = this.#assetsDir[parseInt(await this.#getInput("Input traffic Object index"))];
			this.#baseAssets.skin = this.#assetsDir[parseInt(await this.#getInput("Input traffic Skin index"))];
			this.#baseAssets.skinAlias = await input({ message: "Input Skin Alias Name", required: true });
			this.#baseAssets.quantity = parseInt(await this.#getInput("Input Quantity"));

			console.log(this.#baseAssets);

			const confirmIss = await confirm({
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
		return await input({
			message,
			required: true,
			validate: validators[0].cb,
		});
	}

	/**
	 * Starts the ISS processing in `iss-worker.js` worker thread based on the user input.
	 * @private
	 */
	#startISS() {
		const spinner = createSpinner("Please Wait");
		spinner.start();
		const worker = new Worker(pathGen("src", "worker", "iss-worker.js"));

		worker.postMessage(this.#baseAssets);

		worker.on("error", (error) => {
			spinner.error({ text: "ISS Handling Worker Failed \n" });
			console.error(error);
		});

		worker.on("exit", (code) => {
			if (code !== 0) {
				spinner.error({ text: "ISS Handling Exit With 1 \n" });
			} else {
				spinner.success({ text: "Increased Skin Slots \n" });
			}
		});
	}
}
