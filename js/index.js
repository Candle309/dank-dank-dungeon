"use strict";

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Player = function () {
  function Player(x, y, game) {
    var _this = this;

    _classCallCheck(this, Player);

    this.x = x;
    this.y = y;
    this.game = game;
    this.playerColor = "#FCFFF5";
    this.char = "@";
    this.distanceColors = { 0: { fg: "#FCFFF5", bg: "#3E606F" }, 1: { fg: "#FCFFF5", bg: "#3E606F" },
      2: { fg: "#D7E0D9", bg: "#3A5C6B" }, 3: { fg: "#D7E0D9", bg: "#3A5C6B" },
      4: { fg: "#D7E0D9", bg: "#365867" }, 5: { fg: "#D7E0D9", bg: "#365867" },
      6: { fg: "#8FA3A3", bg: "#325463" }, 7: { fg: "#8FA3A3", bg: "#325463" },
      8: { fg: "#6B8588", bg: "#2E505F" }, 9: { fg: "#6B8588", bg: "#2E505F" },
      10: { fg: "#59767B", bg: "#2D4E5E" } };
    this.visRadius = 10;
    this.fov = new ROT.FOV.PreciseShadowcasting(function (x, y) {
      // Check map for walls, light can't pass through walls
      var tile = x + "," + y;
      return _this.game.map[tile] === 0;
    });
    this.monsterCoords = this.game.monsters.map(function (monster) {
      return monster.coords;
    });
    this.potionCoords = this.game.potions.map(function (potion) {
      return potion.coords;
    });
    this.scrollCoords = this.game.scrolls.map(function (scroll) {
      return scroll.coords;
    });
    this.stairCoord = this.game.state.floor < 5 ? this.game.stairs.coords : null;
    this.draw();
  }

  Player.prototype.draw = function draw() {
    var _this2 = this;

    if (this.game.state.isDead || this.game.state.hasWon) return;
    this.game.display.clear();
    this.fov.compute(this.x, this.y, this.visRadius, function (x, y, r, visibility) {
      var currentCoord = x + "," + y;
      var monsterCheck = _this2.monsterCoords.indexOf(currentCoord);
      var potionCheck = _this2.potionCoords.indexOf(currentCoord);
      var scrollCheck = _this2.scrollCoords.indexOf(currentCoord);
      var stairCheck = undefined;
      if (_this2.game.state.floor === 5) stairCheck = -1;else stairCheck = currentCoord === _this2.stairCoord ? 0 : -1;

      var ch = "",
          chColor = "";
      var chBG = _this2.distanceColors[r]["bg"];
      if (_this2.game.map[currentCoord] === 1) {
        ch = "#";
        chColor = _this2.distanceColors[r]["fg"];
      } else {
        if (stairCheck > -1) {
          ch = _this2.game.stairs.char;
          chColor = _this2.game.stairs.color;
        } else if (monsterCheck > -1) {
          ch = _this2.game.monsters[monsterCheck].char;
          chColor = _this2.game.monsters[monsterCheck].color;
        } else if (potionCheck > -1) {
          ch = _this2.game.potions[potionCheck].char;
          chColor = _this2.game.potions[potionCheck].color;
        } else if (scrollCheck > -1) {
          ch = _this2.game.scrolls[scrollCheck].char;
          chColor = _this2.game.scrolls[scrollCheck].color;
        } else {
          ch = ".";
          chColor = _this2.distanceColors[r]["fg"];
        }
      }

      _this2.game.display.draw(x, y, ch, chColor, chBG);
    });

    this.game.display.draw(this.x, this.y, this.char, this.playerColor, this.game.bgColor);
  };

  Player.prototype.act = function act() {
    this.updateMapCoords();
    this.game.engine.lock();
    window.addEventListener("keydown", this);
  };

  Player.prototype.handleEvent = function handleEvent(e) {
    // keydown event handler
    this.handleMovement(e);
    // DEBUG: Uncomment to draw whole map instead of just FOV
    //this.game.drawMap();
    window.removeEventListener("keydown", this);
    this.game.engine.unlock();
    this.draw();
  };

  Player.prototype.handleSwipe = function handleSwipe(e) {
    var vector = undefined;
    var overallVelocity = e.overallVelocity;
    var angle = e.angle;

    if (Math.abs(overallVelocity) > .75) {
      var keyEvent = new Event("keydown", { bubbles: true });
      // up
      if (angle > -100 && angle < -80) {
        keyEvent.keyCode = 38;
        document.body.dispatchEvent(keyEvent);
      }
      // right
      if (angle > -10 && angle < 10) {
        keyEvent.keyCode = 39;
        document.body.dispatchEvent(keyEvent);
      }
      // down
      if (angle > 80 && angle < 100) {
        keyEvent.keyCode = 40;
        document.body.dispatchEvent(keyEvent);
      }
      // left
      if (Math.abs(angle) > 170) {
        keyEvent.keyCode = 37;
        document.body.dispatchEvent(keyEvent);
      }
    }
    if (vector) {
      e.preventDefault();
    }
  };

  Player.prototype.handleMovement = function handleMovement(e) {
    // Orthagonal movement with Arrow keys, WASD, or HJKL
    var keyMap = {};
    keyMap[ROT.VK_K] = 0;
    keyMap[ROT.VK_UP] = 0;
    keyMap[ROT.VK_W] = 0;
    keyMap[ROT.VK_L] = 1;
    keyMap[ROT.VK_RIGHT] = 1;
    keyMap[ROT.VK_D] = 1;
    keyMap[ROT.VK_J] = 2;
    keyMap[ROT.VK_DOWN] = 2;
    keyMap[ROT.VK_S] = 2;
    keyMap[ROT.VK_H] = 3;
    keyMap[ROT.VK_LEFT] = 3;
    keyMap[ROT.VK_A] = 3;

    var code = e.keyCode;
    if (!(code in keyMap)) return;

    var diff = ROT.DIRS[4][keyMap[code]],
        newX = this.x + diff[0],
        newY = this.y + diff[1],
        newKey = newX + "," + newY;
    if (this.game.map[newKey] === 1) return;

    if (this.monsterCoords.indexOf(newKey) > -1) {
      this.combatRound(newKey);
      return;
    }

    if (this.potionCoords.indexOf(newKey) > -1) {
      this.getPotion(newKey);
    }

    if (this.scrollCoords.indexOf(newKey) > -1) {
      this.getScroll(newKey);
    }

    this.x = newX;
    this.y = newY;

    if (this.stairCoord === newKey) {
      this.game.changeFloors();
    }
  };

  Player.prototype.updateMapCoords = function updateMapCoords() {
    this.monsterCoords = this.game.monsters.map(function (monster) {
      return monster.coords;
    });
    this.potionCoords = this.game.potions.map(function (potion) {
      return potion.coords;
    });
    this.scrollCoords = this.game.scrolls.map(function (scroll) {
      return scroll.coords;
    });
    this.stairCoord = this.game.state.floor < 5 ? this.game.stairs.coords : null;
  };

  Player.prototype.combatRound = function combatRound(tile) {
    var monster = this.game.monsters[this.monsterCoords.indexOf(tile)],
        isBoss = monster.type === "demogorgon",
        doesMonsterMiss = ROT.RNG.getPercentage() > 80,
        doesPlayerMiss = ROT.RNG.getPercentage() > 90,

    // Monster attack + 1d4
    damageToPlayer = monster.attack + ROT.RNG.getUniformInt(1, 4),

    // Player attack + 1d12
    damageToMonster = this.game.state.playerAttackPower + ROT.RNG.getUniformInt(1, 12),
        newPlayerHealth = this.game.state.playerHealth - damageToPlayer,
        newMonsterHealth = monster.health - damageToMonster;

    // Player attack
    if (!doesPlayerMiss) {
      monster.health = newMonsterHealth;
      if (isBoss && monster.health <= 0) {
        this.monsterCoords.splice(this.monsterCoords.indexOf(tile), 1);
        this.game.monsters.splice(this.monsterCoords.indexOf(tile), 1);
        this.updateMapCoords();
        this.win();
        return;
      } else if (monster.health <= 0) {
        var monsterToRemove = this.monsterCoords.indexOf(tile),
            newEXP = this.game.state.playerEXP + monster.exp;
        this.monsterCoords.splice(monsterToRemove, 1);
        this.game.monsters.splice(monsterToRemove, 1);
        this.game.setState({ playerEXP: newEXP });
        this.updateMapCoords();
      }
    }

    // Monster attack
    if (!doesMonsterMiss) {
      if (newPlayerHealth <= 0) {
        this.death();
        this.game.setState({ playerHealth: 0 });
      } else this.game.setState({ playerHealth: newPlayerHealth });
    }

    // Check for level up
    if (this.game.state.playerEXP >= 100) {
      var remainder = this.game.state.playerEXP - 100;
      this.levelUp();
      this.game.setState({ playerEXP: remainder });
    }
  };

  Player.prototype.getPotion = function getPotion(tile) {
    var potion = this.game.potions[this.potionCoords.indexOf(tile)],
        potionToRemove = this.potionCoords.indexOf(tile);
    var newHealth = this.game.state.playerHealth + potion.amountToRestore;
    if (newHealth > 150) newHealth = 150;

    this.potionCoords.splice(potionToRemove, 1);
    this.game.potions.splice(potionToRemove, 1);
    this.game.setState({ playerHealth: newHealth });
    this.updateMapCoords();
  };

  Player.prototype.getScroll = function getScroll(tile) {
    var scroll = this.game.scrolls[this.scrollCoords.indexOf(tile)],
        newAttack = this.game.state.playerAttackPower + scroll.attackBoost,
        scrollToRemove = this.scrollCoords.indexOf(tile);

    this.scrollCoords.splice(scrollToRemove, 1);
    this.game.scrolls.splice(scrollToRemove, 1);
    this.game.setState({ playerAttackPower: newAttack });
    this.updateMapCoords();
  };

  Player.prototype.levelUp = function levelUp() {
    var newLevel = this.game.state.playerLevel + 1,
        newAttackPwr = this.game.state.playerAttackPower + 5,
        newHealth = this.game.state.playerHealth + 30;
    this.game.setState({ playerLevel: newLevel,
      playerAttackPower: newAttackPwr,
      playerHealth: newHealth });
  };

  Player.prototype.win = function win() {
    this.game.setState({ hasWon: true });
    this.game.engine.lock();
    this.game.display.clear();
    this.game.display.drawText(this.game.width / 2 - 12, this.game.height / 2 - 1, "You've slain the Demogorgon. Thanks to you, the world is safe once again.", 28);
  };

  Player.prototype.death = function death() {
    this.game.setState({ isDead: true });
    this.game.engine.lock();
    this.game.display.clear();
    this.game.display.drawText(this.game.width / 2 - 9, this.game.height / 2 - 1, "You Died. Game Over.");
  };

  return Player;
}();

