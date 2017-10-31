// Works, but badly formed. Needs a refactor and potentially splitting into modules.

const garden = window.document.getElementById('garden');
const chatter = window.document.getElementById('chatter');

import Sprite from './sprite.js';
import randomPosition from './random-position.js';

let gardenCtx;
let chatterCtx;
const avatars = [];

// The sprites are animated using this function.
function draw(t) {
  // Clear the canvas.
  gardenCtx.clearRect(0, 0, garden.width, garden.height);

  // Make a green background for testing.
  gardenCtx.fillStyle = 'rgba(0,0,0,0.1)';
  gardenCtx.fillRect(0, 0, garden.width, garden.height);

  // Render sprites for this time.
  for (let i = avatars.length - 1, verticalDist = 0; i >= 0; i--) {
    const avatar = avatars[i];
    const pic = avatar.pic;

    if (!pic.complete) {
      continue;
    }

    avatar.sprite.animate(t, gardenCtx);

    for (let j = 0, jlen = Math.min(avatar.text.length, 3); j < jlen; j++) {
      chatterCtx.fillText(avatar.text[j], pic.naturalWidth + 5, garden.height - verticalDist + 15 * j);
    }
  }

  // Next frame.
  window.requestAnimationFrame(draw);
}

function resetChatter() {
  // Clear the canvas.
  chatterCtx.clearRect(0, 0, chatter.width, chatter.height);

  // White background.
  chatterCtx.fillStyle = 'rgb(255,255,255)';
  chatterCtx.fillRect(0, 0, chatter.width, chatter.height);
}

// The chatter canvas only changes when new tweets come in. No need for an endless animation.
function drawChatter() {
  resetChatter();

  // Render sprites for this time.
  for (let i = avatars.length - 1, verticalDist = 0; i >= 0; i--) {
    const avatar = avatars[i];
    const sprite = avatar.sprite;
    const pic = avatar.pic;

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

    for (let j = 0, jlen = Math.min(avatar.text.length, 3); j < jlen; j++) {
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
  const text = [`@${tweet.user.screen_name}:`];
  const textWidth = chatter.width - pic.naturalWidth - 5;
  const textSplit = tweet.text.split(' ');

  for (const word of textSplit) {
    const updatedLine = `${text[text.length - 1]} ${word}`;
    const isTooLong = chatterCtx.measureText(updatedLine).width > textWidth;

    if (isTooLong) {
      text.push(word);
    } else {
      text[text.length - 1] = updatedLine;
    }
  }

  return {
    sprite: new Sprite({
      sentiment: sentiment.score,
      position: randomPosition(25, 30, garden),
      width: 25,
      height: 30,
      canvas: garden
    }),
    pic,
    text
  };
}

const tweetSource = new window.EventSource('/tweetSource');

tweetSource.addEventListener('tweet', event => {
  let data;

  try {
    data = JSON.parse(event.data);
  } catch (e) {
    console.error(e); // eslint-disable-line no-console
    return;
  }

  if (data === undefined) {
    return;
  }

  const tweet = data.tweet;
  const sentiment = data.sentiment;

  const pic = new Image();
  pic.src = tweet.user.profile_image_url;

  pic.onload = function () {
    avatars.push(makeAvatar(tweet, sentiment, pic));

    // Keep only the newest 20.
    const over = avatars.length - 20;

    if (over > 0) {
      avatars.splice(0, over);
    }

    if (chatterCtx) {
      drawChatter();
    }
  };
});
