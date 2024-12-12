import { defineSyncWorker } from "../dist/index";

export const { actions, worker } = defineSyncWorker(import.meta.filename, {
  ping: () => "pong!?",
}).launch();
