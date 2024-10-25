import {
    brightBlue,
    brightGreen,
    brightRed,
    brightYellow,
} from "https://deno.land/std@0.221.0/fmt/colors.ts";
import type { TSPromptValues } from "../types/TSHandler-custom.ts";
import { Input, Toggle } from "https://deno.land/x/cliffy@v0.25.7/mod.ts";
import { restartApp } from "../event/app-event.ts";
import { validators } from "../utils/cli-seelctors.ts";
import FileHandler from "./FileHandler.ts";
import { pathGen } from "../utils/common-utils.ts";
import { DependencyParser } from "./asset-parsers/DependencyParser.ts";
import { readFileSync } from "node:fs";

export class TSHandler {
    private assetsDirectory: string[];
    private monoAssetTextBuffer: string[] = [];
    private tspPromptValues: TSPromptValues = {
        trafficSpawnMono: null,
        trafficMonoText: null,
        spawnType: null,
    };

    constructor(assetDirectory: string[]) {
        this.assetsDirectory = assetDirectory;
        this.displayAssetPaths();
        this.initializeTSPrompt();
    }

    /**
     * Logs asset paths in the console.
     */
    private displayAssetPaths(): void {
        this.assetsDirectory.forEach((path, index) => {
            console.log(brightYellow(`${index} `), brightBlue(`${path}`));
        });
    }

    /**
     * Prompts the user for TSP parameters, confirms inputs, and initializes TS processing.
     */
    private async initializeTSPrompt(): Promise<void> {
        try {
            this.tspPromptValues.trafficSpawnMono = await this
                .promptForAssetIndex(
                    "Input traffic spawn asset index",
                );
            this.tspPromptValues.trafficMonoText = await this
                .promptForAssetIndex(
                    "Input traffic mono text index",
                );
            this.tspPromptValues.spawnType = await this.promptForSpawnType();

            const confirmPrompt = await Toggle.prompt({
                message: "Are you sure the above files are correct?",
                default: true,
            });

            if (confirmPrompt) {
                this.initializeTS();
            }
            // deno-lint-ignore no-explicit-any
        } catch (error: any) {
            throw new Error(
                `Error occurred in ${
                    brightRed(`#initializeTSPPrompt`)
                } method in TSHandler: ${error.message}`,
            );
        } finally {
            restartApp();
        }
    }

    /**
     * Prompts the user for an asset index.
     * @param message - The message to display for the prompt.
     * @returns The selected asset path.
     */
    private async promptForAssetIndex(message: string): Promise<string> {
        const index = parseInt(
            await Input.prompt({
                message,
                validate: validators[0].cb,
                pointer: brightYellow(":"),
            }),
        );
        return this.assetsDirectory[index];
    }

    /**
     * Prompts the user to select spawn type.
     * @returns True if "Sometimes", false if "Oftens".
     */
    private async promptForSpawnType(): Promise<boolean> {
        return !!await Toggle.prompt({
            message: "Spawn as",
            inactive: "Oftens",
            active: "Sometimes",
            default: true,
        });
    }

    /**
     * Validates TSPrompt values and initiates TS processing steps.
     */
    private initializeTS(): void {
        try {
            if (!this.tspPromptValues.trafficSpawnMono) {
                throw new Error("Traffic Spawn Mono Issue");
            }
            this.initializeMonoAssetBuffer();
            const fileHandler = new FileHandler({
                inputPath: pathGen(
                    "assets",
                    this.tspPromptValues.trafficSpawnMono,
                ),
                outPath: pathGen(
                    "output",
                    this.tspPromptValues.trafficSpawnMono,
                ),
            });

            if (
                fileHandler.buffer && fileHandler.buffer.length > 1 &&
                this.monoAssetTextBuffer.length > 0
            ) {
                this.manipulateDependencies(fileHandler.buffer);
                fileHandler.writeBuffer();
            }
        } catch (error) {
            console.log(error);
        }
    }

    /**
     * Populates mono asset buffer with lines from a specified file.
     */
    private initializeMonoAssetBuffer(): void {
        this.monoAssetTextBuffer = readFileSync(
            pathGen("assets", this.tspPromptValues.trafficMonoText!),
            "ascii",
        ).split("\n").filter((path) => path);
    }

    /**
     * Adds dependencies to the dependency parser's buffer.
     * @param buffer - Buffer of dependency data to modify.
     */
    private manipulateDependencies(buffer: string[]): void {
        const depParserIns = new DependencyParser({
            buffer: buffer,
            offset: 152,
        });

        this.monoAssetTextBuffer.forEach((name) => {
            depParserIns.modifyDependencySize({
                offset: depParserIns.existDependencies.slice(-1)[0].endOffset,
                name,
            });
            console.dir(`added => ${brightGreen(name)}`);
        });
    }
}
