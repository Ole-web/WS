import express from "express";
import verifyToken from "../middleware/verifyToken.js";
import Group from "../models/Group.js";
import Message from "../models/Message.js";

const router = express.Router();

// Alle Nachrichten einer Gruppe abrufen
router.get("/:groupId", verifyToken, async (req, res) => {
  try {
    const messages = await Message.find({
      receiverId: req.params.groupId,
      type: "group",
    }).sort("createdAt");
    res.json(messages);
  } catch (err) {
    res.status(500).json({ msg: "Fehler beim Laden der Gruppennachrichten" });
  }
});

// Neue Nachricht an Gruppe senden
router.post("/:groupId", verifyToken, async (req, res) => {
  const { text, fileUrl } = req.body;
  try {
    const message = new Message({
      senderId: req.userId,
      receiverId: req.params.groupId,
      text,
      fileUrl,
      type: "group",
    });
    await message.save();
    res.json(message);
  } catch (err) {
    res.status(500).json({ msg: "Fehler beim Senden der Nachricht" });
  }
});

export default router;
