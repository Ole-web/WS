import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import multer from "multer";
import path from "path";
import authRoutes from "./routes/auth.js";
import messageRoutes from "./routes/messages.js";
import userRoutes from "./routes/users.js";
import Message from "./models/Message.js";
import User from "./models/User.js";
import fs from "fs";
import verifyToken from "./middleware/verifyToken.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/";
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = Date.now() + ext;
    cb(null, name);
  },
});

const upload = multer({ storage });

app.post("/api/messages/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ msg: "Keine Datei empfangen" });
  const fileUrl = `http://localhost:5001/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("🟢 Benutzer verbunden:", socket.id);

  socket.on("userOnline", (userId) => {
    onlineUsers.set(userId, socket.id);
    io.emit("updateUserStatus", Array.from(onlineUsers.keys()));
  });

  socket.on("sendMessage", async (data) => {
    const { senderId, receiverId, text, fileUrl } = data;
    const message = new Message({ senderId, receiverId, text, fileUrl });
    await message.save();

    const receiverSocket = onlineUsers.get(receiverId);
    if (receiverSocket) {
      io.to(receiverSocket).emit("receiveMessage", message);
    }
  });

  socket.on("disconnect", () => {
    for (const [userId, sockId] of onlineUsers.entries()) {
      if (sockId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
    io.emit("updateUserStatus", Array.from(onlineUsers.keys()));
    console.log("🔴 Benutzer getrennt:", socket.id);
  });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    server.listen(5001, () =>
      console.log("Server & Socket läuft auf Port 5001")
    );
  })
  .catch((err) => console.error(err));
