/* global Actors, Actor, Vec3, VecR */

Actors.Rat = function (env, refs, attrs) {
  this.env = env;
  this.refs = refs;
  this.opts = this.genOpts();
  this.attrs = this.genAttrs(attrs);
  this.init(attrs);
};

Actors.Rat.prototype = Object.create(Actor.prototype);

Actors.Rat.prototype.title = 'Rat';

Actors.Rat.prototype.init = function (attrs) {
  this.pos = new Vec3(
    attrs.x,
    attrs.y,
    0
  );

  this.velo = new VecR(
    Math.PI * 2 * Math.random(),
    this.attrs.speed
  ).vec3();
};

Actors.Rat.prototype.genAttrs = function (attrs) {
  var hp = this.opts.hp_base + (this.opts.hp_flux * Math.random());
  var type = Math.floor(Math.random() * 3);

  if (attrs.type) {
    type = attrs.type;
  }

  var speed = this.opts.speed_base + (Math.random() * this.opts.speed_flux);

  switch (type) {
    case 0:
      break;
    case 1:
      speed *= 0.25;
      break;
    case 2:
      speed *= 0.75;
      break;
  }

  return {
    type: type,
    speed: speed,
    dead: false,
    hp: hp,
    hp_max: hp,
    ttl: 0
  };
};

Actors.Rat.prototype.init = function (attrs) {
  this.pos = new Vec3(
    attrs.x,
    attrs.y,
    0
  );

  this.velo = new VecR(
    Math.PI * 2 * Math.random(),
    this.attrs.speed
  ).vec3();

  if (this.attrs.type === 1) {
    this.attrs.ttl = 200 + Math.random() * 300;
  }

  if (this.attrs.type === 2) {
    this.attrs.ttl = 100 + Math.random() * 200;
  }
};

Actors.Rat.prototype.defaults = [{
  key: 'type',
  info: '',
  value: 0,
  min: 0, // rat, mommy, baby
  max: 2
}, {
  key: 'babies_max',
  info: '',
  value: 5,
  min: 0,
  max: 10
}, {
  key: 'speed_base',
  info: '',
  value: 4,
  min: 1,
  max: 100
}, {
  key: 'speed_flux',
  info: '',
  value: 2,
  min: 0,
  max: 50
}, {
  key: 'velo_scale',
  info: '',
  value: 1,
  min: 0.1,
  max: 1,
  step: 0.1
}, {
  key: 'separation_range',
  info: '',
  value: 64,
  min: 10,
  max: 500
}, {
  key: 'cohesion_range',
  info: '',
  value: 128,
  min: 10,
  max: 500
}, {
  key: 'alignment_range',
  info: '',
  value: 240,
  min: 10,
  max: 1000
}, {
  key: 'separation_force',
  info: '',
  value: 1,
  min: 0.1,
  max: 1.0,
  step: 0.05
}, {
  key: 'cohesion_force',
  info: '',
  value: 0.2,
  min: 0.1,
  max: 1.0,
  step: 0.05
}, {
  key: 'alignment_force',
  info: '',
  value: 1,
  min: 0.1,
  max: 5.0,
  step: 0.05
}, {
  key: 'predator_range',
  info: '',
  value: 240,
  min: 10,
  max: 500
}, {
  key: 'reflect_force',
  info: '',
  value: 1,
  min: 0,
  max: 10
}, {
  key: 'predator_force',
  info: '',
  value: 6,
  min: 0,
  max: 10
}, {
  key: 'chase_force',
  info: '',
  value: 1,
  min: 0.1,
  max: 1.0
}, {
  key: 'intent_scale',
  value: 0.5,
  min: 0,
  max: 100
}, {
  key: 'show_params',
  info: '',
  value: 0,
  min: 0,
  max: 1
}];

