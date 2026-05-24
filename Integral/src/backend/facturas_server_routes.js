// ───────────────────────────────────────────────────────────────────────────
// FACTURAS  —  pegar en Server.js junto al resto de rutas
//
// Tablas reales:
//
//   facturas          → id, proveedor_id, numero, fecha, tipo_factura,
//                        condicion_pago, subtotal, iva, total, moneda,
//                        imagen_path, raw_json, creado_en
//
//   facturas_items    → id, factura_id, proveedor_id, fecha,
//                        codigo, descripcion, cantidad, precio_unit, subtotalprod
//
// El campo proveedor_id e fecha de facturas_items se desnormalizan para
// facilitar consultas directas sobre ítems sin JOIN; se toman de la cabecera.
// ───────────────────────────────────────────────────────────────────────────

// ── UPLOAD imagen de factura (Cloudinary, carpeta "facturas") ────────────────
app.post("/api/upload-imagen-factura", upload.single("imagen"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No se recibió imagen" });
  const stream = cloudinary.uploader.upload_stream(
    { folder: "facturas" },
    (error, result) => {
      if (error) return res.status(500).json({ error: "Error al subir imagen" });
      res.json({ url: result.secure_url });
    }
  );
  Readable.from(req.file.buffer).pipe(stream);
});

// ── OCR: manda la imagen al worker Python y guarda el resultado ─────────────
// Body (multipart): imagen (file), proveedor_id? (número)
// El worker devuelve: { factura: {...}, items: [...] }
app.post("/facturas/ocr", upload.single("imagen"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No se recibió imagen" });

  try {
    // 1. Subir imagen a Cloudinary
    const imagenUrl = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "facturas" },
        (err, result) => (err ? reject(err) : resolve(result.secure_url))
      );
      Readable.from(req.file.buffer).pipe(stream);
    });

    // 2. Mandar la imagen al worker Python (OCR)
    const FormData = (await import("form-data")).default;
    const fetch    = (await import("node-fetch")).default;

    const form = new FormData();
    form.append("imagen", req.file.buffer, {
      filename:    req.file.originalname,
      contentType: req.file.mimetype,
    });

    const ocrRes = await fetch("http://localhost:5001/ocr", {
      method:  "POST",
      body:    form,
      headers: form.getHeaders(),
    });

    if (!ocrRes.ok) {
      const txt = await ocrRes.text();
      return res.status(502).json({ error: "Error en worker OCR: " + txt });
    }

    const { factura: facturaOcr, items: itemsOcr } = await ocrRes.json();

    // 3. Insertar en tabla `facturas`
    const proveedorId = req.body.proveedor_id ? Number(req.body.proveedor_id) : null;
    const facturaRow = {
      proveedor_id:   proveedorId,
      numero:         facturaOcr.numero         ?? null,
      fecha:          facturaOcr.fecha          ?? null,
      tipo_factura:   facturaOcr.tipo_factura   ?? null,  // "A" | "B" | "C" | ...
      condicion_pago: facturaOcr.condicion_pago ?? null,
      subtotal:       facturaOcr.subtotal        ?? null,
      iva:            facturaOcr.iva             ?? null,  // importe $
      total:          facturaOcr.total           ?? null,
      moneda:         facturaOcr.moneda          ?? "ARS",
      imagen_path:    imagenUrl,
      raw_json:       JSON.stringify(facturaOcr),
    };

    db.query("INSERT INTO facturas SET ?", facturaRow, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      const facturaId = result.insertId;

      if (!itemsOcr || itemsOcr.length === 0) {
        return res.json({ facturaId, facturaRow, items: [] });
      }

      // 4. Insertar ítems — incluye proveedor_id y fecha desnormalizados
      const itemRows = itemsOcr.map((it) => [
        facturaId,
        proveedorId,                            // proveedor_id (de la cabecera)
        facturaOcr.fecha ?? null,               // fecha (de la cabecera)
        it.codigo       ?? null,
        it.descripcion  ?? null,
        parseFloat(it.cantidad)      || null,
        parseFloat(it.precio_unit)   || null,
        parseFloat(it.subtotalprod ?? it.subtotal) || null,
      ]);

      db.query(
        `INSERT INTO facturas_items
           (factura_id, proveedor_id, fecha, codigo, descripcion, cantidad, precio_unit, subtotalprod)
         VALUES ?`,
        [itemRows],
        (err2) => {
          if (err2) return res.status(500).json({ error: err2.message });
          res.json({ facturaId, facturaRow, items: itemRows });
        }
      );
    });
  } catch (e) {
    console.error("[/facturas/ocr]", e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── CRUD facturas ────────────────────────────────────────────────────────────

// Lista todas las facturas con nombre del proveedor
app.get("/facturas", (req, res) => {
  db.query(
    `SELECT f.*, p.provnombre AS proveedor_nombre
     FROM facturas f
     LEFT JOIN proveedor p ON p.id = f.proveedor_id
     ORDER BY f.id DESC`,
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(result);
    }
  );
});

// Una factura con sus ítems
app.get("/facturas/:id", (req, res) => {
  const { id } = req.params;
  db.query(
    `SELECT f.*, p.provnombre AS proveedor_nombre
     FROM facturas f
     LEFT JOIN proveedor p ON p.id = f.proveedor_id
     WHERE f.id = ? LIMIT 1`,
    [id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!rows.length) return res.status(404).json({ error: "No encontrada" });
      const factura = rows[0];
      db.query(
        "SELECT * FROM facturas_items WHERE factura_id = ? ORDER BY id",
        [id],
        (err2, items) => {
          if (err2) return res.status(500).json({ error: err2.message });
          res.json({ ...factura, items });
        }
      );
    }
  );
});

