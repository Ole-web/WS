import jwt from "jsonwebtoken";

export default function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ msg: "Zugriff verweigert. Kein Token gefunden." });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("🧪 decoded JWT:", decoded); // <- das zeigt dir: { id: "..." }

    if (!decoded.id) {
      console.error("❌ decoded.id fehlt!");
      return res
        .status(401)
        .json({ msg: "Fehler beim Entschlüsseln des Tokens." });
    }

    req.userId = decoded.id;
    next();
  } catch (err) {
    console.error("❌ Fehler beim JWT decode:", err.message);
    res.status(401).json({ msg: "Token ungültig oder abgelaufen." });
  }
}
