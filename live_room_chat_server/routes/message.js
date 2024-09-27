const express = require("express");

const messageController = require("../controllers/message");

const router = express.Router();

router.get("/chat/:roomName", messageController.getOldMessage);

module.exports = router;