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
var usersRoundData = [];

io.on("connection", (socket) => {
  userCounter++;
  console.log("A user connected:", socket.id);

  /* Handle disconnects */
  socket.on("disconnect", function () {
    socket.removeAllListeners();
    userCounter--;
    if (userCounter < 2) {
      io.sockets.emit("hide-game", {
        message: "WAITING",
      });
    }
    console.log("User disconnected");
  });

  /* Send player id */
  socket.emit("player-data", {
    id: gameLogic.generateId(),
    emoji: gameLogic.generateEmoji(),
  });

  /* Send random letter to start round */
  if (userCounter > 1) {
    io.sockets.emit("toast", {
      message: `${userCounter} jugadores conectados!`,
    });
    io.sockets.emit("start-game", {
      message: "START",
    });

    var randomLetter = gameLogic.generateRandomLetter();
    io.sockets.emit("random-letter", {
      letter: randomLetter,
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
  socket.on("calculate-score", async function (data) {
    usersRoundData.push(data);
    var results = await gameLogic.calculateResults(usersRoundData);
    io.sockets.emit("show-results", { results: results });
    usersRoundData = [];
  });
});

// App init
server.listen(appConfig.expressPort, () => {
  console.log(
    `Server is listenning on ${appConfig.expressPort}! (http://localhost:${appConfig.expressPort})`
  );
});
