import { CLIHandler } from "./classes/CLIHandler.js";
import { appEmitter } from "./event/app-event.js";

appEmitter.on("restart", () => {
  new CLIHandler();
});

new CLIHandler();
