const { json } = require('express');

fs = require('fs');

const allNewTiles = [
    "UpRightDownLeft",
    "UpRightDownLeft",
    "UpRightDownLeft",
    "UpDown",
    "UpDown",
    "RightLeft",
    "RightLeft",
    "RightDown",
    "RightDownLeft",
    "UpDownLeft",
    "UpLeft",
    "UpRight",
    "UpRightDown"
]

const weapons = [
    {
        id: 1,
        name: "Dolch",
        damage: 3,
        critChance: 5,
        filename: "dagger.png"
    }
]

const monsters = [
    {
        name: "Zentauriman",
        filename: "centaur.png",
        hp: 20,
        damage: 1,
        critChance: 50
    }, {
        name: "Kobold",
        filename: "kobold.png",
        hp: 50,
        damage: 5,
        critChance: 50,
        stunning: true
    }
]

function randomNumber(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min); //The maximum is inclusive and the minimum is inclusive
}

class Game {
    constructor() {
        this.file = {}
        this.file.map = [{
            id: "1",
            x: 0,
            y: 0,
            special: 'start',
            type: "UpRightDownLeft",
            url: "/assets/map/UpRightDownLeft.png"
        }, {
            id: "2",
            x: 1,
            y: 0,
            type: "RightLeft",
            url: "/assets/map/RightLeft.png"
        }, {
            id: "3",
            x: 2,
            y: 0,
            type: "RightLeft",
            url: "/assets/map/RightLeft.png"
        }, {
            id: "4",
            x: 3,
            y: 0,
            type: "UpRightDownLeft",
            url: "/assets/map/UpRightDownLeft.png"
        }, {
            id: "5",
            x: 3,
            y: 1,
            type: "UpRightDown",
            url: "/assets/map/UpRightDown.png"
        }, {
            id: "6",
            x: 0,
            y: 1,
            type: "UpRightDown",
            url: "/assets/map/UpRightDown.png"
        }, {
            id: "7",
            x: 1,
            y: 1,
            type: "UpRightDownLeft",
            url: "/assets/map/UpRightDownLeft.png"
        }, {
            id: "8",
            x: 2,
            y: 1,
            type: "RightLeft",
            url: "/assets/map/RightLeft.png"
        }
        ]
        this.file.players = [];
        this.file.monsters = [];
        //this.saveFile();
        this.readFile();
        this.sockets = [];
        this.weapons = weapons;
    }

    readFile() {
        fs.readFile('db.json', 'utf8', (err, data) => {
            if (err) {
                console.log(err);
            } else {
                this.file = JSON.parse(data);
            }
        });
    }

    saveFile() {
        fs.writeFile('db.json', JSON.stringify(this.file), (err) => {
            if (err) throw err;
            console.log('Game file has been saved!');
        });
    }

    loginPlayer(login) {
        let found = false
        for (let player of this.file.players) {
            if (player.login === login) {
                console.log("player logged in");
                found = true;
                player.active = true;
                return player;
            }
        }
        if (!found) {
            console.log("new player logged in");
            const player = new Player(login, this.file.players.length + 1)
            this.file.players.push(player);
            this.saveFile();
            return player;
        }
    }

    getPlayer(id) {
        for (let player of this.file.players) {
            if (player.id === id) {
                return player;
            }
        }
        return null;
    }

    getMap() {
        return this.file.map;
    }

    getTile(x, y) {
        let map = this.getMap();
        for (let tile of map) {
            if (tile.x === x && tile.y === y) {
                return tile;
            }
        }
        return null;
    }

    movement(id, login, direction) {
        const player = this.getPlayer(id);
        if (player.login === login) {
            this.move(player, direction);
            this.updateGameClient();
        }
    }

    move(char, direction) {
        // check boundries
        if (direction == "up" && char.y - 1 < 0) {
            return;
        }
        if (direction == "left" && char.x - 1 < 0) {
            return;
        }

        // player is stunned
        if (this.getMonsterXY(char.x, char.y)?.stunning) {
            console.log(`Player ${char.id} stunned...`)
            return;
        }

        // check if we need to create a new tile
        if (this.checkTileExit(char, direction) && this.getTileInDirection(char, direction) == null) {
            this.generateNewTile(char, direction);
        }

        switch (direction) {
            case "up":
                if (this.checkWay(char, direction)) {
                    char.y--;
                }
                break;
            case "down":
                if (this.checkWay(char, direction)) {
                    char.y++;
                }
                break;
            case "left":
                if (this.checkWay(char, direction)) {
                    char.x--;
                }
                break;
            case "right":
                if (this.checkWay(char, direction)) {
                    char.x++;
                }
                break;
        }
    }

