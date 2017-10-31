'use strict';

const path = require('path');
const express = require('express');
const Twitter = require('twit');
const sentiment = require('sentiment');
const config = require('./config');
const nudge = require('nudge');

const app = express();

// Credentials are fed via the config module.
const twitter = new Twitter({
  consumer_key: config['twitter-consumer-key'],
  consumer_secret: config['twitter-consumer-secret'],
  access_token: config['twitter-access-token'],
  access_token_secret: config['twitter-access-token-secret']
});

// Example twitter stream listening for tweets about JavaScript.
const stream = twitter.stream('statuses/filter', { track: 'javascript' });

// Twitter sometimes throws a wobbly. Safe to simply log and ignore the errors.
stream.on('error', err => console.error(err.message)); // eslint-disable-line no-console

// A server sent events route. Streams tweets to the client.
app.get('/tweetSource', nudge(stream, {
  tweet: {
    preProcessor([tweet], successCallback) {
      if (tweet.text.indexOf('Please turn on JavaScript') !== -1) {
        return;
      }

      successCallback({ sentiment: sentiment(tweet.text), tweet });
    }
  }
}));

// Serve the static site bits.
app.use(express.static(path.join(__dirname, 'public')));

app.listen(config.port);
