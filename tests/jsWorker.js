import { defineSyncWorker } from "../dist/index.js";
export default defineSyncWorker(import.meta.filename, {
    ping: () => "pong!?",
});
