// Imports
const express = require("express");
const webRoutes = require("./routes/web");

// Express app creation
const app = express();

// Socket.io
const server = require("http").Server(app);
const io = require("socket.io")(server);

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

var userCounter = 0;

io.on("connection", (socket) => {
  userCounter++;
  console.log("A user connected:", socket.id);

  if (userCounter > 1) {
    io.sockets.emit("toast", {
      message: `${userCounter} jugadores conectados!`,
    });
    io.sockets.emit("start-game", { message: "START" });
  }

  /* Handle disconnects */
  socket.on("disconnect", function () {
    socket.removeAllListeners();
    userCounter--;
    if (userCounter < 2) {
      io.sockets.emit("hide-game", { message: "WAITING" });
    }
    console.log("user disconnected");
  });
});

// App init
server.listen(appConfig.expressPort, () => {
  console.log(
    `Server is listenning on ${appConfig.expressPort}! (http://localhost:${appConfig.expressPort})`
  );
});
