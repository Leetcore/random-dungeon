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

    renderFight(fightReport) {
        this.render.renderFight(fightReport);
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
        this.fightReportTimer = null
        this.weapons = [];
    }

    // render all tiles, players or monsters
    renderMap(map) {
        for (let tile of map) {
            this.renderTile(tile);
        }
    }
    renderPlayers(players) {
        // keep track of alive players
        document.querySelectorAll(".player").forEach(player => {
            player.classList.remove("alive");
        });
        // render or update player
        for (let player of players) {
            this.renderPlayer(player);
        }
        // remove players that didnt get updated -> dead
        document.querySelectorAll(".player:not(.alive)").forEach(player => {
            player.remove()
        });
    }
    renderMonsters(monsters) {
        // keep track of alive monsters
        document.querySelectorAll(".monster").forEach(monster => {
            monster.classList.remove("alive");
        });
        // render or update monsters
        for (let monster of monsters) {
            this.renderMonster(monster);
        }
        // remove monsters that didnt get updated -> dead
        document.querySelectorAll(".monster:not(.alive)").forEach(monster => {
            monster.remove()
        });
    }

    // render single tile, player or monster
    renderTile(tile) {
        let tileExists = document.querySelector("#tile_" + tile.id);
        if (!tileExists) {
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
    }

    renderPlayer(player) {
        let playerExits = document.querySelector("#player_" + player.id)
        if (playerExits) {
            // player exist update player position
            playerExits.classList.add("alive")
            playerExits.style.left = `${(player.x * this.globalScale + 32)}px`
            playerExits.style.top = `${(player.y * this.globalScale + 32)}px`
            playerExits.setAttribute("cordsX", player.x)
            playerExits.setAttribute("cordsY", player.y)
        } else {
            document.querySelector("#map")
                .insertAdjacentHTML("beforeend",
                    `<div class="player alive"
                id="player_${player.id}"
                cordsX="${player.x}" cordsY="${player.y}"
                style="background-image: url(${player.url});
                left: ${(player.x * this.globalScale + 32)}px;
                top: ${(player.y * this.globalScale + 32)}px;">
            </div>`);
        }

        if (player.id == client.player.id) {
            // thats ME!
            this.renderControls(player, this.getTile(player.x, player.y).type);
            let container = document.querySelector('#container')
            let playerElement = document.querySelector('#player_' + client.player.id)
            let left = window.innerWidth / 2 - parseInt(playerElement.style.left);
            let top = window.innerHeight / 2 - parseInt(playerElement.style.top);
            container.style.top = top + "px";
            container.style.left = left + "px";

            this.renderStats(player)
        }
    }

    renderMonster(monster) {
        // TODO: delete monster
        let monsterExists = document.querySelector("#monster_" + monster.id)
        if (monsterExists) {
            // monster exist update monster position
            monsterExists.classList.add("alive")
            monsterExists.style.left = `${(monster.x * this.globalScale + 32)}px`
            monsterExists.style.top = `${(monster.y * this.globalScale + 32)}px`
            monsterExists.setAttribute("cordsX", monster.x)
            monsterExists.setAttribute("cordsY", monster.y)
        } else {
            // render new monster
            document.querySelector("#map")
                .insertAdjacentHTML("beforeend",
                    `<div class="monster alive"
                id="monster_${monster.id}"
                cordsX="${monster.x}" cordsY="${monster.y}"
                style="background-image: url(${monster.url});
                left: ${(monster.x * this.globalScale + 32)}px;
                top: ${(monster.y * this.globalScale + 32)}px;">
            </div>`);
        }
    }

    // render stats
    renderStats(player) {
        document.querySelector("#health").textContent = player.health
        let weapon = this.renderWeapon(player.weapon)
        document.querySelector("#weapon").innerHTML = '<img src="/assets/weapons/'+ weapon.filename +'"/>'
        document.querySelector("#damage").textContent = weapon?.damage
        document.querySelector("#critChance").textContent = weapon?.critChance
    }

    renderWeapon(id) {
        for (let weapon of this.weapons) {
            if (weapon.id === id) {
                return weapon;
            }
        }
        return null;
    }

    // render fight
    renderFight(fightReportMessage) {
        const fightReport = JSON.parse(fightReportMessage)
        document.querySelector("#story").innerHTML = `<div id="fight">
            <div id="fightContainer">
                <div id="fightPlayer">
                    <div id="playerImg"></div>
                    <div id="weaponImg"></div>
                    <div id="playerDamage"></div>
                </div>
                <div id="fightEnemy">
                    <div id="enemyDamage"></div>
                    <div id="enemyImg"></div>
                    <div id="enemyName"></div>
                </div>
            </div>
        </div>`
        document.querySelector("#playerDamage").textContent = fightReport.playerDamage

        let weapon = this.renderWeapon(fightReport.weapon)
        document.querySelector("#weaponImg").innerHTML = '<img src="/assets/weapons/'+ weapon.filename +'"/>'

        document.querySelector("#playerImg").innerHTML = `<img class="playerImg" src="${fightReport.playerImg}"/>`
        document.querySelector("#enemyImg").innerHTML = `<img class="enemyImg" src="${fightReport.monsterImg}"/>`
        document.querySelector("#enemyName").innerHTML = fightReport.monsterName
        document.querySelector("#enemyDamage").innerHTML = fightReport?.monsterDamage || ''

        if (this.fightReportTimer) {
            clearTimeout(this.fightReportTimer)
        }
        this.fightReportTimer = setTimeout(() => {
            document.querySelector("#fight").remove()
        }, 30 * 1000);
    }

    // controls
    renderControls(player, type) {
        // remove control divs
        document.querySelectorAll('.control').forEach(element => {
            element.remove();
        });

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
    socket.on("fight", (fightReport) => {
        client.renderFight(fightReport);
    });
    socket.on("weapons", (weapons) => {
        client.render.weapons = JSON.parse(weapons);
    });
}

const client = new Client();
startSocket();

window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp") {
        client.move("up")
    } else if (e.key === "ArrowRight") {
        client.move("right")
    } else if (e.key === "ArrowDown") {
        client.move("down")
    } else if (e.key === "ArrowLeft") {
        client.move("left")
    }
});