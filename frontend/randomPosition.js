/* jshint browser: true, node: true */

function randomPosition(spriteWidth, spriteHeight, canvas) {
    return {
        x: Math.random() * (canvas.width - spriteWidth),
        y: Math.random() * (canvas.height - spriteHeight)
    };
}

module.exports = randomPosition;