var Monster = function () {
  function Monster(x, y, game) {
    _classCallCheck(this, Monster);

    this.x = x;
    this.y = y;
    this.type = this.getMonsterType();
    this.char = null;
    this.color = null;
    this.health = null;
    this.attack = null;
    this.exp = null;
    this.coords = this.x + "," + this.y;
    this.game = game;
    this.getMonsterStats();
  }

  Monster.prototype.getMonsterType = function getMonsterType() {
    // Generate monster
    var types = {
      "grid bug": 8 + ROT.RNG.getUniformInt(0, 3),
      "slime": 5 + ROT.RNG.getUniformInt(0, 4),
      "owlbear": 3 + ROT.RNG.getUniformInt(0, 3),
      "troll": 1 + ROT.RNG.getUniformInt(0, 2)
    };
    return ROT.RNG.getWeightedValue(types);
  };

  Monster.prototype.getMonsterStats = function getMonsterStats() {
    // Monsters get more health, attack, and exp per floor
    var healthModifier = this.game.state.floor * 5,
        attackModifier = this.game.state.floor * 3,
        expModifier = this.game.state.floor * 2;
    switch (this.type) {
      default:
      case "grid bug":
        this.char = "b";
        this.color = "#ce9252";
        this.health = 7 + healthModifier;
        this.attack = 10 + attackModifier;
        this.exp = 10 + expModifier;
        break;
      case "slime":
        this.char = "s";
        this.color = "#82c689";
        this.health = 18 + healthModifier;
        this.attack = 10 + attackModifier;
        this.exp = 20 + expModifier;
        break;
      case "owlbear":
        this.char = "O";
        this.color = "#ab8cb0";
        this.health = 32 + healthModifier;
        this.attack = 24 + attackModifier;
        this.exp = 50 + expModifier;
        break;
      case "troll":
        this.char = "T";
        this.color = "#7cc4e8";
        this.health = 38 + healthModifier;
        this.attack = 27 + attackModifier;
        this.exp = 80 + expModifier;
        break;
    }
  };

  return Monster;
}();

