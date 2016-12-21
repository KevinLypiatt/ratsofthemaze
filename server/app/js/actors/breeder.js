/* global Actors, Actor, Vec3 */

Actors.Breeder = function (env, refs, attrs) {
  this.env = env;
  this.refs = refs;
  this.opts = this.genOpts();
  this.attrs = this.genAttrs(attrs);
  this.init(attrs);
};

Actors.Breeder.prototype = Object.create(Actor.prototype);

Actors.Breeder.prototype.title = 'Breeder';

Actors.Breeder.prototype.genAttrs = function (attrs) {
  var rats_max = 12 + (this.env.level * 8);
  if (rats_max > 64) {
    rats_max = 64;
  }
  return {
    rats_max: rats_max,
    x: attrs.x,
    y: attrs.y,
    hp: attrs.hp || 100,
    spawn: 0,
    dead: false
  };
};

Actors.Breeder.prototype.init = function (attrs) {
  this.rats = [];
  this.pos = new Vec3(attrs.x, attrs.y);
};

Actors.Breeder.prototype.defaults = [{
  key: 'max_x',
  info: 'Max X',
  value: 96,
  min: 100,
  max: 1600
}, {
  key: 'max_y',
  info: 'Max Y',
  value: 96,
  min: 100,
  max: 1000
}, {
  key: 'rats_max',
  value: 12,
  min: 0,
  max: 255
}, {
  key: 'rats_per_tick',
  value: 1,
  min: 0,
  max: 8
}];

Actors.Breeder.prototype.damage = function (hp) {
  this.env.play('kill');

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

Actors.Breeder.prototype.kill = function () {
  if (this.attrs.dead) {
    return;
  }

  this.attrs.dead = true;

  this.env.score += 1000;

  var i, ii;

  for (i = 0, ii = this.refs.cell.breeders.length; i < ii; i++) {
    if (this.refs.cell.breeders[i] === this) {
      this.refs.cell.breeders.splice(i, 1);
      break;
    }
  }

  if (this.refs.cell && this.refs.cell.refs.maze) {
    if (!this.refs.cell.refs.maze.attrs.boom) {
      this.env.play('baiter');
    }
  }

  this.refs.cell.booms.push(new Actors.Boom(
    this.env, {
    }, {
      style: '',
      radius: 128,
      x: this.pos.x,
      y: this.pos.y,
      color: '255,255,255'
    }
  ));
};

Actors.Breeder.prototype.addRat = function () {
  var rat;
  rat = new Actors.Rat(
    this.env, {
      breeder: this,
      cell: this.refs.cell
    }, {
      x: this.pos.x,
      y: this.pos.y
    });

  this.refs.cell.rats.push(rat);
  this.rats.push(rat);
};

Actors.Breeder.prototype.update = function (delta) {
  var i, ii;

  this.attrs.spawn --;
  if (this.attrs.spawn < 0) {
    this.attrs.spawn = 0;
  }

  if (this.rats.length < this.attrs.rats_max) {
    if (this.refs.cell.refs.maze) {
      if (!this.refs.cell.refs.maze.attrs.escape) {
        this.attrs.spawn = 5;
        this.addRat();
      }
    } else {
      this.attrs.spawn = 5;
      this.addRat();
    }
  }

  for (i = 0, ii = this.rats.length; i < ii; i++) {
    if (!this.rats[i] || this.rats[i].attrs.dead) {
      this.rats.splice(i, 1);
      i--;
      ii--;
    }
  }
};

Actors.Breeder.prototype.paint = function (view) {
  view.ctx.fillStyle = 'rgba(0, 0, 255, 1)';
  view.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';

  if (this.refs.cell.refs.maze && this.refs.cell.refs.maze.attrs.escape) {
    view.ctx.fillStyle = 'rgba(255, 0, 0, 0.25)';
    view.ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
  }

  var ww;

  ww = this.opts.max_x;
  view.ctx.save();
  view.ctx.translate(this.opts.max_x / 2, this.opts.max_y / 2);
  view.ctx.beginPath();
  view.ctx.moveTo(-ww, 0);
  view.ctx.lineTo(-ww * 0.5, -ww * 0.8);
  view.ctx.lineTo(ww * 0.5, -ww * 0.8);
  view.ctx.lineTo(ww, 0);
  view.ctx.lineTo(ww * 0.5, ww * 0.8);
  view.ctx.lineTo(-ww * 0.5, ww * 0.8);
  view.ctx.lineTo(-ww, 0);
  view.ctx.closePath();

  if (this.attrs.hit) {
    this.attrs.hit = false;
    view.ctx.fillStyle = 'rgba(255, 255, 0, 1)';
    view.ctx.fill();
  } else if (this.env.ms % 20 < 10) {
    view.ctx.fill();
  }

  view.ctx.lineWidth = 8;
  view.ctx.stroke();

  ww = this.opts.max_x * 0.3;

  view.ctx.beginPath();
  view.ctx.moveTo(-ww, 0);
  view.ctx.lineTo(-ww * 0.5, -ww * 0.8);
  view.ctx.lineTo(ww * 0.5, -ww * 0.8);
  view.ctx.lineTo(ww, 0);
  view.ctx.lineTo(ww * 0.5, ww * 0.8);
  view.ctx.lineTo(-ww * 0.5, ww * 0.8);
  view.ctx.lineTo(-ww, 0);
  view.ctx.closePath();

  view.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  if (this.attrs.spawn > 0) {
    view.ctx.fillStyle = '#fff';
  }
  view.ctx.fill();
  view.ctx.lineWidth = 4;
  view.ctx.stroke();

  view.ctx.restore();
};
