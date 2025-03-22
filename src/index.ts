import { createHash } from "crypto";
import { buildSync } from "esbuild";
import { type FileHandle } from "fs/promises";
import path from "path";
import {
  MessageChannel,
  MessagePort,
  Worker,
  parentPort,
  receiveMessageOnPort,
  workerData,
} from "worker_threads";

export type Actions = Record<string, (...args: any[]) => any>;
type AwaitedFunc<F extends Actions, K extends keyof F> = (
  ...args: Parameters<F[K]>
) => Awaited<ReturnType<F[K]>>;
export type Client<F extends Actions> = { [K in keyof F]: AwaitedFunc<F, K> };

const isSubThread = workerData?.subThreadForSync === true;

let workers = [] as Worker[];

/**
 * Defines a synchronous worker with the given filename and actions.
 *
 * @param filepath - The filepath of the worker script.
 * @param actions - The actions to be used by the worker.
 *
 * The `launch` method returns an object containing:
 * - `actions`: The client actions that communicate with the worker.
 * - `worker`: The Worker instance.
 *
 * @example
 *
 * ```ts
 * import { defineSyncWorker } from "sync-actions";
 *
 * export const { actions, worker } = defineSyncWorker(import.meta.filename, {
 *   ping: async () => {
 *     // Execute some asynchronous process,
 *     await new Promise((resolve) => setTimeout(resolve, 1000));
 *     // Return the result as a return value
 *     return "pong";
 *   }
 * }).launch();
 * ```
 */
export const defineSyncWorker = <F extends Actions>(
  filepath: string,
  actions: F
) => {
  useAction(actions);
  // Parent thread
  return {
    /**
     * Launches the worker and returns the client actions and the worker instance.
     */
    launch: (): { actions: Client<F>; worker: Worker } => {
      if (isSubThread || process.env.DISABLE_SYNC_ACTIONS) return {} as any;

      const sharedBuffer = new SharedArrayBuffer(4);
      const { port1: mainPort, port2: workerPort } = new MessageChannel();

      const execPath = prepareExecuteFile(filepath);
      const worker = new Worker(execPath, {
        workerData: { sharedBuffer, workerPort, subThreadForSync: true },
        transferList: [workerPort],
      });
      workers.push(worker);
      const actions = buildClient(worker, sharedBuffer, mainPort) as any;

      return {
        actions,
        worker,
      };
    },
  };
};

const prepareExecuteFile = (filepath: string) => {
  const tmpfile = makeTmpFilePath(filepath);
  try {
    buildFile(filepath, tmpfile);
    return tmpfile;
  } catch (e) {
    if (
      e instanceof Error &&
      e.message.includes("read-only file system")
    ) {
      // When running in AWS Lambda, the file system is read-only, so writing may fail.
      // However, libraries might already be in a format executable by Node.js, so try running with the original file.
      // Log a warning message when fallback to original file
      console.warn(
        `[sync-actions]: Failed to write compiled worker file. Falling back to original file: ${filepath}`
      );
      return filepath;
    }
    throw e;
  }
};

/**
 * Terminates all worker threads.
 *
 * This function asynchronously terminates all worker threads by calling the `terminate` method.
 *
 * @returns A Promise that resolves to an array of exit codes for each worker.
 */
export const terminateAllWorkers = async (): Promise<(number | undefined)[]> =>
  Promise.all(workers.map((worker) => worker.terminate()));

const makeTmpFilePath = (filename: string) => {
  const hash = createHash("sha256").update(filename).digest("hex");
  const name = `${path.basename(filename)}_${hash}.mjs`;
  const dir =
    process.env.SYNC_ACTIONS_TEMP_DIR || `${process.cwd()}/node_modules`;
  return path.resolve(dir, `.sync-action-workers/${name}`);
};

const buildClient = (
  worker: Worker,
  sharedBuffer: SharedArrayBuffer,
  mainPort: MessagePort
) => {
  const sharedArray = new Int32Array(sharedBuffer);
  return new Proxy(
    {},
    {
      get: (_, key: string) => {
        return (...args: any) => {
          const transferList = args.filter((arg: any) => isTransferable(arg));
          worker.postMessage({ method: key, args }, transferList);
          Atomics.wait(sharedArray, 0, 0);
          const { result, error, properties } =
            receiveMessageOnPort(mainPort)?.message || {};
          Atomics.store(sharedArray, 0, 0);
          if (error) {
            throw Object.assign(new Error(error), properties);
          }
          return result;
        };
      },
    }
  );
};

const useAction = (actions: Actions) => {
  if (!isSubThread) return;

  parentPort?.on("message", async (mgs) => {
    const sharedArray = new Int32Array(workerData.sharedBuffer);
    try {
      const ret = await actions[mgs.method]?.(...(mgs.args ?? []));
      const transferList = isTransferable(ret) ? [ret] : [];
      workerData.workerPort.postMessage({ result: ret }, transferList);
    } catch (e: any) {
      workerData.workerPort.postMessage({
        error: e.message,
        properties: extractProperties(e),
      });
    }
    Atomics.store(sharedArray, 0, 1);
    Atomics.notify(sharedArray, 0, 1);
  });
  parentPort?.postMessage("ready");
};

function buildFile(filePath: string, outfile: string) {
  buildSync({
    entryPoints: [filePath],
    outfile: outfile,
    bundle: true,
    platform: "node",
    format: "esm",
    sourcemap: false,
    allowOverwrite: true,
    packages: "external",
    target: "node18",
  });
}

// MessagePort doesn't copy the properties of Error objects. We still want
// error objects to have extra properties such as "warnings" so implement the
// property copying manually.
export function extractProperties<T extends object>(object: T): T;
export function extractProperties<T>(object?: T): T | undefined;
export function extractProperties<T>(object?: T) {
  if (object && typeof object === "object") {
    const properties = {} as T;
    for (const key in object) {
      properties[key as keyof T] = object[key];
    }
    return properties;
  }
}

const isTransferable = (obj: any): boolean => {
  return (
    obj instanceof ArrayBuffer ||
    obj instanceof MessagePort ||
    // obj instanceof Blob ||
    isFileHandle(obj)
  );
};

function isFileHandle(obj: any): obj is FileHandle {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.fd === "number" &&
    typeof obj.read === "function"
  );
}
