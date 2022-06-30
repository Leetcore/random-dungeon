const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const { game } = require("./game");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { /* options */ });

// express public folder
app.use(express.static("public"));

io.on("connection", (socket) => {
    const gameInst = new game(socket);

    // update the map
    gameInst.updateGame();

    // login new or existing player
    socket.on("login", (login) => {
        const player = gameInst.loginPlayer(login);
        socket.emit("player", JSON.stringify(player));
        gameInst.updateGame();
    });
    
    // move player in game
    socket.on("movement", (moveObject) => {
        gameInst.movement(moveObject.id, moveObject.login, moveObject.direction);
    });

    // start game event
    gameInst.gameLoop();
});

httpServer.listen(8080);