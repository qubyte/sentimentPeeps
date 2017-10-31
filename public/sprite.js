// Horrible. Needs a rewrite.

import randomVelocity from './random-velocity.js';

export default class Sprite {
  constructor({ sentiment, position, width, height, canvas }) { // eslint-disable-line max-params
    const now = window.performance.now();

    this.sentiment = sentiment;
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.position = position;
    this.height = height;
    this.width = width;
    this.createdAt = now;
    this.time = now;

    this.state = 'spawn';
    this.velocity = { x: 0, y: 0 };
    this.changeStateAt = this.time + 1500;
  }

  animate(t) {
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
    default:
      break;
    }

    this.move();
    this.render();
  }

  changeState(state, velocity, until) {
    if (state === 'stopped') {
      this.velocity = { x: 0, y: 0 };
    } else {
      this.velocity = { x: velocity.x, y: velocity.y };
    }

    if (state !== 'spawn') {
      this.opacity = 0.5;
    }

    const cWidth = this.canvas.width;

    if (this.sentiment > 0 && this.position.x > (cWidth - this.width) / 2) {
      this.velocity.x = Math.abs(this.velocity.x) * -1;
    }

    if (this.sentiment < 0 && this.position.x < (cWidth - this.width) / 2) {
      this.velocity.x = Math.abs(this.velocity.x);
    }

    this.facing = this.velocity.x > 0 ? 'right' : 'left';

    this.changeStateAt = until;
    this.state = state;
  }

  wander() {
    // How should I determine the time for a step?
    const period = 1000; // 1 second per cycle of steps.
    const timeUntilTransition = this.changeStateAt - this.time;

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
  }

  stop() {
    this.step = 'stop';
  }

  spawn() {
    this.step = 'stop';
    this.opacity = 0.5 * (this.time - this.createdAt) / (this.changeStateAt - this.createdAt);
  }

  move() {
    const dt = this.time - this.lastTime;
    const cWidth = this.canvas.width;
    const cHeight = this.canvas.height;

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
  }

  render() {
    const context = this.context;

    function makeGrid(offset, grid) {
      for (let i = 0, ilen = grid.length; i < ilen; i++) {
        const row = grid[i];

        for (let j = 0, jlen = row.length; j < jlen; j++) {
          const col = row[j];

          if (col) {
            context.fillRect(offset.x + j * 5, offset.y + i * 5, 5, 5);
          }
        }
      }
    }

    if (this.sentiment === 0) {
      context.fillStyle = `rgba(0,0,0,${this.opacity})`;
    } else if (this.sentiment > 0) {
      context.fillStyle = `rgba(0,200,0,${this.opacity})`;
    } else {
      context.fillStyle = `rgba(0,0,200,${this.opacity})`;
    }

    // TODO
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
  }
}
