import { pathGen } from "../utils/common-utils.js";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { ISSHandler } from "./ISSHandler.js";
import { Select } from "https://deno.land/x/cliffy@v0.25.7/prompt/mod.ts";
import { selectors } from "../utils/cli-seelctors.js";
import { warningLog } from "../utils/common-utils.js";
import { appCloseKeyEvtWrapper } from "../event/keypress-event.js";

export class CLIHandler {
  #assetsDir = null;
  constructor() {
    const assetsDir = pathGen("assets");

    if (!existsSync(assetsDir)) {
      mkdirSync(assetsDir);
    }
    this.#assetsDir = readdirSync(assetsDir);

    if (this.#assetsDir.length < 1) {
      warningLog("no base assets found");
      appCloseKeyEvtWrapper();
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
