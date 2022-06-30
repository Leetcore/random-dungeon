const socket = io();
class Client {
    constructor() {
        this.map = [];
        this.player = null;
        this.players = [];
        this.monsters = [];
        this.render = new Render();
    }

    getLogin() {
        const login = localStorage.getItem("login");
        if (login) {
            console.log("login: " + login);
            return login;
        } else {
            const new_login = Math.random().toString();
            localStorage.setItem("login", new_login);
            console.log("login: " + new_login);
            return new_login;
        }
    }

    setData(data, type) {
        if (type === "map") {
            this.map = JSON.parse(data);
        } else if (type === "player") {
            const player = JSON.parse(data);
            this.player = player;
        } else if (type === "players") {
            this.players = JSON.parse(data);
        } else if (type === "monsters") {
            this.monsters = JSON.parse(data);
        }
    }

    renderType(type) {
        if (type === "map") {
            this.render.renderMap(this.map);
        } else if (type === "players") {
            this.render.renderPlayers(this.players);
        } else if (type === "monsters") {
            this.render.renderMonsters(this.monsters);
        }
    }

    move(direction) {
        socket.emit("movement", {
            id: this.player.id,
            login: this.player.login,
            direction: direction
        });
    }
}

class Render {
    constructor() {
        this.globalScale = 96;
    }
    // render all tiles, players or monsters
    renderMap(map) {
        for (let tile of map) {
            this.renderTile(tile);
        }
    }
    renderPlayers(players) {
        for (let player of players) {
            this.renderPlayer(player);
        }
    }
    renderMonsters(monsters) {
    }

    // render single tile, player or monster
    renderTile(tile) {
        document.querySelector("#map")
            .insertAdjacentHTML("beforeend",
                `<div
                class="tile" id="tile_${tile.id}"
                cordsX="${tile.x}" cordsY="${tile.y}"
                style="background-image: url(${tile.url});
                left: ${(tile.x * this.globalScale)}px;
                top: ${(tile.y * this.globalScale)}px">
            </div>`);
    }
    renderPlayer(player) {
        document.querySelector("#map")
            .insertAdjacentHTML("beforeend",
                `<div class="player"
            id="player_${player.id}"
            style="background-image: url(${player.url});
            left: ${(player.x * this.globalScale + 32)}px;
            top: ${(player.y * this.globalScale + 32)}px;">
        </div>`);
        if (player.id == client.player.id) {
            this.renderControls(player, this.getTile(player.x, player.y).type);
            // render player in center
            // TODO
            let container = document.querySelector('#container')
            let playerElement = document.querySelector('#player_'+ client.player.id)
            let left = parseInt(playerElement.style.left) + window.innerWidth / 2;
            let top = parseInt(playerElement.style.top) + window.innerHeight / 2;
            container.style.top = top +"px";
            container.style.left = left +"px";
        }
    }
    renderMonster(monster) {

    }

    // controls
    renderControls(player, type) {
        if (type === 'start') {
            this.showControl(player, 'up');
            this.showControl(player, 'right');
            this.showControl(player, 'down');
            this.showControl(player, 'left');
        }
        if (type.indexOf('Up') >= 0) {
            this.showControl(player, 'up');
        }
        if (type.indexOf('Right') >= 0) {
            this.showControl(player, 'right');
        }
        if (type.indexOf('Down') >= 0) {
            this.showControl(player, 'down');
        }
        if (type.indexOf('Left') >= 0) {
            this.showControl(player, 'left');
        }
    }

    showControl(player, direction) {
        switch (direction) {
            case 'up':
                if (this.checkWay(player, direction)) {
                    document.querySelector("#map")
                    .insertAdjacentHTML("beforeend",
                        `<div class="control up"
                        style="left:${player.x * this.globalScale + 32}px;
                        top:${player.y * this.globalScale}px;"
                        onClick="client.move('up')">`);
                    }
                    break
            case 'right':
                if (this.checkWay(player, direction)) {
                    document.querySelector("#map")
                        .insertAdjacentHTML("beforeend",
                            `<div class="control right"
                            style="left:${player.x * this.globalScale + 64}px;
                            top:${player.y * this.globalScale + 32}px;"
                            onClick="client.move('right')">`);
                }
                break
            case 'down':
                if (this.checkWay(player, direction)) {
                    document.querySelector("#map")
                        .insertAdjacentHTML("beforeend",
                            `<div class="control down"
                            style="left:${player.x * this.globalScale + 32}px;
                            top:${player.y * this.globalScale + 64}px;"
                            onClick="client.move('down')">`);
                }
                break
            case 'left':
                if (this.checkWay(player, direction)) {
                    document.querySelector("#map")
                        .insertAdjacentHTML("beforeend",
                            `<div class="control left"
                            style="left:${player.x * this.globalScale}px;
                            top:${player.y * this.globalScale + 32}px;"
                            onClick="client.move('left')">`);
                }
                break
        }
    }

    checkWay(player, direction) {
        let nextCordsType = null;
        if (direction == 'up') {
            nextCordsType = this.getTile(player.x, player.y - 1)?.type;
            if (nextCordsType?.indexOf('Down') >= 0) {
                return true;
            }
        }
        if (direction == 'right') {
            nextCordsType = this.getTile(player.x + 1, player.y)?.type;
            if (nextCordsType?.indexOf('Left') >= 0) {
                return true;
            }
        }
        if (direction == 'down') {
            nextCordsType = this.getTile(player.x, player.y + 1)?.type;
            if (nextCordsType?.indexOf('Up') >= 0) {
                return true;
            }
        }
        if (direction == 'left') {
            nextCordsType = this.getTile(player.x - 1, player.y)?.type;
            if (nextCordsType?.indexOf('Right') >= 0) {
                return true;
            }
        }

        // no tile in this direction
        if (!nextCordsType) {
            return true;
        }
        return false;
    }

    getTile(x, y,) {
        let map = client.map;
        for (let tile of map) {
            if (tile.x === x && tile.y === y) {
                return tile;
            }
        }
        return null;
    }
}

function startSocket() {
    socket.on("connect", () => {
        console.log(socket.id);
        socket.emit("login", client.getLogin());
    });

    socket.on("map", (data) => {
        client.setData(data, "map");
        client.renderType("map");
    });
    socket.on("player", (data) => {
        client.setData(data, "player");
        client.renderType("players");
    });
    socket.on("players", (data) => {
        client.setData(data, "players");
        client.renderType("players");
    });
    socket.on("monsters", (data) => {
        client.setData(data, "monsters");
        client.renderType("monsters");
    });
}

const client = new Client();
startSocket();