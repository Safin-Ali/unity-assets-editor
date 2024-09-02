import FileHandler from "./classes/FileHandler.js";
import HexHandler from "./classes/HexHandler.js";
import { asciiToHexBytes, pathGen } from "./utils/common-utils.js";

const file = new FileHandler({
	inputPath:pathGen('/buffer/hello.txt'),
	outPath:pathGen('/buffer/dest.bin')
});

const ins = new HexHandler(file.buffer);

// modify bytes
const r = ins.replaceBytes(ins.findIndex(asciiToHexBytes('Dex'))[0].start,asciiToHexBytes('Dev'));

// remove bytes
const rm = ins.removeBytes(ins.findIndex(asciiToHexBytes('M'))[0].start,1);

// insert bytes
const insert = ins.insertBytes(ins.findIndex(asciiToHexBytes('Z'))[0].start,asciiToHexBytes('Y'));

console.log(r,rm,insert);