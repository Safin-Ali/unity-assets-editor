import { Input } from "https://deno.land/x/cliffy@v0.25.7/prompt/mod.ts";
import {
    displayAssetPaths,
    errorLog,
    getBaseAssets,
    pathGen,
} from "../utils/common-utils.ts";
import { validators } from "../utils/cli-seelctors.ts";
import FileHandler from "./FileHandler.ts";
import HexHandler from "./HexHandler.ts";
import { ZipDeserializer } from "./ZipHandler.ts";

export class OBBProtectHandler {
    private assetsDirectory: string[] = [];
    private obbName: string = "";

    constructor() {
        this.initializeOBBProtect();
    }

    private async initializeOBBProtect() {
        this.assetsDirectory = getBaseAssets();
        displayAssetPaths(this.assetsDirectory);
        const obbNameIdx = await Input.prompt({
            message: "Select OBB File",
            validate: validators[0].cb,
        });

        this.obbName = this.assetsDirectory[parseInt(obbNameIdx)];

        if (!this.obbName) {
            errorLog({
                error: null,
                msg: "Incorrect OBB File",
            });
            return;
        }

        this.manipulateOBB();
    }

    private manipulateOBB() {
        const fileIns = new FileHandler({
            inputPath: pathGen("assets", this.obbName),
            outPath: pathGen(
                "output",
                this.obbName,
            ),
        });
        const zipHandlerIns = new ZipDeserializer(fileIns.buffer!);
    }
}
