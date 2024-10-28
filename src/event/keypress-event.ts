import { keypress } from "https://deno.land/x/cliffy@v0.25.7/keypress/mod.ts";
import process from "node:process";
import { errorLog } from "../utils/common-utils.ts";

/**
 * Sets up an event listener to close the application when the ESC key is pressed.
 *
 * This function logs a message indicating that the ESC key can be used to close the application,
 * and listens for keydown events. If the ESC key is pressed, the application will exit.
 *
 * @example
 * appCloseKeyEvtWrapper();
 */
export const appCloseKeyEvtWrapper = (): void => {
  errorLog({
    msg:"Press ESC key to close",
    error:null,
    cb:() => {}
  });
  
  keypress().addEventListener("keydown", (input) => {
    if (input.key === "escape") {
      process.exit(0);
    }
  });
};
