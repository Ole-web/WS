import { useEffect, useState } from "react";
import UserList from "../components/UserList";
import Chat from "../components/Chat";
import GroupList from "../components/GroupList";
import GroupChat from "../components/GroupChat";
import io from "socket.io-client";
import { useNavigate } from "react-router-dom";
import "../styles/userlist.scss";
import "../styles/chat.scss";

const socket = io("http://localhost:5001", {
  auth: {
    token: localStorage.getItem("token"),
  },
  transports: ["websocket", "polling"],
  withCredentials: false,
});

export default function Home({ user }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [view, setView] = useState("private");
  const [showProfile, setShowProfile] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleSearch = async (e) => {
    const rawQuery = e.target.value;
    const query = rawQuery.trim();
    setSearch(rawQuery);

    if (!query) return setResults([]);

    try {
      const res = await fetch(
        `http://localhost:5001/api/users/search?q=${encodeURIComponent(query)}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) {
        console.error("Fehler beim Laden der Benutzer:", res.statusText);
        setResults([]);
        return;
      }

      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error("Such-Fehler:", err.message);
      setResults([]);
    }
  };

  useEffect(() => {
    if (!user) return;
    socket.emit("userOnline", user.id);
    socket.on("updateUserStatus", (list) => setOnlineUsers(list));
    return () => socket.off("updateUserStatus");
  }, [user]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: "1.5rem",
        minHeight: "100vh",
        background: "#0f0f0f",
        fontFamily: "'Inter', sans-serif",
        color: "white",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingBottom: "1rem",
          borderBottom: "1px solid #333",
        }}
      >
        <h1 style={{ color: "#00ff88", fontSize: "1.75rem" }}>wesynk.</h1>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={() => setView(view === "private" ? "group" : "private")}
            style={btnToggle}
          >
            {view === "private" ? "Gruppen anzeigen" : "Privatnachrichten"}
          </button>
          <button
            onClick={() => setShowProfile(!showProfile)}
            style={btnSecondary}
          >
            Profil
          </button>
          <button onClick={handleLogout} style={btnPrimary}>
            Logout
          </button>
        </div>
      </header>

      <main
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
          marginTop: "2rem",
        }}
      >
        {showProfile ? (
          <section style={card}>
            <h3 style={{ color: "#00ff88", marginBottom: "1rem" }}>
              👤 Dein Profil
            </h3>
            <p>
              <strong>Name:</strong> {user?.name}
            </p>
            <p>
              <strong>Email:</strong> {user?.email}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              {onlineUsers.includes(user.id) ? "🟢 Online" : "⚫️ Offline"}
            </p>
          </section>
        ) : (
          <>
            <section
              style={{ maxWidth: "600px", width: "100%", margin: "0 auto" }}
            >
              <input
                type="text"
                value={search}
                onChange={handleSearch}
                placeholder="🔍 Benutzer suchen..."
                style={searchInput}
              />
              {search && results.length === 0 && (
                <p style={{ color: "#aaa", marginTop: "0.5rem" }}>
                  Keine Benutzer gefunden.
                </p>
              )}
              {results.length > 0 && (
                <ul
                  style={{ listStyle: "none", padding: 0, marginTop: "1rem" }}
                >
                  {results.map((u) => (
                    <li key={u._id} style={searchItem}>
                      <span>
                        👤 {u.name}{" "}
                        <span style={{ fontSize: "0.85rem", color: "#888" }}>
                          ({u.email})
                        </span>
                      </span>
                      <button
                        style={btnPrimarySmall}
                        onClick={() => {
                          setSelectedUser(u);
                          setResults([]);
                          setSearch("");
                          setView("private");
                        }}
                      >
                        Hinzufügen
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section
              style={{
                display: "flex",
                flexDirection: window.innerWidth < 768 ? "column" : "row",
                gap: "1rem",
              }}
            >
              {view === "private" ? (
                <>
                  <UserList
                    user={user}
                    selected={selectedUser}
                    onSelect={(u) => {
                      setSelectedUser(u);
                      setSelectedGroup(null);
                    }}
                    onlineUsers={onlineUsers}
                  />
                  {selectedUser && <Chat user={user} contact={selectedUser} />}
                </>
              ) : (
                <>
                  <GroupList
                    user={user}
                    onSelectGroup={(id) => {
                      setSelectedGroup(id);
                      setSelectedUser(null);
                    }}
                  />
                  {selectedGroup && (
                    <GroupChat groupId={selectedGroup} user={user} />
                  )}
                </>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

const btnPrimary = {
  background: "#00ff88",
  color: "#000",
  padding: "0.5rem 1rem",
  borderRadius: "8px",
  border: "none",
  fontWeight: 600,
  cursor: "pointer",
};

const btnPrimarySmall = {
  ...btnPrimary,
  padding: "0.3rem 0.7rem",
  fontSize: "0.85rem",
};

const btnSecondary = {
  background: "#222",
  color: "#fff",
  border: "1px solid #444",
  padding: "0.5rem 1rem",
  borderRadius: "8px",
  cursor: "pointer",
};

const btnToggle = {
  background: "transparent",
  color: "#00ff88",
  border: "1px solid #00ff88",
  padding: "0.5rem 1rem",
  borderRadius: "8px",
  cursor: "pointer",
};

const card = {
  background: "#111",
  padding: "1.5rem",
  borderRadius: "12px",
  maxWidth: "500px",
  margin: "0 auto",
  boxShadow: "0 0 12px #00ff8822",
};

const searchInput = {
  width: "100%",
  padding: "0.75rem 1rem",
  borderRadius: "8px",
  border: "2px solid #00ff88",
  background: "#111",
  color: "white",
  fontSize: "1rem",
  outline: "none",
};

const searchItem = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "0.5rem 1rem",
  background: "#1b1b1b",
  borderRadius: "8px",
  marginBottom: "0.5rem",
};
