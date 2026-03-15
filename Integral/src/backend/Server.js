import express from "express";
import mysql from "mysql2";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Valentino3101",
  database: "diagrama1",
});

db.connect((err) => {
  if (err) throw err;
  console.log("MySQL conectado");
});

// ───────────────────────────────────────────
// CLIENTES  (PK: id)
// ───────────────────────────────────────────

app.get("/clientes", (req, res) => {
  db.query("SELECT * FROM clientes", (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
});

app.post("/clientes", (req, res) => {
  const item = req.body;
  db.query("INSERT INTO clientes SET ?", item, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: result.insertId, ...item });
  });
});

app.put("/clientes/:id", (req, res) => {
  const { id } = req.params;
  const item = req.body;
  db.query("UPDATE clientes SET ? WHERE id = ?", [item, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id, ...item });
  });
});

app.delete("/clientes/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM clientes WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: id });
  });
});

// ───────────────────────────────────────────
// PRODUCTOS  (PK: id, codart es VARCHAR)
// ───────────────────────────────────────────

app.get("/productos", (req, res) => {
  db.query("SELECT * FROM productos", (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
});

app.post("/productos", (req, res) => {
  const item = req.body;
  db.query("INSERT INTO productos SET ?", item, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: result.insertId, ...item });
  });
});

app.put("/productos/:id", (req, res) => {
  const { id } = req.params;
  const item = req.body;
  db.query("UPDATE productos SET ? WHERE id = ?", [item, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id, ...item });
  });
});

app.delete("/productos/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM productos WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: id });
  });
});

// ───────────────────────────────────────────

app.listen(3001, () => {
  console.log("Servidor corriendo en puerto 3001");
});
