import { useEffect, useState } from "react";
import UserSearch from "./UserSearch";

export default function UserList({ user, onSelect, selected, onlineUsers }) {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const loadFriends = () => {
    if (!user) return;
    fetch(`http://localhost:5001/api/users/friends`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setUsers(data);
        } else {
          setError("Benutzer konnten nicht geladen werden");
        }
      })
      .catch(() => setError("Serverfehler beim Laden der Benutzer"));
  };

  const removeFriend = async (friendId) => {
    const confirmed = window.confirm("Diesen Freund wirklich entfernen?");
    if (!confirmed) return;
    try {
      const res = await fetch("http://localhost:5001/api/users/remove-friend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ friendId }),
      });
      if (res.ok) {
        setSuccess("Freund entfernt");
        loadFriends();
        setTimeout(() => setSuccess(null), 2000);
      } else {
        setError("Fehler beim Entfernen");
      }
    } catch {
      setError("Serverfehler beim Entfernen");
    }
  };

  useEffect(() => {
    loadFriends();
  }, [user]);

  return (
    <div
      className="user-list"
      style={{ padding: "1rem", backgroundColor: "#111", borderRadius: "10px" }}
    >
      <h4 style={{ color: "#00ff88", marginBottom: "0.5rem" }}>🧑‍🤝‍🧑 Freunde</h4>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "lime" }}>{success}</p>}
      <div style={{ marginBottom: "1rem" }}>
        {Array.isArray(users) &&
          users.map((u) => (
            <div
              key={u._id}
              className={`user ${selected?.id === u._id ? "selected" : ""}`}
              style={{
                padding: "0.5rem",
                backgroundColor: selected?.id === u._id ? "#00ff8822" : "#222",
                borderRadius: "6px",
                marginBottom: "0.5rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div
                onClick={() => onSelect({ id: u._id, name: u.name })}
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  alignItems: "center",
                  cursor: "pointer",
                }}
              >
                <span style={{ color: "white" }}>{u.name}</span>
                <span
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    backgroundColor: onlineUsers.includes(u._id)
                      ? "#0f0"
                      : "#666",
                  }}
                ></span>
              </div>
              <button
                onClick={() => removeFriend(u._id)}
                style={{
                  background: "transparent",
                  color: "#f44",
                  border: "none",
                  cursor: "pointer",
                }}
                title="Freund entfernen"
              >
                🗑️
              </button>
            </div>
          ))}
      </div>
      <div style={{ borderTop: "1px solid #333", paddingTop: "1rem" }}>
        <UserSearch onFriendAdded={loadFriends} />
      </div>
    </div>
  );
}
