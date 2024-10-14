import { keypress } from "https://deno.land/x/cliffy@v0.25.7/keypress/mod.ts";
import process from "node:process";
import { errorLog } from "../utils/common-utils.js";

export const appCloseKeyEvtWrapper = () => {
  errorLog("Presss ESC key to close");
  keypress().addEventListener("keydown", (input) => {
    if (input.key === "escape") {
      process.exit(0);
    }
  });
};
