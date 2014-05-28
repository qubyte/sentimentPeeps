// Very minimal configuration using command line arguments via minimist. For larger applications
// that intend to be mainly command line configured, yargs may be a better option.

var config = require('minimist')(process.argv.slice(2));

module.exports = config;

var errors = [];

if (!config.hasOwnProperty('twitter-consumer-key')) {
    errors.push('No twitter-consumer-key given.');
}

if (!config.hasOwnProperty('twitter-consumer-secret')) {
    errors.push('No twitter-consumer-secret given.');
}

if (!config.hasOwnProperty('twitter-access-token')) {
    errors.push('No twitter-access-token given.');
}

if (!config.hasOwnProperty('twitter-access-token-secret')) {
    errors.push('No twitter-access-token-secret given.');
}

// Log critical error messages and exit.
if (errors.length) {
    errors.forEach(function (message) {
        console.error(message);
    });

    process.exit(1);
}

// Handle default configuration.
if (!config.hasOwnProperty('workers')) {
    config.workers = 1;
}

if (!config.hasOwnProperty('port')) {
    config.port = 3000;
}
