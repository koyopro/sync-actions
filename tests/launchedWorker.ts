import { launchSyncWorker } from "../dist/index";

export const { actions, getWorker, stopWorker } = launchSyncWorker(import.meta.filename, {
  ping: () => "pong!?",
});
