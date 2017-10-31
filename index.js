'use strict';

const config = require('./config');
const cluster = require('cluster');

cluster.setupMaster({ exec: 'worker.js' });

function forker(callback) {
  const worker = cluster.fork();
  const id = worker.id;
  const pid = worker.process.pid;

  worker.once('listening', () => {
    console.log(`Spawned worker: ${id}, pid: ${pid}.`); // eslint-disable-line no-console

    if (callback) {
      callback();
    }
  });
}

function handleExit(worker) {
  const id = worker.id;
  const pid = worker.process.pid;

  console.error(`Worker: ${id}, pid: ${pid} died.`); // eslint-disable-line no-console

  forker();
}

cluster.on('exit', handleExit);

function spawner(num, callback) {
  let total = 0;

  function cb() {
    total += 1;

    if (total === num) {
      callback();
    }
  }

  for (let i = 0; i < num; i++) {
    forker(cb);
  }
}

console.log('Spawning', config.workers, 'workers.'); // eslint-disable-line no-console

spawner(config.workers, () => {
  console.log('Workers listening on port', config.port); // eslint-disable-line no-console
  console.log('Master pid:', process.pid); // eslint-disable-line no-console
});
