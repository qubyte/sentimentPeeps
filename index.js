var config = require('./config');
var cluster = require('cluster');

cluster.setupMaster({ exec : 'worker.js' });

function forker(callback) {
    var worker = cluster.fork();
    var id = worker.id;
    var pid = worker.process.pid;

    worker.once('listening', function () {
        console.log('Spawned worker:', id + ',', 'pid:', pid);

        if (callback) {
            callback();
        }
    });
}

function handleExit(worker) {
    var id = worker.id;
    var pid = worker.process.pid;

    console.error('Worker:', id + ',', 'pid', pid, 'died');

    forker();
}

cluster.on('exit', handleExit);

function spawner(num, callback) {
    var total = 0;

    function cb() {
        total += 1;

        if (total === num) {
            callback();
        }
    }

    for (var i = 0; i < num; i++) {
        forker(cb);
    }
}

console.log('Spawning', config.workers, 'workers.');

spawner(config.workers, function () {
    console.log('Workers listening on port', config.port);
    console.log('Master pid:', process.pid);
});
