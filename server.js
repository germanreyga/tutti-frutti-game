// Imports
const express = require("express");
const webRoutes = require("./routes/web");

// Express app creation
const app = express();

// Socket.io
const server = require("http").Server(app);
const io = require("socket.io")(server);

// Game logic
const gameLogic = require("./game_logic/game");

// Configurations
const appConfig = require("./configs/app");

// View engine configs
const exphbs = require("express-handlebars");
const hbshelpers = require("handlebars-helpers");
const multihelpers = hbshelpers();
const extNameHbs = "hbs";
const hbs = exphbs.create({
  extname: extNameHbs,
  helpers: multihelpers,
});
app.engine(extNameHbs, hbs.engine);
app.set("view engine", extNameHbs);

// Receive parameters from the Form requests
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/", webRoutes);

// Public files like css, js
app.use(express.static("public"));

/* Game variables */
var userCounter = 0;
var participatingUserCounter = 0;
var usersRoundData = [];
var gameIsRunning = false;

function restartGame() {
  gameIsRunning = false;
  usersRoundData = [];
  participatingUserCounter = 0;
}

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);
  userCounter++;

  /* Handle disconnects */
  socket.on("disconnect", function () {
    socket.removeAllListeners();
    userCounter--;
    console.log("User disconnected");
    if (userCounter < 2) {
      io.sockets.emit("hide-game", {
        message: "WAITING",
      });
    } else {
      io.sockets.emit("show-btn", {
        class: ".start-btn",
        counter: userCounter,
      });
    }

    if (userCounter == 0) {
      restartGame();
    }
  });

  /* Send player id */
  socket.emit("player-data", {
    id: gameLogic.generateId(),
    emoji: gameLogic.generateEmoji(),
  });

  if (!gameIsRunning) {
    /* Send random letter to start round */
    if (userCounter > 1) {
      io.sockets.emit("toast", {
        message: `${userCounter} jugadores conectados!`,
      });

      io.sockets.emit("show-btn", {
        class: ".start-btn",
        counter: userCounter,
      });
    }
  } else {
    socket.emit("waiting-to-finish", {
      message:
        "Game is running, please wait until the other players finish this round...",
    });
  }

  /* Finished the round for everyone after someone ends the round*/
  socket.on("finished-round", function (data) {
    io.sockets.emit("finish-all", {
      message: "Ending the round",
      timer: gameLogic.ROUND_FINISH_TIMER,
    });
  });

  /* Calculates the round scores for everyone */
  /* Emits only when the results are complete */
  socket.on("calculate-score", async function (data) {
    if (usersRoundData.length == 0) {
      io.sockets.emit("toast", {
        message: "Calculating results, please wait...",
      });
    }

    usersRoundData.push(data);

    var results = await gameLogic.calculateResults(usersRoundData);

    io.sockets.emit("show-results", { results: results });
  });

  /* Starts the round game */
  socket.on("player-ready", async function (data) {
    gameIsRunning = true;

    var randomLetter = gameLogic.generateRandomLetter();
    io.sockets.emit("random-letter", {
      letter: randomLetter,
    });

    io.sockets.emit("start-game", {
      message: "Ready to start",
    });
  });

  /* Restarts the game */
  socket.on("restart-game", async function (data) {
    restartGame();

    io.sockets.emit("clear-game", {
      message:
        "Someone restarted the game, prepare for the next round in 10 seconds...",
      timer: gameLogic.ROUND_RESTART_TIMER,
    });
  });
});

// App init
server.listen(appConfig.expressPort, () => {
  console.log(
    `Server is listenning on ${appConfig.expressPort}! (http://localhost:${appConfig.expressPort})`
  );
});