Actors.Rat.prototype.update = function (delta, intent) {
  var vec = new Vec3();

  if (this.refs.cell.pong) {
    if (this.refs.cell.pong.pos.rangeXY(this.pos) < 64) {
      this.kill();
    }
  }

  if (this.refs.cell.snake) {
    var pos = this.refs.cell.snake.vec();
    if (pos.rangeXY(this.pos) < 64) {
      this.kill();
    }
  }

  // white rats
  if (this.attrs.type === 0) {
    vec.add(this.separation().scale(1));
    vec.add(this.chase().scale(0.1));
    vec.add(this.reflect(0.01));
  }

  // grey rats stick together
  if (this.attrs.type === 1) {
    vec.add(this.cohesion().scale(0.25));
    vec.add(this.separation().scale(1));
    vec.add(this.alignment());
    vec.add(this.avoidHuman().scale(1));
    vec.add(this.awayFromCenter().scale(1));
    vec.add(this.reflect(0.5));
  }

  // baby rats
  if (this.attrs.type === 2) {
    vec.add(this.cohesion().scale(0.25));
    vec.add(this.separation().scale(0.05));
    vec.add(this.alignment());
    vec.add(this.chase().scale(0.1));
    vec.add(this.reflect(0.01));
  }

  var intents = [[0, -1], [1, 0], [0, 1], [-1, 0]];

  // white rats chase human
  if (this.attrs.type === 0) {
    var scale = this.opts.intent_scale;
    if (this.refs.cell.refs.maze && this.refs.cell.refs.maze.attrs.escape) {
      scale *= 2;
    }

    if (typeof intent !== 'undefined' && intent !== null) {
      vec.add(new Vec3(intents[intent][0], intents[intent][1]).scale(scale));

      if (intent === 1 || intent === 3) {
        if (this.pos.y < this.refs.cell.opts.max_y * 0.4) {
          vec.add(new Vec3(0, 1).scale(scale));
        }
        if (this.pos.y > this.refs.cell.opts.max_y * 0.6) {
          vec.add(new Vec3(0, -1).scale(scale));
        }
      }

      if (intent === 0 || intent === 2) {
        if (this.pos.x < this.refs.cell.opts.max_x * 0.4) {
          vec.add(new Vec3(1, 0).scale(scale));
        }
        if (this.pos.x > this.refs.cell.opts.max_x * 0.6) {
          vec.add(new Vec3(-1, 0).scale(scale));
        }
      }
    }
  }

  vec.scale(this.opts.velo_scale);

  var speed = this.attrs.speed;
  switch (this.attrs.type) {
    case 0:
      break;
    case 1:
    // speed *= 0.5
      break;
    case 2:
      speed *= 0.75;
      break;
  }

  this.velo.add(vec);
  this.velo.limit(speed);
  this.velo.add(this.avoidSnake().scale(0.5));
  this.pos.add(this.velo);

  // exit
  var other, cell;

  if (this.pos.x < 0) {
    other = this.refs.cell.exits[3];
    if (other) {
      this.pos.x += this.refs.cell.opts.max_x;
    } else {
      this.velo = new Vec3(-this.velo.x, this.velo.y, 0);
      this.pos.x = 0;
    }
  } else if (this.pos.x > this.refs.cell.opts.max_x) {
    other = this.refs.cell.exits[1];
    if (other) {
      this.pos.x = this.pos.x - this.refs.cell.opts.max_x;
    } else {
      this.velo = new Vec3(-this.velo.x, this.velo.y, 0);
      this.pos.x = this.refs.cell.opts.max_x;
    }
  } else if (this.pos.y < 0) {
    other = this.refs.cell.exits[0];
    if (other) {
      this.pos.y += this.refs.cell.opts.max_y;
    } else {
      this.velo = new Vec3(this.velo.x, -this.velo.y, 0);
      this.pos.y = 0;
    }
  } else if (this.pos.y > this.refs.cell.opts.max_y) {
    other = this.refs.cell.exits[2];
    if (other) {
      this.pos.y = this.pos.y - this.refs.cell.opts.max_y;
    } else {
      this.velo = new Vec3(this.velo.x, -this.velo.y, 0);
      this.pos.y = this.refs.cell.opts.max_y;
    }
  }

  cell = this.refs.cell;

  if (other) {
    for (var i = 0, ii = cell.rats.length; i < ii; i++) {
      if (cell.rats[i] === this) {
        cell.rats[i] = null;
        break;
      }
    }
    this.refs.cell = other;
    other.rats.push(this);
  }

  // momma maturity
  if (this.attrs.type === 1) {
    if (this.attrs.ttl > 0) {
      this.attrs.ttl --;
    }
    if (this.attrs.ttl <= 0) {
      this.kill();
    }
  }

  // baby maturity
  if (this.attrs.type === 2) {
    if (this.attrs.ttl > 0) {
      this.attrs.ttl --;
    }
    if (this.attrs.ttl <= 0) {
      this.attrs.type = 0;
    }
  }
};

Actors.Rat.prototype.awayFromCenter = function () {
  var vec = new Vec3(this.refs.cell.opts.max_x / 2, this.refs.cell.opts.max_y / 2);
  vec.sub(vec.minus(this.pos).normalize());
  return vec.normalize();
};

