/* jshint browser: true, node: true */

function randomVelocity() {
    return {
        x: 0.1 * (Math.random() - 0.5),
        y: 0.1 * (Math.random() - 0.5)
    };
}

module.exports = randomVelocity;