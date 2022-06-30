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

class Game {
    constructor(socket) {
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
    }

    readFile() {
        fs.readFile('db.json', 'utf8', (err,data) => {
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
            this.updateGame();
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

        // check if we need to create a new tile
        if (!this.checkWay(char, direction) && this.getTileInDirection(char, direction) == null) {
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

    checkWay(player, direction) {
        let nextCordsType = null;
        if (direction == 'up') {
            nextCordsType = this.getTileInDirection(player, direction)?.type;
            if (nextCordsType?.indexOf('Down') >= 0) {
                return true;
            }
        }
        if (direction == 'right') {
            nextCordsType = this.getTileInDirection(player, direction)?.type;
            if (nextCordsType?.indexOf('Left') >= 0) {
                return true;
            }
        }
        if (direction == 'down') {
            nextCordsType = this.getTileInDirection(player, direction)?.type;
            if (nextCordsType?.indexOf('Up') >= 0) {
                return true;
            }
        }
        if (direction == 'left') {
            nextCordsType = this.getTileInDirection(player, direction)?.type;
            if (nextCordsType?.indexOf('Right') >= 0) {
                return true;
            }
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
        let rnd =  this.randomNumber(0, possibleTiles.length - 1);
        newType = possibleTiles[rnd];

        if (newType) {
            let newTile = new Tile(x, y, newType, this.getMap().length + 1);
            this.file.map.push(newTile);
        }
    }

    updateGame() {
        this.sockets.forEach(socket => {
            socket.emit("map", JSON.stringify(this.file.map));
            socket.emit("players", JSON.stringify(this.file.players));
        })
    }

    gameLoop() {
        // TODO: enemy spawn
        // TODO: enemy movement
    }

    randomNumber(min, max) {
        return Math.floor(Math.random() * max) + min;
    }
}

class Player {
    constructor(login, id) {
        this.login = login;
        this.id = id;
        this.x = 0;
        this.y = 0;
        this.type = "player";
        this.url = "/assets/player/halfling.png";
        this.active = true;
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