Actors.Rat.prototype.reflect = function () {
  var reflect = new Vec3();

  if (!this.refs.cell.exits[0] && this.pos.y < this.refs.cell.opts.max_y * 0.1) {
    reflect.y = ((this.refs.cell.opts.max_y * 0.1) - this.pos.y) / (this.refs.cell.opts.max_y * 0.1);
  }

  if (!this.refs.cell.exits[1] && this.pos.x > this.refs.cell.opts.max_x * 0.9) {
    reflect.x = -(this.pos.x - (this.refs.cell.opts.max_x * 0.9)) / (this.refs.cell.opts.max_x * 0.1);
  }

  if (!this.refs.cell.exits[3] && this.pos.x < this.refs.cell.opts.max_x * 0.1) {
    reflect.x = ((this.refs.cell.opts.max_x * 0.1) - this.pos.x) / (this.refs.cell.opts.max_x * 0.1);
  }

  if (!this.refs.cell.exits[2] && this.pos.y > this.refs.cell.opts.max_y * 0.9) {
    reflect.y = -(this.pos.y - (this.refs.cell.opts.max_y * 0.9)) / (this.refs.cell.opts.max_y * 0.1);
  }

  return reflect;
};

Actors.Rat.prototype.chase = function () {
  var xx = 0;
  var yy = 0;
  var c = 0;

  if (this.refs.cell.humans.length === 0) {
    return new Vec3();
  }

  var human;

  for (var i = 0, ii = this.refs.cell.humans.length; i < ii; i++) {
    human = this.refs.cell.humans[i];
    if (!human) {
      continue;
    }
    xx += human.pos.x;
    yy += human.pos.y;
    c++;
  }

  var target = new Vec3(xx / c, yy / c);
  return target.minus(this.pos).normalize();
};

Actors.Rat.prototype.avoidHuman = function () {
  var xx = 0;
  var yy = 0;
  var c = 0;

  if (this.refs.cell.humans.length === 0) {
    return new Vec3();
  }

  var human;

  for (var i = 0, ii = this.refs.cell.humans.length; i < ii; i++) {
    human = this.refs.cell.humans[i];
    if (!human) {
      continue;
    }
    xx += human.pos.x;
    yy += human.pos.y;
    c++;
  }

  var target = new Vec3(xx / c, yy / c);
  return this.pos.minus(target).normalize();
};

Actors.Rat.prototype.avoidSnake = function () {
  if (!this.refs.cell.snake) {
    return new Vec3();
  }
  return this.pos.minus(this.refs.cell.snake.vec()).normalize();
};

Actors.Rat.prototype.separation = function () {
  var i, ii;
  var other;
  var range;

  var vec = new Vec3();

  for (i = 0, ii = this.refs.cell.rats.length; i < ii; i++) {
    other = this.refs.cell.rats[i];
    if (!other) {
      continue;
    }

    if (other === this) {
      continue;
    }

    range = this.pos.rangeXY(other.pos);

    if (range === 0) {
      continue;
    }

    if (range > this.opts.separation_range) {
      continue;
    }

    vec.add(this.pos.minus(other.pos).normalize().scale(1 / range));
  }

  return vec.normalize();
};

Actors.Rat.prototype.alignment = function () {
  var i, ii;
  var other;
  var range;

  var vec = new Vec3();

  for (i = 0, ii = this.refs.cell.rats.length; i < ii; i++) {
    other = this.refs.cell.rats[i];

    if (!other) {
      continue;
    }

    if (other === this) {
      continue;
    }

    range = this.pos.rangeXY(other.pos);

    if (range === 0) {
      continue;
    }

    if (range > this.opts.separation_range) {
      continue;
    }

    vec.add(other.velo);
  }

  return vec.normalize();
};

Actors.Rat.prototype.cohesion = function () {
  var i, ii;
  var other;

  var x = 0;
  var y = 0;
  var c = 0;

  for (i = 0, ii = this.refs.cell.rats.length; i < ii; i++) {
    other = this.refs.cell.rats[i];

    if (!other) {
      continue;
    }

    if (other === this) {
      continue;
    }

    x += this.pos.x;
    y += this.pos.y;
    c++;
  }

  if (!c) {
    return new Vec3();
  }

  var center = new Vec3(x / c, y / c);

  return this.pos.minus(center).normalize();
};

