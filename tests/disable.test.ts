import syncWorker from "./worker";

test("DISABLE_SYNC_ACTIONS env", () => {
  process.env.DISABLE_SYNC_ACTIONS = "true";
  const client = syncWorker.launch();
  expect(client.actions).toBe(undefined);
  process.env.DISABLE_SYNC_ACTIONS = undefined;
})
