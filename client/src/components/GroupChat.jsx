import { useEffect, useState } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:5001", {
  transports: ["websocket"],
  auth: {
    token: localStorage.getItem("token"),
  },
});

export default function GroupChat({ groupId, user }) {
  const [messages, setMessages] = useState([]);
  const [group, setGroup] = useState(null);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  const loadMessages = async () => {
    try {
      const res = await fetch(
        `http://localhost:5001/api/group-messages/${groupId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const data = await res.json();
      setMessages(data);
    } catch {
      setError("Fehler beim Laden der Nachrichten");
    }
  };

  const loadGroupInfo = async () => {
    try {
      const res = await fetch(`http://localhost:5001/api/groups/${groupId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await res.json();
      setGroup(data);
    } catch {
      setGroup({ name: "Gruppe" });
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(
        `http://localhost:5001/api/group-messages/${groupId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ text }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        socket.emit("groupMessage", { groupId, message: data });
        setText("");
      } else {
        setError(data.msg || "Fehler beim Senden");
      }
    } catch {
      setError("Serverfehler beim Senden");
    }
  };

  useEffect(() => {
    loadMessages();
    loadGroupInfo();
    socket.emit("joinGroup", groupId);
    socket.on("receiveGroupMessage", (msg) => {
      if (msg.receiverId === groupId) {
        setMessages((prev) => [...prev, msg]);
      }
    });
    return () => {
      socket.off("receiveGroupMessage");
    };
  }, [groupId]);

  return (
    <div
      style={{
        padding: "1rem",
        color: "white",
        backgroundColor: "#222",
        borderRadius: "8px",
      }}
    >
      <h4>{group?.name || "Gruppe"}</h4>
      <p style={{ fontSize: "0.85rem", color: "#bbb" }}>
        Mitglieder: {group?.members?.length || 0}
      </p>

      <div
        style={{
          maxHeight: "300px",
          overflowY: "auto",
          marginBottom: "1rem",
          padding: "0.5rem",
        }}
      >
        {messages.map((msg) => (
          <div
            key={msg._id}
            style={{
              margin: "0.4rem 0",
              backgroundColor: msg.senderId === user.id ? "#004400" : "#333",
              padding: "0.5rem 0.75rem",
              borderRadius: "12px",
              textAlign: msg.senderId === user.id ? "right" : "left",
            }}
          >
            <div style={{ fontSize: "0.85rem" }}>
              <b>{msg.senderId === user.id ? "Du" : msg.senderId}:</b>{" "}
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} style={{ display: "flex", gap: "0.5rem" }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Nachricht..."
          style={{
            flexGrow: 1,
            padding: "0.5rem",
            borderRadius: "6px",
            border: "none",
          }}
        />
        <button
          type="submit"
          style={{
            padding: "0.5rem 1rem",
            background: "#00ff88",
            border: "none",
            borderRadius: "6px",
          }}
        >
          Senden
        </button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