Actors.Rat.prototype.steer = function () {
  var i, ii;

  var dist;
  var other;
  var count = 0;
  var vec, vector;

  var alignment = new Vec3();
  var cohesion = new Vec3();
  var separation = new Vec3();

  for (i = 0, ii = this.refs.cell.rats.length; i < ii; i++) {
    other = this.refs.cell.rats[i];

    if (other === this) {
      continue;
    }

    dist = this.pos.rangeXY(other.pos);

    if (dist === 0) {
      continue;
    }

    if (dist <= this.opts.separation_range) {
      vec = other.pos.minus(this.pos);
      vec.normalize().scale(this.opts.separation_range / dist);
      separation.add(vec);
    }

    if (dist <= this.opts.cohesion_range) {
      vec = this.pos.minus(other.pos);
      vec.normalize().scale(this.opts.cohesion_range / dist);
      cohesion.add(vec);
    }

    if (dist <= this.opts.alignment_range) {
      vec = this.pos.minus(other.pos);
      alignment.add(vec);
      count++;
    }
  }

  if (count === 0) {
    return new Vec3();
  }

  separation.normalize().scale(this.opts.separation_force);
  cohesion.normalize().scale(this.opts.cohesion_force);

  alignment = this.pos.minus(alignment);
  alignment.normalize().scale(this.opts.alignment_force);

  vector = new Vec3();
  vector.add(separation);
  vector.add(cohesion);
  vector.add(alignment);
  vector.normalize();

  return vector;
};

Actors.Rat.prototype.damage = function (hp) {
  if (!hp) {
    hp = 1;
  }

  this.attrs.hp -= hp;
  this.attrs.hit = true;

  if (this.attrs.hp > 0) {
    return;
  }

  if (this.attrs.dead) {
    return;
  }

  this.kill();
};

Actors.Rat.prototype.kill = function (terminal) {
  if (this.attrs.dead) {
    return;
  }

  this.attrs.dead = true;

  if (this.attrs.type === 0) {
    this.env.score += 100;
  }
  if (this.attrs.type === 1) {
    this.env.score += 50;
  }
  if (this.attrs.type === 1) {
    this.env.score += 25;
  }

  if (this.refs.breeder) {
    for (i = 0, ii = this.refs.breeder.rats.length; i < ii; i++) {
      if (this.refs.breeder.rats[i] === this) {
        this.refs.breeder.rats[i] = null;
        break;
      }
    }
  }

  for (i = 0, ii = this.refs.cell.rats.length; i < ii; i++) {
    if (this.refs.cell.rats[i] === this) {
      this.refs.cell.rats[i] = null;
      break;
    }
  }

  this.env.play('splat');

  this.refs.cell.booms.push(new Actors.Boom(
    this.env, {
    }, {
      style: '',
      radius: 16,
      x: this.pos.x,
      y: this.pos.y,
      color: '255,0,0'
    }
  ));

  if (terminal) {
    return;
  }

  // things to do after death

  var rat;
  // gray have babies when die
  if (this.attrs.type === 1) {
    // mommy
    for (var i = 2, ii = 4 + Math.floor(Math.random() * this.opts.babies_max) + 1; i < ii; i++) {
      rat = new Actors.Rat(
        this.env, {
          // breeder: this.refs.breeder,
          cell: this.refs.cell
        }, {
          type: 2, // baby
          x: this.pos.x,
          y: this.pos.y
        });
      this.refs.cell.rats.push(rat);
    }
  }
};

