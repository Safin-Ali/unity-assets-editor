import { selectors} from "../utils/cli-seelctors.js";
import { pathGen } from "../utils/common-utils.js";
import {existsSync, mkdirSync, readdirSync} from "node:fs";
import { select } from "npm:@inquirer/prompts";
import { ISSHandler } from "./ISSHandler.js";

export class CLIHandler {

	
	#assetsDir = null;
	constructor() {
		const assetsDir = pathGen("assets");
		
		if(!existsSync(assetsDir)) {
			mkdirSync(assetsDir);
		}
		this.#assetsDir = readdirSync(assetsDir);
		if(assetsDir.length < 1) {
			console.warn("no base assets found");
			return;
		}
		this.#initCLIHandler();
	}

	async #initCLIHandler () {

		const rootAns = await select(selectors[0]);
		if(rootAns === "iss") {
			new ISSHandler(this.#assetsDir)
		}
	}
}