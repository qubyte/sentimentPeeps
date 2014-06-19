/* jshint browser: true */

// Works, but badly formed. Needs a refactor and potentially splitting into modules.

var garden = window.document.getElementById('garden');
var chatter = window.document.getElementById('chatter');
var Sprite = require('./Sprite');
var randomPosition = require('./randomPosition');

var gardenCtx;
var chatterCtx;
var avatars = [];

// The sprites are animated using this function.
function draw(t) {
    // Clear the canvas.
    gardenCtx.clearRect(0, 0, garden.width, garden.height);

    // Make a green background for testing.
    gardenCtx.fillStyle = 'rgba(0,0,0,0.1)';
    gardenCtx.fillRect(0, 0, garden.width, garden.height);

    // Render sprites for this time.
    for (var i = avatars.length - 1, verticalDist = 0; i >= 0; i--) {
        var avatar = avatars[i];
        var pic = avatar.pic;

        if (!pic.complete) {
            continue;
        }

        avatar.sprite.animate(t, gardenCtx);

        for (var j = 0, jlen = Math.min(avatar.text.length, 3); j < jlen; j++) {
            var textSnippet = avatar.text[j];

            chatterCtx.fillText(textSnippet, pic.naturalWidth + 5, garden.height - verticalDist + 15 * j);
        }
    }

    // Next frame.
    window.requestAnimationFrame(draw);
}


// The chatter canvas only changes when new tweets come in. No need for an endless animation.
function drawChatter() {
    // Clear the canvas.
    chatterCtx.clearRect(0, 0, chatter.width, chatter.height);

    // White background.
    chatterCtx.fillStyle = 'rgb(255,255,255)';
    chatterCtx.fillRect(0, 0, chatter.width, chatter.height);

    // Render sprites for this time.
    for (var i = avatars.length - 1, verticalDist = 0; i >= 0; i--) {
        var avatar = avatars[i];
        var sprite = avatar.sprite;
        var pic = avatar.pic;

        if (!pic.complete) {
            continue;
        }

        verticalDist += pic.naturalHeight;

        if (garden.height - verticalDist < 0) {
            break;
        }

        if (sprite.sentiment > 0) {
            chatterCtx.fillStyle = 'rgba(0,200,0,0.1)';
            chatterCtx.fillRect(0, garden.height - verticalDist, chatter.width, pic.naturalHeight);
        } else if (sprite.sentiment < 0) {
            chatterCtx.fillStyle = 'rgba(0,0,200,0.1)';
            chatterCtx.fillRect(0, garden.height - verticalDist, chatter.width, pic.naturalHeight);
        }

        chatterCtx.drawImage(pic, 0, garden.height - verticalDist);

        chatterCtx.fillStyle = 'rgb(0,0,0)';

        for (var j = 0, jlen = Math.min(avatar.text.length, 3); j < jlen; j++) {
            chatterCtx.fillText(
                avatar.text[j],
                pic.naturalWidth + 5,
                garden.height - verticalDist + 15 * j
            );
        }
    }
}

if (garden.getContext && chatter.getContext) {
    gardenCtx = garden.getContext('2d');
    chatterCtx = chatter.getContext('2d');
    chatterCtx.font = '8pt Courier';
    chatterCtx.textBaseline = 'top';

    window.requestAnimationFrame(draw);
}

// This function returns an object that contains everything needed to render a sprite in the garden
// and chatter.
function makeAvatar(tweet, sentiment, pic) {
    var text = ['@' + tweet.user['screen_name'] + ':'];

    var textWidth = chatter.width - pic.naturalWidth - 5;
    var textSplit = tweet.text.split(' ');

    for (var i = 0, len = textSplit.length; i < len; i++) {
        var word = textSplit[i];
        var updatedLine = text[text.length - 1] + ' ' + word;
        var isTooLong = chatterCtx.measureText(updatedLine).width > textWidth;

        if (isTooLong) {
            text.push(word);
        } else {
            text[text.length - 1] = updatedLine;
        }
    }

    return {
        sprite: new Sprite(sentiment.score, randomPosition(25, 30, garden), 30, 25, garden),
        pic: pic,
        text: text
    };
}

var tweetSource = new window.EventSource('/tweetSource');

tweetSource.addEventListener('tweet', function (event) {
    var data;

    try {
        data = JSON.parse(event.data);
    } catch (e) {
        console.error(e);
        return;
    }

    if (data === undefined) {
        return;
    }

    var tweet = data.tweet;
    var sentiment = data.sentiment;

    var pic = new Image();
    pic.src = tweet.user['profile_image_url'];

    pic.onload = function () {
        avatars.push(makeAvatar(tweet, sentiment, pic));

        // Keep only the newest 20.
        var over = avatars.length - 20;

        if (over > 0) {
            avatars.splice(0, over);
        }

        if (chatterCtx) {
            drawChatter();
        }
    };
});
