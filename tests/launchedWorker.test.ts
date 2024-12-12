import { actions, worker } from "./launchedWorker";

test("sync actinos", () => {
  expect(actions.ping()).toBe("pong!?");
  worker.terminate();
});
