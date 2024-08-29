import FileHandler from "./classes/FileHandler.js";
import HexHandler from "./classes/HexHandler.js";
import { pathGen } from "./utils/common-utils.js";

const x = new FileHandler({
	inputPath:pathGen('/buffer/hello.txt'),
	outPath:pathGen('/buffer/dest.bin')	
});

// new HexHandler(x.buffer).findOffset(['20','44','65','76','58','41']);
console.log(x.buffer);
console.log(new HexHandler(x.buffer).findIndex(['20','44','65','76','58','41']));

