import actions from "./worker";

test("DISABLE_SYNC_ACTIONS env", () => {
  process.env.DISABLE_SYNC_ACTIONS = "true";
  const client = actions.launch();
  expect(client.ping).toBe(undefined);
  process.env.DISABLE_SYNC_ACTIONS = undefined;
})