    checkWay(player, direction,) {
        let nextCordsType = null;
        let currentTile = this.getTile(player.x, player.y);
        if (direction == 'up') {
            if (currentTile.type.indexOf('Up') == -1) {
                return false;
            }
            nextCordsType = this.getTileInDirection(player, direction)?.type;
            if (nextCordsType?.indexOf('Down') >= 0) {
                return true;
            }
        }
        if (direction == 'right') {
            if (currentTile.type.indexOf('Right') == -1) {
                return false;
            }
            nextCordsType = this.getTileInDirection(player, direction)?.type;
            if (nextCordsType?.indexOf('Left') >= 0) {
                return true;
            }
        }
        if (direction == 'down') {
            if (currentTile.type.indexOf('Down') == -1) {
                return false;
            }
            nextCordsType = this.getTileInDirection(player, direction)?.type;
            if (nextCordsType?.indexOf('Up') >= 0) {
                return true;
            }
        }
        if (direction == 'left') {
            if (currentTile.type.indexOf('Left') == -1) {
                return false;
            }
            nextCordsType = this.getTileInDirection(player, direction)?.type;
            if (nextCordsType?.indexOf('Right') >= 0) {
                return true;
            }
        }
        return false;
    }

    checkTileExit(player, direction) {
        let currentTile = this.getTile(player.x, player.y);
        if (currentTile.type.toLowerCase().indexOf(direction) >= 0) {
            return true;
        }
        return false;
    }

    getTileInDirection(player, direction) {
        if (direction === 'up') {
            return this.getTile(player.x, player.y - 1);
        }
        if (direction === 'right') {
            return this.getTile(player.x + 1, player.y);
        }
        if (direction === 'down') {
            return this.getTile(player.x, player.y + 1);
        }
        if (direction === 'left') {
            return this.getTile(player.x - 1, player.y);
        }
        return null;
    }

    generateNewTile(player, direction) {
        let newType = null;
        let possibleTiles = allNewTiles;
        let x = player.x;
        let y = player.y;
        switch (direction) {
            case 'up':
                possibleTiles = allNewTiles.filter(tile => tile.indexOf("Down") >= 0);
                y--;
                break;
            case 'right':
                possibleTiles = allNewTiles.filter(tile => tile.indexOf("Left") >= 0);
                x++;
                break;
            case 'down':
                possibleTiles = allNewTiles.filter(tile => tile.indexOf("Up") >= 0);
                y++;
                break;
            case 'left':
                possibleTiles = allNewTiles.filter(tile => tile.indexOf("Right") >= 0);
                x--;
                break;
        }
        let rnd = randomNumber(0, possibleTiles.length - 1);
        newType = possibleTiles[rnd];

        if (newType) {
            let newTile = new Tile(x, y, newType, this.getMap().length + 1);
            this.file.map.push(newTile);
        }
    }

    updateGameClient() {
        this.sockets.forEach(socket => {
            socket.emit("map", JSON.stringify(this.file.map));
            socket.emit("players", JSON.stringify(this.file.players));
            socket.emit("monsters", JSON.stringify(this.file.monsters));
        })
    }

    updateFight(playerId, fightReport) {
        for (let socket of this.sockets) {
            if (socket.player === playerId) {
                socket.emit("fight", JSON.stringify(fightReport));
            }
        }
    }

