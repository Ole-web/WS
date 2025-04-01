import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:5001");

export default function Chat({ user, contact }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [file, setFile] = useState(null);
  const chatRef = useRef(null);

  useEffect(() => {
    if (!user || !contact) return;
    socket.emit("userOnline", user.id);

    fetch(`http://localhost:5001/api/messages/${user.id}/${contact.id}`)
      .then((res) => res.json())
      .then((data) => setMessages(data));

    socket.on("receiveMessage", (msg) => {
      if (
        (msg.senderId === user.id && msg.receiverId === contact.id) ||
        (msg.senderId === contact.id && msg.receiverId === user.id)
      ) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    return () => socket.off("receiveMessage");
  }, [user, contact]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() && !file) return;

    let uploadedUrl = null;
    if (file) {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("http://localhost:5001/api/messages/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      uploadedUrl = data.url;
    }

    const newMsg = {
      senderId: user.id,
      receiverId: contact.id,
      text: input,
      fileUrl: uploadedUrl || null,
    };

    socket.emit("sendMessage", newMsg);
    setMessages((prev) => [...prev, { ...newMsg, createdAt: new Date() }]);
    setInput("");
    setFile(null);
  };

  return (
    <div className="chat">
      <h3>Chat mit {contact.name}</h3>
      <div className="messages" ref={chatRef}>
        {messages.map((msg, i) => (
          <div key={i} className={msg.senderId === user.id ? "own" : "other"}>
            {msg.fileUrl && (
              <img
                src={msg.fileUrl}
                alt="Anhang"
                style={{ maxWidth: "100px" }}
              />
            )}
            <p>{msg.text}</p>
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Nachricht eingeben..."
        />
        <input type="file" onChange={(e) => setFile(e.target.files[0])} />
        <button type="submit">Senden</button>
      </form>
    </div>
  );
}
