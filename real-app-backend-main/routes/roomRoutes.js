const express = require("express");
const authController = require("../controllers/authController");
const roomController = require("../controllers/roomController");

const router = express.Router();

router.get("/:id/availability", roomController.getRoomAvailability);

router.use(authController.protect);
router.use(authController.requireRole("provider"));

router.post("/", roomController.createRoom);
router.get("/mine", roomController.getMyRooms);
router.put("/:id", roomController.updateRoom);
router.delete("/:id", roomController.deleteRoom);
router.post("/:id/block", roomController.createRoomBlock);
router.delete("/:id/block/:blockId", roomController.deleteRoomBlock);

module.exports = router;
