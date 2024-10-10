import { confirm, input } from "@inquirer/prompts";
import { validators } from "../utils/cli-seelctors.js";
import FileHandler from "./FileHandler.js";
import { asciiToHexBytes, pathGen } from "../utils/common-utils.js";
import HexHandler from "./HexHandler.js";

const busHD_01Alias = "BusHD_01";

/**
 * Handles the increasing of skin slots based on the provided Mono, Object, and Skin file paths.
 */
export class ISSHandler {
	#assetsDir = null;

	#baseAssets = {
		mono: null,
		obj: null,
		skin: null,
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
	 * Starts the ISS processing based on the user input.
	 * @private
	 */
	#startISS() {
		for (let i = 0; i < this.#baseAssets.quantity; i++) {
			const fileIndex = (i + 1).toString().padStart(2, "0");
			this.#manipulateMono(fileIndex);
			// this.#manipulateObj(fileIndex);
		}
	}

	/**
	 * Manipulates the Mono file based on the provided index string.
	 * @param {string} indexStr - The index string for the current file iteration.
	 * @private
	 */
	#manipulateMono(indexStr) {
		try {

			// new object dependency name
			const newObjDep = this.#baseAssets.obj.slice(0, 30) + indexStr;
			const newMonoFile = this.#baseAssets.mono.slice(0, 30) + indexStr;
			const fileIns = new FileHandler({
				inputPath: pathGen("assets", this.#baseAssets.mono),
				outPath: pathGen("output", newMonoFile),
			});

			const hexIns = new HexHandler(fileIns.buffer);

			const objDepOffset = hexIns.findIndex(asciiToHexBytes(this.#baseAssets.obj));
			const monoAliasOffset = hexIns.findIndex(asciiToHexBytes(busHD_01Alias));

			// Modify traffic object file dependency
			hexIns.replaceBytes(objDepOffset[0].start, asciiToHexBytes(newObjDep));

			// Modify BusHD_01 alias
			hexIns.replaceBytes(monoAliasOffset[0].start, asciiToHexBytes(`BusHD_${indexStr}`));

			fileIns.writeBuffer();
		} catch (error) {
			console.error(`Error manipulating Mono file for index ${indexStr}:`, error);
		}
	}
}