var Boss =
// Oh snap it's the Demogorgon from NetHack but way less scary
// https://nethackwiki.com/wiki/Demogorgon
function Boss(x, y, game) {
  _classCallCheck(this, Boss);

  this.x = x;
  this.y = y;
  this.coords = this.x + "," + this.y;
  this.game = game;
  this.type = 'demogorgon';
  this.char = "&";
  this.color = "#ff4e4e";
  this.health = 250 + ROT.RNG.getUniformInt(0, 25);
  this.attack = 30 + ROT.RNG.getUniformInt(0, 5);
};

var Potion = function Potion(x, y, game) {
  _classCallCheck(this, Potion);

  this.x = x;
  this.y = y;
  this.char = "!";
  this.color = "#ce9252";
  this.amountToRestore = 13 + ROT.RNG.getUniformInt(10, 18);
  this.coords = this.x + "," + this.y;
  this.game = game;
};

var Scroll = function Scroll(x, y, game) {
  _classCallCheck(this, Scroll);

  this.x = x;
  this.y = y;
  this.game = game;
  this.char = "?";
  this.color = "#dfe375";
  this.coords = this.x + "," + this.y;
  this.attackBoost = this.game.state.floor * 4 + ROT.RNG.getUniformInt(1, 12);
};

var Stairs = function Stairs(x, y, level, game) {
  _classCallCheck(this, Stairs);

  this.x = x;
  this.y = y;
  this.coords = this.x + "," + this.y;
  this.char = "^";
  this.color = "#BBC4A9";
  this.game = game;
};

