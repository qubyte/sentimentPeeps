var EventEmitter = require('events').EventEmitter;
var express = require('express');
var Twitter = require('twit');
var sentiment = require('sentiment');
var browserify = require('browserify');
var config = require('./config');
var nudge = require('nudge');

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

// Listen for tweets and emit filtered and analyzed tweets.
var streamMiddleware = nudge(stream, {
    tweet: {
        preProcessor: function (args, successCallback) {
            var tweet = args[0];

            if (tweet.text.indexOf('Please turn on JavaScript') !== -1) {
                return;
            }

            successCallback({
                sentiment: sentiment(tweet.text),
                tweet: tweet
            });
        }
    }
});

// Twitter sometimes throws a wobbly. Safe to simply log and ignore the errors.
stream.on('error', function (err) {
    'use strict';

    console.error(err.message);
});

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
    app.get('/tweetSource', streamMiddleware);

    // Serve the static site bits.
    app.use(express.static(__dirname + '/web'));

    app.listen(config.port);
});
