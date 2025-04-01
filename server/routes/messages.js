import express from "express";
import Message from "../models/Message.js";
import verifyToken from "../middleware/verifyToken.js";

const router = express.Router();

router.get("/:user1/:user2", verifyToken, async (req, res) => {
  const { user1, user2 } = req.params;
  try {
    const messages = await Message.find({
      $or: [
        { senderId: user1, receiverId: user2 },
        { senderId: user2, receiverId: user1 },
      ],
    }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ msg: "Fehler beim Laden der Nachrichten" });
  }
});

export default router;
