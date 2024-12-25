# Sync Actions

Sync Actions is a library to execute asynchronous processes synchronously. It can be used to execute asynchronous processes synchronously in environments where `await` cannot be used.

Features:
- Synchronous asynchronous processing using Node.js Worker threads
- Type-safe function calls with TypeScript
- Native ESM

## Installation

```bash
npm install sync-actions
```

## Usage

By passing asynchronous functions to `defineSyncWorker()`, you define the interface and start the worker thread with `launch()`. It is common practice to separate the file that defines the worker from other processing files.


```typescript
// worker.js
import { defineSyncWorker } from "sync-actions";

export const { actions, worker } = defineSyncWorker(import.meta.filename, {
  ping: async () => {
    // Execute some asynchronous process,
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // Return the result as a return value
    return "pong";
  }
}).launch();
```

```typescript
// main.js
import { actions, worker } from "./worker.js";

// You can execute asynchronous functions synchronously
console.log(actions.ping()); // => "pong" is returned after 1 second

worker.terminate();
```

### Type-safe function calls

In TypeScript, you can make type-safe calls to functions defined with `defineSyncWorker`.

```typescript
// worker.ts
import { defineSyncWorker } from "sync-actions";

export const { actions, worker } = defineSyncWorker(import.meta.filename, {
  // By specifying the types of arguments and return values, type-safe calls are possible
  add: async (a: number, b: number): Promise<number> => {
    return a + b;
  }
}).launch();
```

```typescript
// main.ts
import { actions, worker } from "./worker.js";

// Type-safe call
actions.add(1, 2); // => 3 (number)

// @ts-expect-error
actions.add("1", 2);
// => Argument of type 'string' is not assignable to parameter of type 'number'

worker.terminate();
```

### Confirming the worker thread startup

To confirm that the worker thread has started, you can wait for `ready` to be sent with `worker.once('message')`. You can also catch errors if they occur with `worker.once('error')`.

```typescript
// main.js
import { worker } from "./worker.js";

worker.once('message', (message) => {
  if (message === 'ready') {
    // You can confirm that the worker thread has started
  }
});

worker.once('error', (error) => {
  // You can catch errors if they occur
  console.error(error);
});
```

### Terminating All Threads
By calling `terminateAllThreads()`, you can terminate all worker threads that have been started with `launch()`. The return value is an array of exit codes.

```typescript
import { terminateAllThreads } from "sync-actions";

const exitCodes = await terminateAllThreads();
```

## Environment Variables

### `DISABLE_SYNC_ACTIONS`

By setting the environment variable to `DISABLE_SYNC_ACTIONS=1`, the worker will not be created even if `launch()` is executed. This can be used when you want to import the file that includes the execution of `launch()` but do not want to generate the thread.

## License

Copyright (c) 2024 koyopro

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
