import { workerData } from "worker_threads";
import { defineSyncWorker } from "../src/index";

if (workerData?.sharedBuffer) {
  const e: any = new Error("Sample error on launching worker.");
  e.code = "SAMPLE_ERROR";
  throw e;
}

export default defineSyncWorker(import.meta.filename, {});
