import { confirm, input } from '@inquirer/prompts';
import { validators } from '../utils/cli-seelctors.js';
import { CLIHandler } from './CLIHandler.js';

export class ISSHandler {

	#assetsDir = null;

	#baseAssets = {
		mono:null,
		obj:null,
		skin:null,
		quantity:0
	}
	constructor(assetsDir) {
		this.#assetsDir = assetsDir;
		this.#assetsDir.forEach((path,idx) => {
			console.log(`${idx} ${path}`);
		})
		this.#initISSAsking();
	}

	async #initISSAsking () {
		this.#baseAssets.mono = this.#assetsDir[parseInt(await input({
			message:'Input traffic Mono index',
			required:true,
			validate:validators[0].cb
		}))];
		
		this.#baseAssets.obj = this.#assetsDir[parseInt(await input({
			message:'Input traffic Object index',
			required:true,
			validate:validators[0].cb
		}))];

		this.#baseAssets.skin = this.#assetsDir[parseInt(await input({
			message:'Input traffic Skin index',
			required:true,
			validate:validators[0].cb
		}))];
		this.#baseAssets.quantity = parseInt(await input({
			message:'Input Quatity',
			required:true,
			validate:validators[0].cb
		}));

		console.log(this.#baseAssets);

		const confirmIss = await confirm({
			message:'Are you sure above files are correct?',
			default:true			
		});

		if(confirmIss) {
			console.clear();
			new CLIHandler();
		}
		
	} 
}