    gameLoop() {
        let spawnRnd = randomNumber(1, 10);
        if (spawnRnd == 1) {
            this.spawnRandomMonster();
        }

        for (let monster of this.file.monsters) {
            let moveRnd = randomNumber(1, 100);
            if (moveRnd <= 30) {
                let directions = []
                if (this.checkWay(monster, "up")) {
                    directions.push("up")
                }
                if (this.checkWay(monster, "right")) {
                    directions.push("right")
                }
                if (this.checkWay(monster, "down")) {
                    directions.push("down")
                } 
                if (this.checkWay(monster, "left")) {
                    directions.push("left")
                }
                let directRnd = randomNumber(0, directions.length - 1)
                let direction = directions[directRnd]
                if (direction == "up") {
                    monster.y--;
                    logEnemyInfos(monster)
                }
                if (direction == "right") {
                    monster.x++;
                    logEnemyInfos(monster)
                } 
                if (direction == "down") {
                    monster.y++;
                    logEnemyInfos(monster)
                }
                if (direction == "left") {
                    monster.x--;
                    logEnemyInfos(monster)
                }
            }
        }

        // TODO: clculate damage
        for (let player of this.file.players) {
            let monster = this.getMonsterXY(player.x, player.y);
            let fightReport = {}
            if (monster) {
                // player
                fightReport.playerImg = player.url

                // fight
                console.log("player " + player.id + " vs monster " + monster.id)
                fightReport.weapon = player.weapon

                // damage
                const playerDamage = getPlayerDamage(player);
                fightReport.playerDamage = playerDamage
                console.log("player damage: " + playerDamage);

                monster.health -= getPlayerDamage(player);

                // frontend infos
                fightReport.monsterHealth = monster.health
                fightReport.monsterName = monster.name
                fightReport.monsterImg = monster.url

                console.log("monster hp: " + monster.health);
                if (monster.health > 0) {
                    const monsterDamage = getDamage(monster);
                    fightReport.monsterDamage = monsterDamage
                    console.log("monster damage: " + monsterDamage);
                    player.health -= getDamage(monster);
                    console.log("player hp: " + player.health);
                } else {
                    console.log("monster dead!")
                    this.file.monsters = this.file.monsters.filter(listMonster => listMonster.id !== monster.id);
                }

                // send fight report to player
                this.updateFight(player.id, fightReport)
            }
        }

        this.updateGameClient();
        setTimeout(() => {
            this.gameLoop()
        }, 1000)
    }

    getMonsterXY(x, y) {
        for (let monster of this.file.monsters) {
            if (monster.x == x && monster.y == y) {
                return monster;
            }
        }
    }

    spawnRandomMonster() {
        const rnd = randomNumber(0, monsters.length - 1);
        const monsterTemplate = monsters[rnd]
        const newEnemy = new Enemy(
            this.file.monsters.length,
            monsterTemplate.name,
            monsterTemplate.filename,
            monsterTemplate.hp,
            monsterTemplate.damage,
            monsterTemplate.critChance,
            monsterTemplate.stunning
        )
        this.file.monsters.push(newEnemy);
    }
}

function getPlayerDamage(player) {
    const weapon = weapons.find(weapon => weapon.id == player.weapon);
    if (weapon) {
        const rnd = randomNumber(1, 100);
        if (weapon.critChance <= rnd) {
            return weapon.damage;
        } else {
            return weapon.damage * 2;
        }
    }
}

function logEnemyInfos(enemy) {
    console.log(`Enemy(${enemy.id}): ${enemy.name}, x = ${enemy.x}, y = ${enemy.y}`);
}

function getDamage(enemy) {
    const rnd = randomNumber(1, 10);
    if (enemy.critChance <= rnd) {
        return enemy.damage * 2;
    } else {
        return enemy.damage;
    }
}

class Player {
    constructor(login, id) {
        console.log("new player created")
        this.login = login;
        this.id = id;
        this.health = 100;
        this.weapon = 1;
        this.x = 0;
        this.y = 0;
        this.type = "player";
        this.url = "/assets/player/halfling.png";
        this.active = true;
    }
}

class Enemy {
    constructor(id, name, filename, health, damage, critChance, stunning, x, y) {
        console.log("new enemy created")
        this.id = id;
        this.name = name;
        this.health = health || 20;
        this.damage = damage || 1;
        this.critChance = critChance || 1;
        this.stunning = stunning || false;
        this.x = x || 0;
        this.y = y || 0;
        this.type = "enemy";
        this.url = "/assets/monster/" + filename;
    }
}

class Tile {
    constructor(x, y, type, id) {
        this.id = id
        this.x = x;
        this.y = y;
        this.type = type;
        this.url = this.getTile(type);
    }

    getTile(filename) {
        if (filename == "start") {
            return "/assets/map/UpRightDownLeft.png";
        } else {
            return `/assets/map/${filename}.png`;
        }
    }
}

module.exports = {
    game: Game,
    player: Player,
    tile: Tile
}