var EventEmitter = require('events').EventEmitter;
var express = require('express');
var Twitter = require('twit');
var sentiment = require('sentiment');
var browserify = require('browserify');
var config = require('./config');

var app = express();

// Credentials are fed via the config module.
var twitter = new Twitter({
    /* jsjint ignore: start */
    consumer_key: config['twitter-consumer-key'],
    consumer_secret: config['twitter-consumer-secret'],
    access_token: config['twitter-access-token'],
    access_token_secret: config['twitter-access-token-secret']
    /* jshint ignore: end */
});

// Example twitter stream listening for tweets about JavaScript.
var stream = twitter.stream('statuses/filter', { track: 'javascript' });

// Emitter will re-emit analyzed tweets.
var analyzed = new EventEmitter();

// Listen for tweets and emit filtered and analyzed tweets.
stream.on('tweet', function (tweet) {
    if (tweet.text.indexOf('Please turn on JavaScript') !== -1) {
        return;
    }

    analyzed.emit('tweet', {
        sentiment: sentiment(tweet.text),
        tweet: tweet
    });
});

// Twitter sometimes throws a wobbly. Safe to simply log and ignore the errors.
stream.on('error', function (err) {
    'use strict';

    console.error(err.message);
});

// Custom middleware creator to hold open a connection for Server Sent Events. Listens on stream for
// events with a given eventName.
function handleSse(stream, eventName) {
    'use strict';

    return function (req, res) {
        // Necessary headers for SSE.
        res.status(200).set({
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });

        // SSE required newline.
        res.write('\n');

        // Send events to the client.
        function eventSender(data) {
            res.write('event: ' + eventName + '\n');
            res.write('data: ' + JSON.stringify(data) + '\n\n');
        }

        stream.on(eventName, eventSender);

        req.once('close', function () {
            stream.removeListener(eventName, eventSender);
        });
    };
}

// Make a browserify bundle at boot time. Fine for small codebases.
function makeBundle(callback) {
    var b = browserify();
    b.add('./frontend/peeps.js');
    b.bundle({ standalone: 'bundle.js' }, callback);
}

// Bundle the front end code, then configure the express server and tell it to listen.
makeBundle(function (err, bundle) {
    if (err) {
        console.error(err.stack || err.message);
        process.exit(1);
    }

    app.get('/bundle.js', function (req, res) {
        res.set('content-type', 'text/javascript');
        res.send(bundle);
    });

    // A server sent events route. Streams tweets to the client.
    app.get('/tweetSource', handleSse(analyzed, 'tweet'));

    // Serve the static site bits.
    app.use(express.static(__dirname + '/web'));

    app.listen(config.port);
});
