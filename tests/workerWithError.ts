import { workerData } from "worker_threads";
import { defineSyncWorker } from "../src/index";

if (workerData?.sharedBuffer) {
  throw new Error("Sample error on launching worker.");
}

export default defineSyncWorker(import.meta.filename, {});
