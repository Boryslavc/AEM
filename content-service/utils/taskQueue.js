const { logger } = require("../logs/pinoLogger");

class TaskQueue {
    constructor(concurrency = 3) {
        this.taskQueue = [];
        this.consumerQueue = [];
        this.concurrency = concurrency;

        // Spawn consumers
        for (let i = 0; i < concurrency; i++) {
            this.consumer();
        }
    }

    async consumer() {
        while (true) {
            try {
                const task = await this.getNextTask();
                await task();
            } catch (err) {
                logger.error({ err }, 'Task execution failed');
            }
        }
    }

    getNextTask() {
        return new Promise((resolve) => {
            if (this.taskQueue.length !== 0) {
                return resolve(this.taskQueue.shift());
            }
            this.consumerQueue.push(resolve);
        });
    }

    runTask(task) {
        return new Promise((resolve, reject) => {
            const taskWrapper = () => {
                const taskPromise = task();
                taskPromise.then(resolve, reject);
                return taskPromise;
            };

            if (this.consumerQueue.length !== 0) {
                const consumer = this.consumerQueue.shift();
                consumer(taskWrapper);
            } else {
                this.taskQueue.push(taskWrapper);
            }
        });
    }
}

const taskQueue = new TaskQueue(3);

module.exports = { runTask: taskQueue.runTask.bind(taskQueue) };