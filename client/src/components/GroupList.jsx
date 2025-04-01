import { useEffect, useState } from "react";

export default function GroupList({ user, onSelectGroup }) {
  const [groups, setGroups] = useState([]);
  const [name, setName] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [friends, setFriends] = useState([]);
  const [error, setError] = useState("");

  const loadGroups = async () => {
    try {
      const res = await fetch("http://localhost:5001/api/users/groups", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await res.json();
      setGroups(data);
    } catch {
      setError("Fehler beim Laden der Gruppen");
    }
  };

  const loadFriends = async () => {
    try {
      const res = await fetch("http://localhost:5001/api/users/friends", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await res.json();
      setFriends(data);
    } catch {
      setError("Fehler beim Laden der Freunde");
    }
  };

  const createGroup = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5001/api/users/create-group", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ name, members: selectedIds }),
      });
      const data = await res.json();
      if (res.ok) {
        setGroups((prev) => [...prev, data]);
        setName("");
        setSelectedIds([]);
      } else {
        setError(data.msg || "Fehler beim Erstellen");
      }
    } catch {
      setError("Serverfehler beim Erstellen der Gruppe");
    }
  };

  useEffect(() => {
    loadGroups();
    loadFriends();
  }, []);

  const toggleFriend = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div style={{ padding: "1rem", color: "white" }}>
      <h3>Gruppen</h3>
      {groups.map((group) => (
        <div
          key={group._id}
          style={{
            marginBottom: "0.5rem",
            cursor: "pointer",
            color: "#00ff88",
          }}
          onClick={() => onSelectGroup(group._id)}
        >
          📁 {group.name}
        </div>
      ))}

      <form onSubmit={createGroup} style={{ marginTop: "1rem" }}>
        <h4>Neue Gruppe erstellen</h4>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Gruppenname"
          style={{ padding: "0.4rem", marginRight: "0.5rem" }}
        />

        <div style={{ margin: "0.5rem 0" }}>
          {friends.map((friend) => (
            <label
              key={friend._id}
              style={{ display: "block", cursor: "pointer" }}
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(friend._id)}
                onChange={() => toggleFriend(friend._id)}
              />{" "}
              {friend.name} ({friend.email})
            </label>
          ))}
        </div>

        <button type="submit">Erstellen</button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
