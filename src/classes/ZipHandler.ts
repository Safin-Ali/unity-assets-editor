import { EOCHD } from "../types/ZipHandler-custom.ts";
import { errorLog, hexToInt } from "../utils/common-utils.ts";
import HexHandler from "./HexHandler.ts";

export class ZipDeserializer {

    public EOCD:EOCHD | null = null;
    private buffer:string[];
    public hexHandler: HexHandler;
    private singnatures = {
        EOCHD:["50", "4B", "05", "06"],
        CDFH:["50", "4B", "01", "02"],
        LFH:["50", "4B", "03", "04"]
    }

    constructor (buffer:string[]) {
        this.hexHandler = new HexHandler(buffer);
        this.buffer = buffer;
        this.initializeEOCD();
    }

    private initializeEOCD () {
        const eochd_sing = this.hexHandler.findIndex(this.singnatures.EOCHD);
        if(eochd_sing.length !== 1) {
            errorLog({
                error:null,
                cb:() => {},
                msg:"Wrong OBB File"
            })
            return;
        }
        
        const CDHFLength = this.buffer.slice(eochd_sing[0].end+7,eochd_sing[0].end+9);
        const CDHFBytesSize = this.buffer.slice(eochd_sing[0].end+9,eochd_sing[0].end+13);
        const CDHFStartOffset = this.buffer.slice(eochd_sing[0].end+13,eochd_sing[0].end+17);

        this.EOCD = {
            CDHFLength:{
                hex:CDHFLength,
                int:hexToInt({
                    hexBytes:CDHFLength,
                    endian:"little"
                })
            },
            CDHFBytesSize:{
                hex:CDHFBytesSize,
                int:hexToInt({
                    hexBytes:CDHFBytesSize,
                    endian:"little"
                })
            },
            CDHFStartOffset:{
                hex:CDHFStartOffset,
                int:hexToInt({
                    hexBytes:CDHFStartOffset,
                    endian:"little"
                })
            },
        };

        console.log(this.EOCD);
        
        
    }
}