Actors.Rat.prototype.paint = function (view) {
  view.ctx.save();
  view.ctx.rotate(this.velo.angleXY());

  view.ctx.fillStyle = '#fff';
  view.ctx.strokeStyle = '#fff';
  view.ctx.lineWidth = 1;

  var z = 8;

  // for tails
  var q1 = (Math.sin((Date.now() / 125) % (2 * Math.PI)));
  var q2 = (Math.sin((Date.now() / 333) % (2 * Math.PI)));

  switch (this.attrs.type) {
    case 0:
    // white rat

    // tail
      view.ctx.fillStyle = '#090';
      view.ctx.strokeStyle = '#090';
      view.ctx.save();
      view.ctx.translate(-1.5 * z, 0);
      view.ctx.beginPath();
      view.ctx.moveTo(0, 0.5 * z);
      view.ctx.quadraticCurveTo(-2 * z, z * q1, -5 * z, 0);
      view.ctx.quadraticCurveTo(-2 * z, z * q1, 0, -0.5 * z);
      view.ctx.closePath();
      view.ctx.stroke();
      view.ctx.fill();
      view.ctx.restore();

    // body
      view.ctx.fillStyle = '#0f0';
      view.ctx.lineWidth = 1;
      view.ctx.beginPath();
      view.ctx.ellipse(0, 0, z * 2.5, z * 1.2, 0, 2 * Math.PI, 0);
      view.ctx.closePath();
      view.ctx.fill();

    // head
      view.ctx.save();
      view.ctx.translate(2.2 * z, 0);
      view.ctx.rotate(q2 * 0.3);

    // whiskers
      view.ctx.strokeStyle = '#0f0';
      view.ctx.lineWidth = 0.5;

      view.ctx.beginPath();
      view.ctx.moveTo(z * 0.8, 0);
      view.ctx.lineTo(z * 0.7, -z);
      view.ctx.stroke();

      view.ctx.beginPath();
      view.ctx.moveTo(z * 0.8, 0);
      view.ctx.lineTo(z * 0.9, -z);
      view.ctx.stroke();

      view.ctx.beginPath();
      view.ctx.moveTo(z * 0.8, 0);
      view.ctx.lineTo(z * 0.7, z);
      view.ctx.stroke();

      view.ctx.beginPath();
      view.ctx.moveTo(z * 0.8, 0);
      view.ctx.lineTo(z * 0.9, z);
      view.ctx.stroke();

    // skull
      view.ctx.fillStyle = '#0f0';
      view.ctx.beginPath();
      view.ctx.ellipse(0, 0, z * 1.2, z * 0.7, 0, 2 * Math.PI, 0);
      view.ctx.closePath();
      view.ctx.fill();

    // eyes
      view.ctx.fillStyle = '#f00';
    // blink
      if (Math.random() < 0.1) {
        view.ctx.fillStyle = '#fff';
      }
      view.ctx.beginPath();
      view.ctx.ellipse(z * 0.8, -z * 0.2, z * 0.1, z * 0.05, 0, 2 * Math.PI, 0);
      view.ctx.closePath();

      view.ctx.fill();
      view.ctx.beginPath();
      view.ctx.ellipse(z * 0.8, z * 0.2, z * 0.1, z * 0.05, 0, 2 * Math.PI, 0);
      view.ctx.closePath();
      view.ctx.fill();

      view.ctx.restore();
    // end head
      break;

    case 1:
    // momma rat

    // tail
      view.ctx.fillStyle = '#090';
      view.ctx.strokeStyle = '#090';
      view.ctx.save();
      view.ctx.translate(-1.5 * z, 0);
      view.ctx.beginPath();
      view.ctx.moveTo(0, 0.5 * z);
      view.ctx.quadraticCurveTo(-2 * z, z * q1, -5 * z, 0);
      view.ctx.quadraticCurveTo(-2 * z, z * q1, 0, -0.5 * z);
      view.ctx.closePath();
      view.ctx.stroke();
      view.ctx.fill();
      view.ctx.restore();

    // body
      view.ctx.fillStyle = '#090';
      view.ctx.lineWidth = 1;
      view.ctx.beginPath();
      view.ctx.ellipse(0, 0, z * 2.4, z * 1.8, 0, 2 * Math.PI, 0);
      view.ctx.closePath();
      view.ctx.fill();

    // head
      view.ctx.save();
      view.ctx.translate(2.2 * z, 0);
      view.ctx.rotate(q2 * 0.3);

    // whiskers
      view.ctx.strokeStyle = '#090';
      view.ctx.lineWidth = 0.5;

      view.ctx.beginPath();
      view.ctx.moveTo(z * 0.8, 0);
      view.ctx.lineTo(z * 0.7, -z);
      view.ctx.stroke();

      view.ctx.beginPath();
      view.ctx.moveTo(z * 0.8, 0);
      view.ctx.lineTo(z * 0.9, -z);
      view.ctx.stroke();

      view.ctx.beginPath();
      view.ctx.moveTo(z * 0.8, 0);
      view.ctx.lineTo(z * 0.7, z);
      view.ctx.stroke();

      view.ctx.beginPath();
      view.ctx.moveTo(z * 0.8, 0);
      view.ctx.lineTo(z * 0.9, z);
      view.ctx.stroke();

    // skull
      view.ctx.fillStyle = '#090';
      view.ctx.beginPath();
      view.ctx.ellipse(0, 0, z * 1.2, z * 0.7, 0, 2 * Math.PI, 0);
      view.ctx.closePath();
      view.ctx.fill();

    // eyes
      view.ctx.fillStyle = '#f00';
    // blink
      if (Math.random() < 0.1) {
        view.ctx.fillStyle = '#000';
      }
      view.ctx.beginPath();
      view.ctx.ellipse(z * 0.8, -z * 0.2, z * 0.1, z * 0.05, 0, 2 * Math.PI, 0);
      view.ctx.closePath();

      view.ctx.fill();
      view.ctx.beginPath();
      view.ctx.ellipse(z * 0.8, z * 0.2, z * 0.1, z * 0.05, 0, 2 * Math.PI, 0);
      view.ctx.closePath();
      view.ctx.fill();

      view.ctx.restore();
    // end head
      break;

    case 2:
    // baby rat

    // tail
      view.ctx.fillStyle = '#0f0';
      view.ctx.strokeStyle = '#0f0';
      view.ctx.save();
      view.ctx.translate(-0.8 * z, 0);
      view.ctx.beginPath();
      view.ctx.moveTo(0, 0.25 * z);
      view.ctx.quadraticCurveTo(-2 * z, z * q1, -3 * z, 0);
      view.ctx.quadraticCurveTo(-2 * z, z * q1, 0, -0.25 * z);
      view.ctx.closePath();
      view.ctx.stroke();
      view.ctx.fill();
      view.ctx.restore();

    // body
      view.ctx.fillStyle = '#0f0';
      view.ctx.lineWidth = 1;
      view.ctx.beginPath();
      view.ctx.ellipse(0, 0, z * 1.1, z * 0.8, 0, 2 * Math.PI, 0);
      view.ctx.closePath();
      view.ctx.fill();

    // head
      view.ctx.save();
      view.ctx.translate(z, 0);
      view.ctx.rotate(q2 * 0.3);

    // whiskers
      view.ctx.strokeStyle = '#0f0';
      view.ctx.lineWidth = 0.5;

      view.ctx.beginPath();
      view.ctx.moveTo(z * 0.2, 0);
      view.ctx.lineTo(z * 0.1, -z);
      view.ctx.stroke();

      view.ctx.beginPath();
      view.ctx.moveTo(z * 0.2, 0);
      view.ctx.lineTo(z * 0.3, -z);
      view.ctx.stroke();

      view.ctx.beginPath();
      view.ctx.moveTo(z * 0.2, 0);
      view.ctx.lineTo(z * 0.1, z);
      view.ctx.stroke();

      view.ctx.beginPath();
      view.ctx.moveTo(z * 0.2, 0);
      view.ctx.lineTo(z * 0.3, z);
      view.ctx.stroke();

    // skull
      view.ctx.fillStyle = '#0f0';
      view.ctx.beginPath();
      view.ctx.ellipse(0, 0, z * 0.4, z * 0.4, 0, 2 * Math.PI, 0);
      view.ctx.closePath();
      view.ctx.fill();

    // eyes
      view.ctx.fillStyle = '#f00';
    // blink
      if (Math.random() < 0.1) {
        view.ctx.fillStyle = '#fff';
      }
      view.ctx.beginPath();
      view.ctx.ellipse(z * 0.2, -z * 0.1, z * 0.1, z * 0.05, 0, 2 * Math.PI, 0);
      view.ctx.closePath();

      view.ctx.fill();
      view.ctx.beginPath();
      view.ctx.ellipse(z * 0.2, z * 0.1, z * 0.1, z * 0.05, 0, 2 * Math.PI, 0);
      view.ctx.closePath();
      view.ctx.fill();

      view.ctx.restore();
      break;
    default:
    // tail
      view.ctx.fillStyle = '#ccc';
      view.ctx.beginPath();
      view.ctx.moveTo(-z - z - z - z, 0);
      view.ctx.lineTo(0, z);
      view.ctx.lineTo(0, -z);
      view.ctx.lineTo(-z - z - z - z, 0);
      view.ctx.closePath();
      view.ctx.fill();

    // body
      view.ctx.fillStyle = '#eee';
      view.ctx.lineWidth = 1;
      view.ctx.beginPath();
      view.ctx.arc(0, 0, 2 * z, 0, 2 * Math.PI);
      view.ctx.closePath();
      view.ctx.fill();

    // head
      view.ctx.fillStyle = '#fff';
      view.ctx.beginPath();
      view.ctx.arc(z * 2, 0, z, 0, 2 * Math.PI);
      view.ctx.closePath();
      view.ctx.fill();
      break;
  }

  view.ctx.restore();
};
