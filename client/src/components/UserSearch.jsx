import { useState } from "react";

export default function UserSearch({ onFriendAdded }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!query) return;
    try {
      const res = await fetch(
        `http://localhost:5001/api/users/search?q=${query}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const data = await res.json();
      if (Array.isArray(data)) setResults(data);
      else setError("Fehler bei der Suche");
    } catch {
      setError("Serverfehler bei der Suche");
    }
  };

  const addFriend = async (friendId) => {
    try {
      const res = await fetch("http://localhost:5001/api/users/add-friend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ friendId }),
      });
      const data = await res.json();
      if (res.ok) {
        onFriendAdded?.();
        alert("Freund hinzugefügt");
      } else {
        setError(data.msg || "Fehler beim Hinzufügen");
      }
    } catch {
      setError("Serverfehler beim Hinzufügen");
    }
  };

  return (
    <div style={{ padding: "1rem", color: "white" }}>
      <h4>Freunde suchen</h4>
      <input
        type="text"
        placeholder="Name eingeben"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ padding: "0.5rem", marginRight: "0.5rem" }}
      />
      <button onClick={handleSearch}>Suchen</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <ul>
        {results.map((user) => (
          <li key={user._id} style={{ margin: "0.5rem 0" }}>
            {user.name} ({user.email})
            <button
              style={{ marginLeft: "1rem" }}
              onClick={() => addFriend(user._id)}
            >
              ➕
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
