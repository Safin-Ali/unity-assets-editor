import FileHandler from "./classes/FileHandler.js";
import HexHandler from "./classes/HexHandler.js";
import { asciiToHexBytes, hexBytesToAscii, pathGen } from "./utils/common-utils.js";

const file = new FileHandler({
	inputPath:pathGen('/buffer/hello.txt'),
	outPath:pathGen('/buffer/dest.bin')	
});

// new HexHandler(x.buffer).findOffset(['20','44','65','76','58','41']);
console.log(file.buffer);

const ins = new HexHandler(file.buffer);

const [first] = ins.findIndex(['58','41']);

console.log(first);

ins.replaceHex(first.start,asciiToHexBytes('ZZ'));

console.log(file.buffer);

file.writeBuffer()


