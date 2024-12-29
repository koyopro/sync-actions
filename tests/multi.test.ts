import { terminateAllWorkers } from "../src";
import actions from "./worker";


test("launch multiple workers", async () => {
  const client1 = actions.launch();
  const client2 = actions.launch();
  expect(client1.actions.magic(0)).toBe(1);
  expect(client2.actions.magic(0)).toBe(1);
  client1.worker.terminate();
  expect(client2.actions.magic(0)).toBe(2);
  client2.worker.terminate();
});

test("terminateAllWorkers()", async () => {
  const client1 = actions.launch();
  const client2 = actions.launch();
  const client3 = actions.launch();
  expect(await client3.worker.terminate()).toBe(0)

  await terminateAllWorkers();

  // all threads are already terminated
  expect(await client1.worker.terminate()).toBeUndefined();
  expect(await client2.worker.terminate()).toBeUndefined();
  expect(await client3.worker.terminate()).toBeUndefined();
});
