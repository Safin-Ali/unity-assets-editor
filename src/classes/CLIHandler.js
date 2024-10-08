import { selectors} from '../utils/cli-seelctors.js';
import { pathGen } from '../utils/common-utils.js';
import {readdirSync} from "node:fs";
import { select } from '@inquirer/prompts';
import { ISSHandler } from './ISSHandler.js';

export class CLIHandler {

	#assetsDir = readdirSync(pathGen('assets'));
	constructor() {
		this.#initCLIHandler();
	}

	async #initCLIHandler () {
		const rootAns = await select(selectors[0]);
		if(rootAns === 'iss') {
			new ISSHandler(this.#assetsDir)
		}
	}
}