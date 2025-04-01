import express from "express";
import User from "../models/User.js";
import Group from "../models/Group.js";
import verifyToken from "../middleware/verifyToken.js";
import mongoose from "mongoose";

const router = express.Router();

// Alle Benutzer außer sich selbst
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const users = await User.find(
      { _id: { $ne: req.params.id } },
      "name email"
    );
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: "Fehler beim Laden der Benutzerliste" });
  }
});

// Nur Freunde laden
router.get("/friends", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate(
      "friends",
      "name email"
    );
    res.json(user.friends);
  } catch (err) {
    res.status(500).json({ msg: "Fehler beim Laden der Freunde" });
  }
});

// Freund hinzufügen (bidirektional)
router.post("/add-friend", verifyToken, async (req, res) => {
  const { friendId } = req.body;
  try {
    const user = await User.findById(req.userId);
    const friend = await User.findById(friendId);

    if (!user.friends.includes(friendId)) {
      user.friends.push(friendId);
      await user.save();
    }
    if (!friend.friends.includes(req.userId)) {
      friend.friends.push(req.userId);
      await friend.save();
    }

    res.json({ msg: "Freund hinzugefügt (beidseitig)" });
  } catch (err) {
    res.status(500).json({ msg: "Fehler beim Hinzufügen" });
  }
});

// Freund entfernen (bidirektional)
router.post("/remove-friend", verifyToken, async (req, res) => {
  const { friendId } = req.body;
  try {
    await User.findByIdAndUpdate(req.userId, { $pull: { friends: friendId } });
    await User.findByIdAndUpdate(friendId, { $pull: { friends: req.userId } });
    res.json({ msg: "Freund entfernt (beidseitig)" });
  } catch (err) {
    res.status(500).json({ msg: "Fehler beim Entfernen" });
  }
});

// Gruppe erstellen
router.post("/create-group", verifyToken, async (req, res) => {
  const { name, members } = req.body;
  try {
    const group = new Group({
      name,
      members: [...new Set([...members, req.userId])],
    });
    await group.save();
    res.json(group);
  } catch (err) {
    res.status(500).json({ msg: "Fehler beim Erstellen der Gruppe" });
  }
});

// Gruppen des Benutzers abrufen
router.get("/groups", verifyToken, async (req, res) => {
  try {
    const groups = await Group.find({ members: req.userId });
    res.json(groups);
  } catch (err) {
    res.status(500).json({ msg: "Fehler beim Laden der Gruppen" });
  }
});

// Benutzer nach Namen suchen (für Autocomplete)
router.get("/search", verifyToken, async (req, res) => {
  console.log("🟢 SUCHE gestartet");
  const q = req.query.q;
  console.log("🔍 q:", q);
  console.log("🔐 userId (String):", req.userId);

  if (!q || typeof q !== "string") {
    console.warn("⚠️ Ungültige Query!");
    return res.status(400).json({ msg: "Ungültige Suchanfrage." });
  }

  let userObjectId;
  try {
    userObjectId = new mongoose.Types.ObjectId(req.userId);
  } catch (err) {
    console.error("❌ Fehler bei ObjectId:", err.message);
    return res.status(400).json({ msg: "Ungültige Benutzer-ID." });
  }

  try {
    const users = await User.find({
      name: { $regex: q.trim(), $options: "i" },
      _id: { $ne: userObjectId },
    }).select("name email");

    console.log("✅ GEFUNDEN:", users);
    res.json(users);
  } catch (err) {
    console.error("❌ DB-Fehler:", err.message);
    res.status(500).json({ msg: "Fehler bei der Suche", error: err.message });
  }
});

export default router;
