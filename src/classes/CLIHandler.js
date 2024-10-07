import { selectors } from '../utils/cli-seelctors.js';
import { pathGen } from '../utils/common-utils.js';
import {readdirSync} from "node:fs";
import { select } from '@inquirer/prompts';

export class CLIHandler {

	#assetsDir = readdirSync(pathGen('assets'));
	constructor() {
		this.#initCLIHandler();
	}

	async #initCLIHandler () {
		const ans1 = await select(selectors[0]);
	}
}