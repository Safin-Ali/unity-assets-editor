import type {
    AssetParserLabels,
    DependencyParserArg,
    ExistDependencies,
    ModifyDependencySizeParams,
} from "../../types/AssetParsers-custom.ts";
import { currentVersion } from "../../unity/version-structure.ts";
import { asciiToHexBytes, endSlice, hexBytesToAscii, hexToInt } from "../../utils/common-utils.ts";
import { intToHexBytes } from "../../utils/common-utils.ts";
import HexHandler from "../HexHandler.ts";
import { MetaSizeParser } from "./MetaSizeParser.ts";

export class DependencyParser {
    private buffer: string[];
    private hexIns: HexHandler;
    public existDependencies: ExistDependencies[] = [];
    public dependency: AssetParserLabels = {
        offsetHex: null,
        offsetInt: null,
        valueHex: null,
        valueInt: null,
        endian: null,
    };
    /**
     * Creates an instance of DependencyParser.
     *
     * @param {string[]} buffer - The buffer containing hex values as strings.
     */
    constructor(arg: DependencyParserArg) {
        this.buffer = arg.buffer;
        this.dependency.offsetInt = arg.offset;
        this.hexIns = new HexHandler(this.buffer);
        if (!this.dependency.offsetInt) {
            throw new Error("Dependency Parser offsetInt field is null");
        }
        this.initDependencyParser();
    }

    /**
     * Initializes the dependency parser by setting up the offset and extracting the
     * meta size values from the buffer.
     *
     * @private
     */
    private initDependencyParser() {
        this.dependency.endian = currentVersion.dep.endian;

        this.dependency.offsetHex = intToHexBytes({
            int: this.dependency.offsetInt!,
        });

        const depValueHex = this.buffer.slice(
            this.dependency.offsetInt!,
            this.dependency.offsetInt! + 2,
        );

        this.dependency.valueHex = depValueHex;

        this.dependency.valueInt = hexToInt({ hexBytes: depValueHex });

        this.initGetExistDependency();
        
    }

    /**
     * Modifies the dependency size value in the buffer.
     *
     * @param {ModifyMetaSizeParams} params - Parameters to modify the meta size.
     * @param {number} params.int - The integer value to modify the meta size by.
     * @param {"inc" | "dec"} [params.operation="inc"] - The operation to perform on the meta size ("inc" to increase, "dec" to decrease).
     *
     * @throws {Error} If the meta size values are not properly initialized.
     */
    public modifyDepencySize(
        { name, offset, operation = "add" }: ModifyDependencySizeParams,
    ) {
        if (
            !this.dependency.valueInt || !this.dependency.endian ||
            !this.dependency.offsetInt
        ) {
            throw new Error("Dependency Parser Interface Issue");
        }
        const endian = currentVersion.dep.endian;
        const newDepBytes: string[] = intToHexBytes({
            int: this.dependency.valueInt + 1,
            endian,
        });
        if (operation === "add") {
            this.addDependency(offset, name);
        } else {
            this.removeDependency(offset);
        }

        // update dependency `valueInt` field value
        this.dependency.valueInt = hexToInt({
            hexBytes: newDepBytes,
            endian: this.dependency.endian,
        });

        // update dependency `valueHex` field value
        this.dependency.valueHex = newDepBytes;
    }

    private addDependency(offset: number, newDepName: string) {
        this.hexIns.insertBytes(offset, [...new Array(currentVersion.dep.nullByte).fill("00"),...asciiToHexBytes(newDepName)]);
        const metaParserIns = new MetaSizeParser(this.buffer);
        const { dependencyByteLeng, nullByte } = currentVersion.dep;
        metaParserIns.modifyMetaSize({
            int: metaParserIns.metaSize.valueInt! +
                (dependencyByteLeng + nullByte),
            operation: "inc",
        });

        this.existDependencies.push({
            name:newDepName,
            index:this.existDependencies.length+1,
            startOffset:offset,
            endOffset:offset+(nullByte+newDepName.length)
        })
    }

    private removeDependency(offset: number) {
        const existDependency = this.existDependencies.find(({startOffset}) => startOffset === offset);
        if(!existDependency) {
            throw Error("Failed to remove dependency. because that not exist")
        }
        this.hexIns.removeBytes(offset, (existDependency.name.length));
        const metaParserIns = new MetaSizeParser(this.buffer);
        const { nullByte } = currentVersion.dep;
        metaParserIns.modifyMetaSize({
            int: metaParserIns.metaSize.valueInt! -
                (existDependency.name.length + nullByte),
            operation: "dec",
        });
        this.existDependencies.splice(existDependency.index-1,1)
    }

    private initGetExistDependency() {
        const { dependencyByteLeng, nullByte } = currentVersion.dep;
        const { offsetInt } = this.dependency;

        
        let currDepOffset = (offsetInt! + 3);

        for (let index = 1; index <= this.dependency.valueInt!; index++) {
            let currDepByteLeng = dependencyByteLeng;
            
            let depName = hexBytesToAscii(this.buffer.slice(currDepOffset+nullByte, currDepOffset+nullByte+currDepByteLeng));
            
            if(this.isGlobalManager(depName)) {
                currDepByteLeng = 25;
                depName = hexBytesToAscii(this.buffer.slice(currDepOffset+nullByte, currDepOffset+nullByte+currDepByteLeng))
            }

            const endOffset = currDepOffset+(currDepByteLeng+nullByte);            

            this.existDependencies.push({
                name:depName,
                index,
                startOffset:currDepOffset,
                endOffset
            })

            currDepOffset = endOffset
        }
    }

    private isGlobalManager (depName:string):boolean {
       return endSlice(depName,7) === "globalgamemanagers.assets";
    }
}
