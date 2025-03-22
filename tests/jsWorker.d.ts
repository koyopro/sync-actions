declare const _default: {
    launch: () => {
        actions: import("../dist/index").Client<{
            ping: () => string;
        }>;
        worker: import("worker_threads").Worker;
    };
};
export default _default;
