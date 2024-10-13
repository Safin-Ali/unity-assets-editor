import { pathGen } from "../utils/common-utils.js";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { ISSHandler } from "./ISSHandler.js";
import { Select } from "https://deno.land/x/cliffy@v0.25.7/prompt/mod.ts";
import { selectors } from "../utils/cli-seelctors.js";
import { brightYellow } from "https://deno.land/std@0.221.0/fmt/colors.ts";

export class CLIHandler {
  #assetsDir = null;
  constructor() {
    const assetsDir = pathGen("assets");

    if (!existsSync(assetsDir)) {
      mkdirSync(assetsDir);
    }
    this.#assetsDir = readdirSync(assetsDir);

    if (this.#assetsDir.length < 1) {
      console.warn(brightYellow("no base assets found"));
      return;
    }
    this.#initCLIHandler();
  }

  async #initCLIHandler() {
    const rootAns = await Select.prompt(selectors[0]);

    if (rootAns === "iss") {
      new ISSHandler(this.#assetsDir);
    }
  }
}
