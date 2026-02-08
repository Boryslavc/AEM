const { logger } = require("../logs/pinoLogger");

const queue = []
let processing = false

async function processQueue() {
    if(processing) return
    processing = true

    while(queue.length > 0){
        const job = queue.shift()
        try {
            await job()
        } catch (error) {
            logger.error(error)
        }
    }

    processing = false;
}

function enqueueTask(task) {
    queue.push(task)
    processQueue()
}

module.exports = { runTask: enqueueTask }