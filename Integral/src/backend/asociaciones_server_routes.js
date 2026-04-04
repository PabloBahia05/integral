// ───────────────────────────────────────────
// ASOCIACIONES
// Tabla: asociaciones
// Columnas: id, codart, articulo,
//           cod1,art1, cod2,art2, ... cod10,art10
// ───────────────────────────────────────────

app.get("/asociaciones", (req, res) => {
  db.query("SELECT * FROM asociaciones ORDER BY id", (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
});

app.post("/asociaciones", (req, res) => {
  const { id, ...item } = req.body;
  db.query("INSERT INTO asociaciones SET ?", item, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: result.insertId, ...item });
  });
});

app.put("/asociaciones/:id", (req, res) => {
  const { id } = req.params;
  const { id: _id, ...item } = req.body;
  db.query("UPDATE asociaciones SET ? WHERE id = ?", [item, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id, ...item });
  });
});

app.delete("/asociaciones/:id", (req, res) => {
  db.query("DELETE FROM asociaciones WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: req.params.id });
  });
});
