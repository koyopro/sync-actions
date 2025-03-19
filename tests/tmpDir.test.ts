import fs from "fs";
import actions from "./worker";

const tmp = process.env.RUNNER_TEMP || "/tmp";
const dir = `${tmp}/.sync-action-workers`;

beforeAll(() => {
  if (fs.existsSync(dir)) fs.rmdirSync(dir, { recursive: true });
  process.env.SYNC_ACTIONS_TEMP_DIR = tmp;
});

afterAll(() => {
  process.env.SYNC_ACTIONS_TEMP_DIR = undefined;
});

test("SYNC_ACTIONS_TEMP_DIR", async () => {
  const client1 = actions.launch();
  client1.worker.terminate();
  expect(fs.existsSync(dir)).toBe(true);
});