// Crear factura manualmente (sin OCR)
// Body: { proveedor_id, numero, fecha, tipo_factura, condicion_pago,
//         subtotal, iva, total, moneda, imagen_path?, items[] }
app.post("/facturas", (req, res) => {
  const { id, items, ...cabecera } = req.body;

  db.query("INSERT INTO facturas SET ?", cabecera, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    const facturaId = result.insertId;

    if (!items || items.length === 0) {
      return res.json({ id: facturaId, ...cabecera, items: [] });
    }

    // Desnormalizar proveedor_id y fecha en los ítems
    const rows = items.map((it) => [
      facturaId,
      cabecera.proveedor_id ?? null,
      cabecera.fecha        ?? null,
      it.codigo       ?? null,
      it.descripcion  ?? null,
      parseFloat(it.cantidad)      || null,
      parseFloat(it.precio_unit)   || null,
      parseFloat(it.subtotalprod)  || null,
    ]);

    db.query(
      `INSERT INTO facturas_items
         (factura_id, proveedor_id, fecha, codigo, descripcion, cantidad, precio_unit, subtotalprod)
       VALUES ?`,
      [rows],
      (err2) => {
        if (err2) return res.status(500).json({ error: err2.message });
        res.json({ id: facturaId, ...cabecera });
      }
    );
  });
});

// Editar cabecera de factura
app.put("/facturas/:id", (req, res) => {
  const { id } = req.params;
  const { id: _id, items, ...cabecera } = req.body;
  db.query("UPDATE facturas SET ? WHERE id = ?", [cabecera, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id, ...cabecera });
  });
});

// Eliminar factura + sus ítems
app.delete("/facturas/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM facturas_items WHERE factura_id = ?", [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    db.query("DELETE FROM facturas WHERE id = ?", [id], (err2) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ deleted: id });
    });
  });
});

// ── CRUD facturas_items ───────────────────────────────────────────────────────

app.get("/facturas-items/:factura_id", (req, res) => {
  db.query(
    "SELECT * FROM facturas_items WHERE factura_id = ? ORDER BY id",
    [req.params.factura_id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(result);
    }
  );
});

app.post("/facturas-items", (req, res) => {
  const { id, ...item } = req.body;
  db.query("INSERT INTO facturas_items SET ?", item, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: result.insertId, ...item });
  });
});

app.put("/facturas-items/:id", (req, res) => {
  const { id } = req.params;
  const { id: _id, ...item } = req.body;
  db.query("UPDATE facturas_items SET ? WHERE id = ?", [item, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id, ...item });
  });
});

app.delete("/facturas-items/:id", (req, res) => {
  db.query("DELETE FROM facturas_items WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: req.params.id });
  });
});
