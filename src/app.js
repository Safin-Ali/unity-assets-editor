import { brightBlue, brightRed } from "https://deno.land/std@0.221.0/fmt/colors.ts";
import { CLIHandler } from "./classes/CLIHandler.js";
import { appEmitter, restartApp } from "./event/app-event.js";
import { textCB } from "https://deno.land/x/deno_figlet@1.0.0/mod.ts";
import "https://deno.land/x/deno_figlet@1.0.0/dist/fonts/_doom.ts";
import { brightGreen } from "https://deno.land/std@0.170.0/fmt/colors.ts";

appEmitter.on("restart", () => {
	console.log(`${brightGreen("Created by")} ${brightRed("DevSA")}`)
  textCB("UABE BUSSID", "doom", null, (myAwesomeFiglet) => {
    console.log(brightBlue(myAwesomeFiglet));
    new CLIHandler();
  });
});

restartApp();
