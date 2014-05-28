/* jshint browser: true, node: true */

// Horrible. Needs a rewrite.

var randomVelocity = require('./randomVelocity');

var Sprite = function (sentiment, p, w, h, canvas) {
    this.sentiment = sentiment;
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.position = p;
    this.height = w;
    this.width = h;
    this.createdAt = window.performance.now();
    this.time = window.performance.now();

    this.state = 'spawn';
    this.velocity = { x: 0, y: 0 };
    this.changeStateAt = this.time + 1500;
};

Sprite.prototype.animate = function (t) {
    this.lastTime = this.time;
    this.time = t;

    if (this.changeStateAt < t) {
        this.changeState(
            Math.random() > 0.5 ? 'wandering' : 'stopped',
            randomVelocity(),
            t + Math.random() * 2000
        );
    }

    switch (this.state) {
        case 'wandering':
            this.wander();
            break;
        case 'stopped':
            this.stop();
            break;
        case 'spawn':
            this.spawn();
            break;
    }

    this.move();
    this.render();
};

Sprite.prototype.changeState = function (state, velocity, until) {
    if (state === 'stopped') {
        this.velocity = { x: 0, y: 0 };
    } else {
        this.velocity = { x: velocity.x, y: velocity.y };
    }

    if (state !== 'spawn') {
        this.opacity = 0.5;
    }

    var cWidth = this.canvas.width;

    if (this.sentiment > 0 && this.position.x > (cWidth - this.width) / 2) {
        this.velocity.x = Math.abs(this.velocity.x) * -1;
    }

    if (this.sentiment < 0 && this.position.x < (cWidth - this.width) / 2) {
        this.velocity.x = Math.abs(this.velocity.x);
    }

    this.facing = this.velocity.x > 0 ? 'right' : 'left';

    this.changeStateAt = until;
    this.state = state;
};

Sprite.prototype.wander = function () {
    // How should I determine the time for a step?
    var period = 1000; // 1 second per cycle of steps.
    var timeUntilTransition = this.changeStateAt - this.time;

    // First, just consider walking as four frames, like in the classics.
    if (timeUntilTransition > 3 * period / 4) {
        this.step = 'left';
    } else if (timeUntilTransition > period / 2) {
        this.step = 'stop';
    } else if (timeUntilTransition > period / 4) {
        this.step = 'right';
    } else {
        this.step = 'stop';
    }
};

Sprite.prototype.stop = function () {
    this.step = 'stop';
};

Sprite.prototype.spawn = function () {
    this.step = 'stop';
    this.opacity = 0.5 * (this.time - this.createdAt) / (this.changeStateAt - this.createdAt);
};

Sprite.prototype.move = function () {
    var dt = this.time - this.lastTime;
    var cWidth = this.canvas.width;
    var cHeight = this.canvas.height;

    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;

    if (this.position.x < 0 && this.velocity.x < 0) {
        this.velocity.x *= -1;
        this.position.x += 2 * this.velocity.x * dt;
        this.facing = 'right';
    }

    if (this.position.x > cWidth - this.width && this.velocity.x > 0) {
        this.velocity.x *= -1;
        this.position.x += 2 * this.velocity.x * dt;
        this.facing = 'left';
    }

    if (this.position.y < 0 && this.velocity.y < 0) {
        this.velocity.y *= -1;
        this.position.y += 2 * this.velocity.y * dt;
    }

    if (this.position.y > cHeight - this.height && this.velocity.y > 0) {
        this.velocity.y *= -1;
        this.position.y += 2 * this.velocity.y * dt;
    }
};

Sprite.prototype.render = function () {
    var context = this.context;

    function makeGrid(offset, grid) {
        for (var i = 0, ilen = grid.length; i < ilen; i++) {
            var row = grid[i];

            for (var j = 0, jlen = row.length; j < jlen; j++) {
                if (row[j]) {
                    context.fillRect(offset.x + j * 5, offset.y + i * 5, 5, 5);
                }
            }
        }
    }

    if (this.sentiment === 0) {
        context.fillStyle = 'rgba(0,0,0,' + this.opacity + ')';
    } else if (this.sentiment > 0) {
        context.fillStyle = 'rgba(0,200,0,' + this.opacity + ')';
    } else {
        context.fillStyle = 'rgba(0,0,200,' + this.opacity + ')';
    }

    if (this.step === 'stop') {
        return makeGrid(this.position, [
            [0, 0, 1, 0, 0],
            [0, 1, 1, 1, 0],
            [1, 0, 1, 0, 1],
            [0, 0, 1, 0, 0],
            [0, 1, 0, 1, 0],
            [0, 1, 0, 1, 0]
        ]);
    }

    if (this.facing === 'right') {
        makeGrid(this.position, [
            [0, 0, 1, 0, 1],
            [0, 1, 1, 1, 0],
            [1, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 1, 0, 1, 0],
            [1, 0, 0, 1, 0]
        ]);
    } else {
        makeGrid(this.position, [
            [1, 0, 1, 0, 0],
            [0, 1, 1, 1, 0],
            [0, 0, 1, 0, 1],
            [0, 0, 1, 0, 0],
            [0, 1, 0, 1, 0],
            [0, 1, 0, 0, 1]
        ]);
    }
};

module.exports = Sprite;