var Game = function (_React$Component) {
  _inherits(Game, _React$Component);

  function Game(props) {
    _classCallCheck(this, Game);

    var _this3 = _possibleConstructorReturn(this, _React$Component.call(this, props));

    _this3.width = _this3.props.width;
    _this3.height = _this3.props.height;
    _this3.scheduler = new ROT.Scheduler.Simple();
    _this3.bgColor = "#3E606F";
    _this3.display = null;
    _this3.engine = null;
    _this3.player = null;
    _this3.stairs = null;
    _this3.map = {};
    _this3.monsters = [];
    _this3.potions = [];
    _this3.scrolls = [];
    _this3.state = {
      playerLevel: 1,
      playerEXP: 0,
      floor: 1,
      playerHealth: 100,
      playerAttackPower: ROT.RNG.getUniformInt(3, 7),
      hasWon: false,
      isDead: false
    };
    return _this3;
  }

  /*drawMap() {
    // for debug purposes, draws whole map
    // typically the map is drawn by player fov
    for (let i = 0; i < this.width; i++) {
      for (let j = 0; j < this.height; j++) {
        const tile = i + "," + j,
              tileUp = (i-1) + "," + j,
              tileDown = (i+1) + "," + j,
              tileLeft = i + "," + (j-1),
              tileRight = i + "," + (j+1);
              
        if (!this.map[tile]) {
          this.display.draw(i, j, ".", this.colors.wallFG, this.colors.wallBG);
        } 
        else if (!this.map[tileUp] || !this.map[tileDown] ||
                 !this.map[tileLeft] || !this.map[tileRight]) {
          this.display.draw(i, j, "#", this.colors.wallFG, this.colors.wallBG);
        } 
        else {
          this.display.draw(i, j, " ", this.colors.wallBG);
        }
      }
    }
  }*/

  Game.prototype.createEntity = function createEntity(Entity, freeCells) {
    var index = Math.floor(ROT.RNG.getUniform() * freeCells.length),
        key = freeCells.splice(index, 1)[0],
        parts = key.split(","),
        x = parseInt(parts[0]),
        y = parseInt(parts[1]);
    return new Entity(x, y, this);
  };

  Game.prototype.changeFloors = function changeFloors() {
    var newFloor = this.state.floor + 1;
    this.setState({ floor: newFloor });
    this.generateMap();
  };

  Game.prototype.generateMonsters = function generateMonsters(freeCells) {
    var amountToGenerate = 2 * this.state.floor + ROT.RNG.getUniformInt(1, 3);
    for (var i = 0; i < amountToGenerate; i++) {
      this.monsters.push(this.createEntity(Monster, freeCells));
    }
  };

  Game.prototype.generateBoss = function generateBoss(freeCells) {
    this.monsters.push(this.createEntity(Boss, freeCells));
  };

  Game.prototype.generateItems = function generateItems(freeCells) {
    // Generates Potions and Scrolls
    var scrollsToGenerate = ROT.RNG.getUniformInt(0, 2),
        potionsToGenerate = ROT.RNG.getUniformInt(2, 5);
    for (var i = 0; i < scrollsToGenerate; i++) {
      this.scrolls.push(this.createEntity(Scroll, freeCells));
    }
    for (var j = 0; j < potionsToGenerate; j++) {
      this.potions.push(this.createEntity(Potion, freeCells));
    }
  };

  Game.prototype.generateStairs = function generateStairs(freeCells) {
    var index = Math.floor(ROT.RNG.getUniform() * freeCells.length),
        key = freeCells.splice(index, 1)[0],
        parts = key.split(","),
        x = parseInt(parts[0]),
        y = parseInt(parts[1]);
    this.stairs = new Stairs(x, y, this.state.floor, this);
  };

  Game.prototype.generateMap = function generateMap() {
    var _this4 = this;

    if (this.map !== {}) this.map = {};
    var newMap = new ROT.Map.Rogue(this.width, this.height);
    var freeCells = [];
    newMap.create(function (x, y, isWall) {
      var key = x + "," + y;
      if (!isWall) freeCells.push(key);
      _this4.map[key] = isWall;
    });

    // Populate Map
    if (this.state.floor < 5) {
      this.generateStairs(freeCells);
    }
    this.generateMonsters(freeCells);
    this.generateItems(freeCells);
    if (this.state.floor === 5) {
      this.generateBoss(freeCells);
    }

    // Place player
    if (this.player === null) {
      this.player = this.createEntity(Player, freeCells);
    } else {
      var index = Math.floor(ROT.RNG.getUniform() * freeCells.length),
          key = freeCells.splice(index, 1)[0],
          parts = key.split(","),
          newX = parseInt(parts[0]),
          newY = parseInt(parts[1]);
      this.player.x = newX;
      this.player.y = newY;
    }
  };

  Game.prototype.componentWillMount = function componentWillMount() {
    this.display = new ROT.Display({
      width: this.props.width,
      height: this.props.height,
      bg: "#214557",
      fontFamily: "Inconsolata",
      fontSize: 18
    });

    document.body.appendChild(this.display.getContainer());
    this.generateMap();

    this.scheduler = new ROT.Scheduler.Simple();
    this.scheduler.add(this.player, true);

    this.engine = new ROT.Engine(this.scheduler);
    this.engine.start();
  };

  Game.prototype.componentDidMount = function componentDidMount() {
    var hammertime = new Hammer(document.querySelector("canvas"));
    hammertime.get("swipe").set({ direction: Hammer.DIRECTION_ALL });
    hammertime.on("swipe", this.player.handleSwipe);
  };

  Game.prototype.render = function render() {
    return React.createElement(GUI, { playerLevel: this.state.playerLevel,
      playerEXP: this.state.playerEXP,
      playerAttackPower: this.state.playerAttackPower,
      playerHealth: this.state.playerHealth,
      floor: this.state.floor, hasWon: this.state.hasWon,
      isDead: this.state.isDead });
  };

  return Game;
}(React.Component);

var GUI = function GUI(props) {
  return React.createElement(
    "div",
    null,
    React.createElement(
      "div",
      { className: "guiText" },
      React.createElement(
        "div",
        null,
        "Player Level: ",
        props.playerLevel
      ),
      React.createElement(
        "div",
        null,
        "EXP: ",
        props.playerEXP
      ),
      React.createElement(
        "div",
        null,
        "Attack Power: ",
        props.playerAttackPower
      ),
      React.createElement(
        "div",
        null,
        "Health: ",
        props.playerHealth
      ),
      React.createElement(
        "div",
        null,
        "Floor: ",
        props.floor
      )
    ),
    React.createElement(
      "h1",
      null,
      props.hasWon ? "You Win!" : ""
    ),
    React.createElement(
      "h1",
      null,
      props.isDead ? "You Lose!" : ""
    )
  );
};

var width = window.innerWidth,
    height = window.innerHeight,
    gameWidth = Math.floor(width / 10),
    gameHeight = Math.floor(height / 25);

ReactDOM.render(React.createElement(Game, { width: gameWidth, height: gameHeight }), document.getElementById('app'));