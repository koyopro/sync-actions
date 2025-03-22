import client from "./jsWorker";

let errorMessage = "foo";
vi.mock("esbuild", async () => {
  const esbuild = await vi.importActual<typeof import("esbuild")>("esbuild");
  return {
    buildSync: vi.fn((...args) => {
      if (errorMessage) throw new Error(errorMessage);
      // @ts-ignore
      return esbuild.buildSync(...args);
    }),
  };
});

test("should successfully launch and ping when no error occurs", async () => {
  errorMessage = "";
  const { actions, worker } = client.launch();
  expect(actions.ping()).toBe("pong!?");
  worker.terminate();
});

test("should work correctly when buildSync encounters a write error", async () => {
  errorMessage = "Failed to create output directory: mkdir /var/task/node_modules/.sync-action-workers: read-only file system";
  const { actions, worker } = client.launch();
  expect(actions.ping()).toBe("pong!?");
  worker.terminate();
});

test("should throw an error when buildSync fails with a non-write error", async () => {
  errorMessage = "Other Error";
  expect(client.launch).toThrow(Error);
});
