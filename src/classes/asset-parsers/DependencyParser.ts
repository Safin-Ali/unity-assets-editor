import type {
    AssetParserLabels,
    DependencyParserArg,
    ExistDependencies,
    ModifyDependencySizeParams,
} from "../../types/AssetParsers-custom.ts";
import { currentVersion } from "../../unity/version-structure.ts";
import {
    asciiToHexBytes,
    endSlice,
    getNullBytes,
    hexBytesToAscii,
    hexToInt,
} from "../../utils/common-utils.ts";
import { intToHexBytes } from "../../utils/common-utils.ts";
import HexHandler from "../HexHandler.ts";
import { AssetSizeParser } from "./AssetSizeParser.ts";
import { FirstFileParser } from "./FirstFileParser.ts";
import { MetaSizeParser } from "./MetaSizeParser.ts";

/**
 * Class representing a parser for dependencies within an asset.
 */
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
     * @param {DependencyParserArg} arg - The buffer containing hex values and offset.
     * @throws {Error} If the offsetInt is null.
     */
    constructor(arg: DependencyParserArg) {
        this.buffer = arg.buffer;
        this.dependency.offsetInt = arg.offset;
        
        if (!this.dependency.offsetInt) {
            throw new Error("Dependency Parser offsetInt field is null");
        }
        
        this.hexIns = new HexHandler(this.buffer);
        this.initDependencyParser();
    }

    /**
     * Initializes the dependency parser by extracting relevant data from the buffer.
     *
     * @private
     */
    private initDependencyParser() {
        this.dependency.endian = currentVersion.dep.endian;
        this.dependency.offsetHex = intToHexBytes({ int: this.dependency.offsetInt! });

        const depValueHex = this.buffer.slice(this.dependency.offsetInt!, this.dependency.offsetInt! + 2);
        this.dependency.valueHex = depValueHex;
        this.dependency.valueInt = hexToInt({ hexBytes: depValueHex, sum: true });

        this.initGetExistDependency();
    }

    /**
     * Modifies the size of the dependency in the buffer.
     *
     * @param {ModifyDependencySizeParams} params - Parameters for modifying the dependency size.
     * @param {string} params.name - The name of the dependency to modify.
     * @param {number} params.offset - The offset where the modification occurs.
     * @param {"add" | "dec"} [params.operation="add"] - The operation to perform on the dependency size.
     * @throws {Error} If the dependency values are not properly initialized.
     */
    public modifyDependencySize(
        { name, offset, operation = "add" }: ModifyDependencySizeParams,
    ) {
        if (!this.dependency.valueInt || !this.dependency.endian || !this.dependency.offsetInt) {
            throw new Error("Dependency Parser Interface Issue");
        }

        const adjustment = operation === "add" ? 1 : -1;
        const newDepBytes = intToHexBytes({
            int: this.dependency.valueInt + adjustment,
            endian: this.dependency.endian,
        });

        operation === "add" ? this.addDependency(offset, name) : this.removeDependency(offset);

        this.hexIns.replaceBytes(this.dependency.offsetInt, newDepBytes);
        this.initDependencyParser();
    }

    /**
     * Adds a new dependency to the buffer.
     *
     * @param {number} offset - The offset where the new dependency will be inserted.
     * @param {string} newDepName - The name of the new dependency.
     */
    private addDependency(offset: number, newDepName: string) {
        this.hexIns.insertBytes(offset, [
            ...getNullBytes(currentVersion.dep.nullByte).fill("00"),
            ...asciiToHexBytes(newDepName),
        ]);

        const { dependencyByteLeng, nullByte } = currentVersion.dep;
        const newInsertBytes = dependencyByteLeng + nullByte;

        new AssetSizeParser(this.buffer).modifyAssetSize({ int: newInsertBytes+10 });
        new FirstFileParser(this.buffer).modifyFirstFile({ int: newInsertBytes });
        new MetaSizeParser(this.buffer).modifyMetaSize({ int: newInsertBytes });

        this.existDependencies.push({
            name: newDepName,
            index: this.existDependencies.length + 1,
            startOffset: offset,
            endOffset: offset + (nullByte + newDepName.length),
        });
    }

    /**
     * Removes an existing dependency from the buffer.
     *
     * @param {number} offset - The offset of the dependency to remove.
     * @throws {Error} If the dependency does not exist.
     */
    private removeDependency(offset: number) {
        const existDependency = this.existDependencies.find(({ startOffset }) => startOffset === offset);

        if (!existDependency) {
            throw new Error("Failed to remove dependency because it does not exist");
        }

        const { dependencyByteLeng, nullByte } = currentVersion.dep;
        const removeInsertBytes = dependencyByteLeng + nullByte;

        new AssetSizeParser(this.buffer).modifyAssetSize({ int: removeInsertBytes });
        this.hexIns.removeBytes(offset, existDependency.name.length);

        new FirstFileParser(this.buffer).modifyFirstFile({
            int: removeInsertBytes,
            operation: "dec",
        });
        new MetaSizeParser(this.buffer).modifyMetaSize({ int: removeInsertBytes, operation: "dec" });

        this.existDependencies.splice(existDependency.index - 1, 1);
    }

    /**
     * Initializes and retrieves existing dependencies from the buffer.
     *
     * @private
     */
    private initGetExistDependency() {
        const { dependencyByteLeng, nullByte } = currentVersion.dep;
        const { offsetInt } = this.dependency;
        let currDepOffset = offsetInt! + 3;

        for (let index = 1; index <= this.dependency.valueInt!; index++) {
            let currDepByteLeng = dependencyByteLeng;
            let depName = hexBytesToAscii(this.buffer.slice(currDepOffset + nullByte, currDepOffset + nullByte + currDepByteLeng));

            if (this.isGlobalManager(depName)) {
                currDepByteLeng = 25; // Adjust byte length for global manager
                depName = hexBytesToAscii(this.buffer.slice(currDepOffset + nullByte, currDepOffset + nullByte + currDepByteLeng));
            }

            const endOffset = currDepOffset + (currDepByteLeng + nullByte);
            this.existDependencies.push({
                name: depName,
                index,
                startOffset: currDepOffset,
                endOffset,
            });

            currDepOffset = endOffset;
        }
    }

    /**
     * Checks if the dependency name is a global manager.
     *
     * @param {string} depName - The name of the dependency to check.
     * @returns {boolean} - True if the dependency is a global manager, otherwise false.
     */
    private isGlobalManager(depName: string): boolean {
        return endSlice(depName, 7) === "globalgamemanagers.assets";
    }
}
