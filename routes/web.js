const router = require("express").Router();
const gameController = require("../controllers/GameController");

router.get("/", gameController.display);

module.exports = router;
