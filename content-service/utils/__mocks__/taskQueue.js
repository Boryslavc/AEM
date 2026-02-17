// Mock task queue for tests - runs synchronously
module.exports = {
  runTask: (fn) => fn(),
  getQueueStats: () => ({ queuedTasks: 0, idleConsumers: 0, activeTasks: 0, concurrency: 1 })
};
