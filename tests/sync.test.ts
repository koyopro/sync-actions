import { open } from "node:fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import sync from "./worker";
import fail from "./workerWithError";

const { actions } = sync.launch();

test("sync actinos", async () => {
  expect(actions.ping()).toBe("pong!?");
  expect(actions.incr(3)).toBe(4);
  expect(actions.magic(0)).toBe(1);
  expect(actions.magic(1)).toBe(3);
  expect(actions.magic(2)).toBe(5);
  expect(actions.errorSample).toThrowError("errorSample");
  try {
    actions.myErrorTest();
  } catch (e) {
    expect(e).toMatchObject({ name: "MyError", message: "myErrorTest", prop1: "foo" });
  }
});

test("sync FileHandle read", async () => {
  const filepath = fileURLToPath(path.join(import.meta.url, "../sample.txt"));
  const fileHandle = await open(filepath, "r");
  const arrayBuffer = actions.readFile(fileHandle);
  const textDecoder = new TextDecoder("utf-8");
  const text = textDecoder.decode(arrayBuffer);
  expect(text).toMatch("I could read a file.");
});

test("sync File read", () => {
  const fileContent = new Uint8Array([72, 101, 108, 108, 111]); // Binary data for "Hello"
  const blob = new Blob([fileContent], { type: "text/plain" });
  const file = new File([blob], "example.txt", { type: "text/plain" });

  const arrayBuffer = actions.file(file);
  const textDecoder = new TextDecoder("utf-8");
  const text = textDecoder.decode(arrayBuffer);
  expect(text).toMatch("Hello");
});

test("sync actinos with error", async () => {
  const { worker } = fail.launch();
  await new Promise<void>((resolve) => {
    worker.on("error", (error) => {
      expect(error).toMatchObject({ message: "Sample error on launching worker." });
      resolve();
    });
  });
});
