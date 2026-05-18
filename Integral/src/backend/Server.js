import express from "express";
import mysql from "mysql2";
import cors from "cors";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { Readable } from "stream";
import dotenv from "dotenv";

import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const app = express();

app.use(cors());
app.use(express.json());

console.log("Buscando .env en:", path.resolve(__dirname, "../../.env"));
console.log("CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME);

// ───────────────────────────────────────────
// CLOUDINARY
// ───────────────────────────────────────────

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ storage: multer.memoryStorage() });

app.post("/api/upload-imagen", upload.single("imagen"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No se recibió imagen" });

  console.log("=== UPLOAD LLAMADO ===");
  console.log("Cloud name:", process.env.CLOUDINARY_CLOUD_NAME);
  console.log("API Key:", process.env.CLOUDINARY_API_KEY);
  console.log(
    "Secret:",
    process.env.CLOUDINARY_API_SECRET ? "✓ definido" : "❌ FALTA",
  );

  const stream = cloudinary.uploader.upload_stream(
    { folder: "productos" },
    (error, result) => {
      if (error) {
        console.error(
          "=== ERROR CLOUDINARY COMPLETO ===",
          JSON.stringify(error, null, 2),
        );
        return res.status(500).json({ error: "Error al subir imagen" });
      }
      res.json({ url: result.secure_url });
    },
  );

  Readable.from(req.file.buffer).pipe(stream);
});

// ───────────────────────────────────────────
// MYSQL
// ───────────────────────────────────────────

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "Valentino3101",
  database: "diagrama1",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

db.query("SELECT 1", (err) => {
  if (err) throw err;
  console.log("MySQL conectado");
});

// ───────────────────────────────────────────
// CLIENTES  (PK: id)
// ───────────────────────────────────────────

// Búsqueda de clientes solo por nombre (LIKE) — para el campo Cliente
// ⚠️ DEBE ir ANTES de /:id
// Helper: fecha+hora actual en formato MySQL (YYYY-MM-DD HH:MM:SS)
const ahora = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

app.get("/clientes/buscar-nombre", (req, res) => {
  const { q } = req.query;
  if (!q || !q.trim()) return res.json([]);
  const like = `%${q.trim()}%`;
  db.query(
    `SELECT * FROM clientes
     WHERE nombre LIKE ?
     ORDER BY nombre
     LIMIT 10`,
    [like],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(result);
    },
  );
});

// Búsqueda de clientes por telefono1, telefono2 o wapp (LIKE) — para el campo Teléfono
// ⚠️ DEBE ir ANTES de /:id
app.get("/clientes/buscar-telefono", (req, res) => {
  const { q } = req.query;
  if (!q || !q.trim()) return res.json([]);
  const like = `%${q.trim()}%`;
  db.query(
    `SELECT * FROM clientes
     WHERE telefono1 LIKE ?
        OR telefono2 LIKE ?
        OR wapp      LIKE ?
     ORDER BY nombre
     LIMIT 10`,
    [like, like, like],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(result);
    },
  );
});

// Búsqueda combinada nombre + teléfonos — mantener por compatibilidad
app.get("/clientes/buscar", (req, res) => {
  const { q } = req.query;
  if (!q || !q.trim()) return res.json([]);
  const like = `%${q.trim()}%`;
  db.query(
    `SELECT * FROM clientes
     WHERE nombre    LIKE ?
        OR telefono1 LIKE ?
        OR telefono2 LIKE ?
        OR wapp      LIKE ?
     ORDER BY nombre
     LIMIT 10`,
    [like, like, like, like],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(result);
    },
  );
});

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
// ARTICULOS  (tabla real: articulos)
// Expuesto como /productos para compatibilidad con el frontend
// Columnas: id, codartint, articulo, area, artfoto, precio,
//           cantidad, ancho, alto, linea, color
// ───────────────────────────────────────────

// Total de artículos — DEBE ir ANTES de /:id para que Express no confunda "count" con un id
app.get("/productos/count", (req, res) => {
  const { search, articulo, familia, rubro } = req.query;
  let sql = "SELECT COUNT(*) as total FROM articulos WHERE 1=1";
  let params = [];
  if (search) {
    sql += " AND articulo LIKE ?";
    params.push(`%${search}%`);
  }
  if (articulo) {
    sql += " AND UPPER(articulo) LIKE ?";
    params.push(`%${articulo.toUpperCase()}%`);
  }
  if (familia) {
    sql += " AND familia = ?";
    params.push(familia);
  }
  if (rubro && rubro.toUpperCase() !== "GENERAL") {
    sql += " AND rubro = ?";
    params.push(rubro);
  }
  db.query(sql, params, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ total: result[0].total });
  });
});

app.get("/productos", (req, res) => {
  const { page, limit, search, familia, rubro, area, articulo } = req.query;
  let sql = "SELECT * FROM articulos WHERE 1=1";
  let params = [];

  if (search) {
    sql += " AND articulo LIKE ?";
    params.push(`%${search}%`);
  }
  if (articulo) {
    sql += " AND UPPER(articulo) LIKE ?";
    params.push(`%${articulo.toUpperCase()}%`);
  }
  if (familia) {
    sql += " AND familia = ?";
    params.push(familia);
  }
  if (rubro) {
    sql += " AND rubro = ?";
    params.push(rubro);
  }
  if (area) {
    sql += " AND area = ?";
    params.push(parseInt(area));
  }

  sql += " ORDER BY articulo";

  if (page && limit) {
    const offset = (parseInt(page) - 1) * parseInt(limit);
    sql += " LIMIT ? OFFSET ?";
    params.push(parseInt(limit), offset);
  }

  db.query(sql, params, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
});

// Artículos agrupados por nombre base (sin Nº XX) con precios por línea
// Usado en cocina/placard para el autocomplete con columnas de precios
app.get("/articulos/por-familia", (req, res) => {
  const { familia } = req.query;
  if (!familia) return res.status(400).json({ error: "familia requerida" });

  // Primero intentar con campo 'linea', si no existe usar SUBSTRING(codartint,1,2)
  const sql = `
    SELECT 
      articulo,
      COALESCE(linea, CAST(SUBSTRING(codartint, 1, 2) AS UNSIGNED)) AS linea,
      precio
    FROM articulos
    WHERE (familia = ? OR familia LIKE ?)
    ORDER BY articulo
  `;
  db.query(sql, [familia, `%${familia}%`], (err, rows) => {
    if (err) {
      console.error("Error en /articulos/por-familia:", err.message);
      // Fallback sin campo linea
      const sql2 = `
        SELECT articulo,
               CAST(SUBSTRING(codartint, 1, 2) AS UNSIGNED) AS linea,
               precio
        FROM articulos
        WHERE (familia = ? OR familia LIKE ?)
        ORDER BY articulo
      `;
      return db.query(sql2, [familia, `%${familia}%`], (err2, rows2) => {
        if (err2) return res.status(500).json({ error: err2.message });
        if (rows2.length)
          console.log(
            "DEBUG articulo[0]:",
            JSON.stringify(rows2[0].articulo),
            "charCodes:",
            [...rows2[0].articulo].slice(-6).map((c) => c.charCodeAt(0)),
          );
        return res.json(agrupar(rows2));
      });
    }
    if (rows.length)
      console.log(
        "DEBUG articulo[0]:",
        JSON.stringify(rows[0].articulo),
        "charCodes:",
        [...rows[0].articulo].slice(-6).map((c) => c.charCodeAt(0)),
      );
    res.json(agrupar(rows));
  });
});

// Separador exacto: espacio + N + º (C2 BA en UTF-8) + espacio
const SUFIJO_NRO = " N\u00BA "; // " Nº "

function agrupar(rows) {
  const grupos = {};
  rows.forEach((r) => {
    const articulo = String(r.articulo ?? "");
    // Cortar antes del último " Nº " (usando el caracter exacto U+00BA)
    const idx = articulo.lastIndexOf(SUFIJO_NRO);
    const base = (idx > 0 ? articulo.substring(0, idx) : articulo).trim();
    if (!base) return;
    if (!grupos[base]) grupos[base] = { articulo: base, precios: {} };
    if (r.linea != null) grupos[base].precios[String(r.linea)] = r.precio;
  });
  return Object.values(grupos);
}

// Valores distintos de la columna 'linea' de articulos (para selector en Presupuesto Nuevo)
app.get("/articulos/lineas", (req, res) => {
  db.query(
    `SELECT DISTINCT linea FROM articulos
     WHERE linea IS NOT NULL AND TRIM(linea) != ''
     ORDER BY linea`,
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(result.map((r) => r.linea).filter(Boolean));
    },
  );
});

// Familias únicas de un rubro específico (para el filtro dependiente en Productos)
app.get("/articulos/familias-por-rubro", (req, res) => {
  const { rubro } = req.query;
  if (!rubro) return res.status(400).json({ error: "rubro requerido" });
  // GENERAL aplica a todos → devolver todas las familias
  const sql = rubro.toUpperCase() === "GENERAL"
    ? "SELECT DISTINCT familia FROM articulos WHERE familia IS NOT NULL AND TRIM(familia) != '' ORDER BY familia"
    : "SELECT DISTINCT familia FROM articulos WHERE rubro = ? AND familia IS NOT NULL AND TRIM(familia) != '' ORDER BY familia";
  const params = rubro.toUpperCase() === "GENERAL" ? [] : [rubro];
  db.query(sql, params, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result.map((r) => r.familia).filter(Boolean));
  });
});

// Todas las familias únicas (para selector en Productos)
app.get("/articulos/familias-todas", (req, res) => {
  db.query(
    "SELECT DISTINCT familia FROM articulos WHERE familia IS NOT NULL AND TRIM(familia) != '' ORDER BY familia",
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(result.map((r) => r.familia).filter(Boolean));
    },
  );
});

// Rubros únicos de articulos
app.get("/articulos/rubros", (req, res) => {
  db.query(
    `SELECT DISTINCT rubro FROM articulos
     WHERE rubro IS NOT NULL AND TRIM(rubro) != ''
     ORDER BY rubro`,
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(result.map((r) => r.rubro).filter(Boolean));
    },
  );
});

// Rubro de un codartint específico (para precargar al editar fórmula)
app.get("/articulos/rubro-de", (req, res) => {
  const { codart } = req.query;
  if (!codart) return res.status(400).json({ error: "codart requerido" });
  db.query(
    "SELECT rubro FROM articulos WHERE codartint = ? LIMIT 1",
    [codart],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ rubro: result.length ? result[0].rubro : null });
    },
  );
});

// Artículos filtrados por rubro y/o familia (codartint + articulo + precio)
app.get("/articulos/por-rubro", (req, res) => {
  const { rubro, familia } = req.query;
  if (!rubro && !familia)
    return res.status(400).json({ error: "rubro o familia requerido" });

  let sql = "SELECT codartint, codartint AS codart, articulo, precio FROM articulos WHERE 1=1";
  const params = [];

  if (rubro) {
    sql += " AND rubro = ?";
    params.push(rubro);
  }
  if (familia) {
    sql += " AND familia = ?";
    params.push(familia);
  }

  sql += " ORDER BY articulo";

  db.query(sql, params, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
});

// Bisagras para vanitory
app.get("/productos/bisagras-vanitory", (req, res) => {
  db.query(
    `SELECT * FROM articulos WHERE UPPER(articulo) LIKE '%BISAGRA%' ORDER BY articulo`,
    (err, result) => {
      if (err) { console.error("[bisagras-vanitory] Error SQL:", err.message); return res.status(500).json({ error: err.message }); }
      res.json(result);
    }
  );
});

// Guías para vanitory: columna articulo contiene "GUIAS TELESCOPICAS"
app.get("/productos/guias-vanitory", (req, res) => {
  db.query(
    `SELECT * FROM articulos
     WHERE UPPER(articulo) LIKE '%GUIA TELESCOPICA%'
     ORDER BY articulo`,
    (err, result) => {
      if (err) {
        console.error("[guias-vanitory] Error SQL:", err.message);
        return res.status(500).json({ error: err.message });
      }
      console.log("[guias-vanitory] Resultados:", result.length);
      res.json(result);
    },
  );
});

// Placas para vanitory: columna articulo contiene "PLACA", proveedor != DANIEL ROQUE SRL
app.get("/productos/placas-vanitory", (req, res) => {
  db.query(
`SELECT *, precio_un FROM articulos
     WHERE UPPER(TRIM(familia)) LIKE '%INSUMO AMOBLAMIENTOS%'
       AND UPPER(articulo) LIKE '%PLACA%'
       AND UPPER(TRIM(proveedor)) != 'DANIEL ROQUE SRL'
       AND area = 2
     ORDER BY articulo`,
    (err, result) => {
      if (err) {
        console.error("[placas-vanitory] Error SQL:", err.message);
        return res.status(500).json({ error: err.message });
      }
      console.log("[placas-vanitory] Resultados:", result.length);
      res.json(result);
    },
  );
});

// Artículos familia "INSUMO AMOBLAMIENTOS" y proveedor "AGLOLAM S.A." — para presupuesto wall panel
app.get("/productos/wall-panel", (req, res) => {
  db.query(
`SELECT *, precio_un FROM articulos
     WHERE UPPER(TRIM(familia)) LIKE '%INSUMO AMOBLAMIENTOS%'
       AND UPPER(TRIM(proveedor)) = 'AGLOLAM S.A.'
       AND area = 2
     ORDER BY articulo`,
    (err, result) => {
      if (err) {
        console.error("[wall-panel] Error SQL:", err.message);
        return res.status(500).json({ error: err.message });
      }
      console.log("[wall-panel] Resultados:", result.length);
      res.json(result);
    }
  );
});

// Artículos con familia/rubro MAMPARA y proveedor DANIEL ROQUE SRL — para presupuesto mamparas
app.get("/productos/mamparas", (req, res) => {
  db.query(
    `SELECT * FROM articulos
     WHERE (UPPER(familia) LIKE '%MAMPARA%' OR UPPER(rubro) LIKE '%MAMPARA%')
       AND UPPER(proveedor) = 'DANIEL ROQUE SRL'
     ORDER BY familia, articulo`,
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(result);
    },
  );
});

// Familias distintas de artículos tipo mampara (para debug)
app.get("/productos/mamparas/familias", (req, res) => {
  db.query(
    `SELECT DISTINCT familia FROM articulos
     WHERE (UPPER(familia) LIKE '%MAMPARA%' OR UPPER(rubro) LIKE '%MAMPARA%')
       AND UPPER(proveedor) = 'DANIEL ROQUE SRL'
     ORDER BY familia`,
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(result.map((r) => r.familia));
    },
  );
});

// Buscar un artículo por codartint — usado por el frontend para resolver precio_XXXX en fórmulas
// ⚠️ DEBE ir DESPUÉS de todas las rutas /articulos/xxx estáticas para que Express no las confunda
app.get("/articulos/:cod", (req, res) => {
  const { cod } = req.params;
  db.query(
    "SELECT * FROM articulos WHERE codartint = ? LIMIT 1",
    [cod],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!result.length)
        return res.status(404).json({ error: "No encontrado" });
      res.json(result[0]);
    },
  );
});

app.post("/productos", (req, res) => {
  const { id, ...item } = req.body; // excluir id para que MySQL lo autogenere
  db.query("INSERT INTO articulos SET ?", item, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: result.insertId, ...item });
  });
});

app.put("/productos/:id", (req, res) => {
  const { id } = req.params;
  const { id: _id, ...item } = req.body;
  console.log(`PUT /productos/${id}`, item);
  db.query("UPDATE articulos SET ? WHERE id = ?", [item, id], (err) => {
    if (err) {
      console.error("Error UPDATE articulos:", err.message);
      return res.status(500).json({ error: err.message });
    }
    console.log(`Updated articulo id=${id} OK`);
    res.json({ id, ...item });
  });
});

app.delete("/productos/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM articulos WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: id });
  });
});

// ───────────────────────────────────────────
// MARGEN
// ───────────────────────────────────────────
// Buscar margen por codart EXACTO — para presupuestos
app.get("/margen/por-codart", (req, res) => {
  const { codart } = req.query;
  if (!codart) return res.status(400).json({ error: "codart requerido" });
  db.query(
    "SELECT * FROM MARGEN WHERE TRIM(LOWER(CODART)) = TRIM(LOWER(?)) LIMIT 1",
    [codart],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(result.length ? result[0] : null);
    },
  );
});

// Búsqueda en tabla MARGEN (para insertor en Fórmulas)
app.get("/margen/buscar", (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: "q requerido" });
  db.query(
    "SELECT * FROM MARGEN WHERE ARTICULO LIKE ? OR CODART LIKE ? ORDER BY ARTICULO LIMIT 15",
    [`%${q}%`, `%${q}%`],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(result);
    },
  );
});

app.get("/margen", (req, res) => {
  db.query("SELECT * FROM MARGEN ORDER BY id", (err, r) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(r);
  });
});
app.post("/margen", (req, res) => {
  const { id, ...item } = req.body;
  db.query("INSERT INTO MARGEN SET ?", item, (err, r) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: r.insertId, ...item });
  });
});
app.put("/margen/:id", (req, res) => {
  const { id } = req.params;
  const { id: _id, ...item } = req.body;
  db.query("UPDATE MARGEN SET ? WHERE id = ?", [item, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id, ...item });
  });
});
app.delete("/margen/:id", (req, res) => {
  db.query("DELETE FROM MARGEN WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: req.params.id });
  });
});

// ───────────────────────────────────────────
// VANITORY TIPOS
// ───────────────────────────────────────────
// Buscar artículos por nombre (para el selector en TiposVanitory)
app.get("/vanitory-tipos/buscar-articulo", (req, res) => {
  const { q } = req.query;
  if (!q || !q.trim()) return res.json([]);
  const like = `%${q.trim()}%`;
  db.query(
    `SELECT id, codartint, articulo, rubro, artfoto
     FROM articulos
     WHERE articulo LIKE ?
     ORDER BY articulo
     LIMIT 20`,
    [like],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(result);
    }
  );
});

app.get("/vanitory-tipos", (req, res) => {
  db.query("SELECT * FROM vanitory_tipos ORDER BY id", (err, r) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(r);
  });
});
app.post("/vanitory-tipos", (req, res) => {
  const { id, ...item } = req.body;
  db.query("INSERT INTO vanitory_tipos SET ?", item, (err, r) => {
    if (err) return res.status(500).json({ error: err.message });
    const newId = r.insertId;

    // También insertar en articulos
    const articulo = {
      codartint: item.codtipvan ?? "",
      articulo: item.nombre ?? "",
      rubro: item.rubro ?? "",
      artfoto: item.foto ?? "",
      precio: 0,
      cantidad: 0,
    };
    db.query("INSERT INTO articulos SET ?", articulo, (err2) => {
      if (err2) console.error("Error insertando en articulos:", err2.message);
    });

    res.json({ id: newId, ...item });
  });
});

app.put("/vanitory-tipos/:id", (req, res) => {
  const { id } = req.params;
  const { id: _id, ...item } = req.body;
  db.query("UPDATE vanitory_tipos SET ? WHERE id = ?", [item, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });

    // También actualizar en articulos por codart
    const artUpdate = {
      articulo: item.nombre ?? "",
      rubro: item.rubro ?? "",
      artfoto: item.foto ?? "",
    };
    db.query(
      "UPDATE articulos SET ? WHERE codartint = ?",
      [artUpdate, item.codtipvan],
      (err2) => {
        if (err2) console.error("Error actualizando articulos:", err2.message);
      },
    );

    res.json({ id, ...item });
  });
});
app.delete("/vanitory-tipos/:id", (req, res) => {
  db.query(
    "DELETE FROM vanitory_tipos WHERE id = ?",
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ deleted: req.params.id });
    },
  );
});

// ───────────────────────────────────────────
// ESCRITORIO TIPOS
// ───────────────────────────────────────────
// Buscar artículos por nombre (para el selector en TiposEscritorio)
app.get("/escritorio-tipos/buscar-articulo", (req, res) => {
  const { q } = req.query;
  if (!q || !q.trim()) return res.json([]);
  const like = `%${q.trim()}%`;
  db.query(
    `SELECT id, codartint, articulo, rubro, artfoto
     FROM articulos
     WHERE articulo LIKE ?
     ORDER BY articulo
     LIMIT 20`,
    [like],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(result);
    }
  );
});

app.get("/escritorio-tipos", (req, res) => {
  db.query("SELECT * FROM escritorio_tipos ORDER BY id", (err, r) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(r);
  });
});
app.post("/escritorio-tipos", (req, res) => {
  const { id, ...item } = req.body;
  db.query("INSERT INTO escritorio_tipos SET ?", item, (err, r) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: r.insertId, ...item });
  });
});
app.put("/escritorio-tipos/:id", (req, res) => {
  const { id } = req.params;
  const { id: _id, ...item } = req.body;
  db.query("UPDATE escritorio_tipos SET ? WHERE id = ?", [item, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id, ...item });
  });
});
app.delete("/escritorio-tipos/:id", (req, res) => {
  db.query(
    "DELETE FROM escritorio_tipos WHERE id = ?",
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ deleted: req.params.id });
    },
  );
});

// ───────────────────────────────────────────
// DESPENSERO TIPOS
// ───────────────────────────────────────────

// Buscar artículos por nombre (para el selector en TiposDespensero)
app.get("/despensero-tipos/buscar-articulo", (req, res) => {
  const { q } = req.query;
  if (!q || !q.trim()) return res.json([]);
  const like = `%${q.trim()}%`;
  db.query(
    `SELECT id, codartint, articulo, rubro, artfoto
     FROM articulos
     WHERE articulo LIKE ?
     ORDER BY articulo
     LIMIT 20`,
    [like],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(result);
    }
  );
});

app.get("/despensero-tipos", (req, res) => {
  db.query("SELECT * FROM despensero_tipos ORDER BY id", (err, r) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(r);
  });
});
app.post("/despensero-tipos", (req, res) => {
  const { id, ...item } = req.body;
  db.query("INSERT INTO despensero_tipos SET ?", item, (err, r) => {
    if (err) return res.status(500).json({ error: err.message });
    const newId = r.insertId;

    // Sincronizar con articulos: insertar si no existe ya un registro con ese codartint
    if (item.codtipdes) {
      db.query(
        "SELECT id FROM articulos WHERE codartint = ? LIMIT 1",
        [item.codtipdes],
        (err2, existing) => {
          if (!err2 && existing.length === 0) {
            const articulo = {
              codartint: item.codtipdes,
              articulo:  item.nombre ?? "",
              rubro:     item.rubro  ?? "",
              artfoto:   item.foto   ?? "",
              precio:    0,
              cantidad:  0,
            };
            db.query("INSERT INTO articulos SET ?", articulo, (err3) => {
              if (err3) console.error("Error insertando en articulos:", err3.message);
            });
          }
        }
      );
    }

    res.json({ id: newId, ...item });
  });
});
app.put("/despensero-tipos/:id", (req, res) => {
  const { id } = req.params;
  const { id: _id, ...item } = req.body;
  db.query("UPDATE despensero_tipos SET ? WHERE id = ?", [item, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });

    // Sincronizar nombre/rubro/foto en articulos por codartint
    if (item.codtipdes) {
      const artUpdate = {
        articulo: item.nombre ?? "",
        rubro:    item.rubro  ?? "",
        artfoto:  item.foto   ?? "",
      };
      db.query(
        "UPDATE articulos SET ? WHERE codartint = ?",
        [artUpdate, item.codtipdes],
        (err2) => {
          if (err2) console.error("Error actualizando articulos:", err2.message);
        }
      );
    }

    res.json({ id, ...item });
  });
});
app.delete("/despensero-tipos/:id", (req, res) => {
  db.query(
    "DELETE FROM despensero_tipos WHERE id = ?",
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ deleted: req.params.id });
    },
  );
});

// ───────────────────────────────────────────
// FORMULAS  (CRUD completo)
// ───────────────────────────────────────────

app.get("/formulas", (req, res) => {
  db.query("SELECT * FROM FORMULAS ORDER BY id", (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
});

app.post("/formulas", (req, res) => {
  const { id, ...item } = req.body;
  // 1. Verificar que codform no exista ya
  db.query(
    "SELECT id FROM FORMULAS WHERE codform = ? LIMIT 1",
    [item.codform],
    (err, existing) => {
      if (err) return res.status(500).json({ error: err.message });
      if (existing.length > 0) {
        return res.status(409).json({
          error: `El código "${item.codform}" ya existe. Usá un código distinto.`,
        });
      }
      // 2. No existe — insertar
      db.query("INSERT INTO FORMULAS SET ?", item, (err2, result) => {
        if (err2) return res.status(500).json({ error: err2.message });
        res.json({ id: result.insertId, ...item });
      });
    },
  );
});

app.put("/formulas/:id", (req, res) => {
  const { id } = req.params;
  const { id: _id, ...item } = req.body;
  db.query("UPDATE FORMULAS SET ? WHERE id = ?", [item, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id, ...item });
  });
});

app.delete("/formulas/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM FORMULAS WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: id });
  });
});

// ───────────────────────────────────────────
// CALCULAR FORMULA (desde MAMPARAS_TIPOS)
// ───────────────────────────────────────────

// Calcula vidrio, heraje y total usando las fórmulas de MAMPARAS_TIPOS
// Verifica sintaxis de una fórmula con valores de prueba
// Body: { formula, variables, codart_modelo? }
app.post("/formulas/verificar", (req, res) => {
  const { formula, variables = {}, codart_modelo } = req.body;
  if (!formula) return res.status(400).json({ error: "Fórmula vacía." });

  const evaluar = (expr, vars) => {
    let e = expr;
    const keys = Object.keys(vars).sort((a, b) => b.length - a.length);
    for (const key of keys) {
      e = e.replace(
        new RegExp("\b" + key + "\b", "gi"),
        parseFloat(vars[key]) || 0,
      );
    }
    return parseFloat(
      Function('"use strict"; return (' + e + ")")().toFixed(2),
    );
  };

  // Detectar variables precio_CODART / ancho_CODART etc.
  const varsMatch = [
    ...formula.matchAll(/(?:precio|ancho|alto|cantidad)_([A-Za-z0-9]+)/g),
  ];
  const codartRefs = [...new Set(varsMatch.map((m) => m[1]))];

  const ejecutar = (extraVars) => {
    const vars = { ...variables, ...extraVars };
    try {
      const resultado = evaluar(formula, vars);
      return res.json({ resultado, formula, variables: vars });
    } catch (e) {
      return res.status(400).json({ error: "Error de sintaxis: " + e.message });
    }
  };

  if (codartRefs.length > 0) {
    const placeholders = codartRefs.map(() => "?").join(",");
    db.query(
      `SELECT codartint, precio, ancho, alto, cantidad FROM articulos WHERE codartint IN (${placeholders})`,
      codartRefs,
      (err, rows) => {
        if (err) return ejecutar({});
        const extra = {};
        rows.forEach((r) => {
          extra[`precio_${r.codartint}`] = parseFloat(r.precio) || 0;
          extra[`ancho_${r.codartint}`] = parseFloat(r.ancho) || 0;
          extra[`alto_${r.codartint}`] = parseFloat(r.alto) || 0;
          extra[`cantidad_${r.codartint}`] = parseFloat(r.cantidad) || 0;
          extra[`margen_${r.codartint}`] = 0;
        });
        // Also fetch margen
        db.query(
          `SELECT CODART, MARGEN FROM MARGEN WHERE CODART IN (${placeholders})`,
          codartRefs,
          (err2, margenRows) => {
            if (!err2) {
              margenRows.forEach((r) => {
                const val = r.MARGEN
                  ? parseFloat(String(r.MARGEN).replace("%", "").trim()) || 0
                  : 0;
                extra[`margen_${r.CODART}`] = val;
              });
            }
            ejecutar(extra);
          },
        );
      },
    );
  } else {
    ejecutar({});
  }
});

// Calcula usando fórmula vinculada al codart del modelo seleccionado
// Body: { codart_modelo, variables, codform? }
// Si viene codform → busca la fórmula directamente por codform (para múltiples fórmulas)
// Si no → busca por codart_modelo como siempre
app.post("/formulas/calcular", (req, res) => {
  const { codart_modelo, codform, variables = {} } = req.body;

  if (!codart_modelo)
    return res.status(400).json({ error: "codart_modelo es requerido" });

  // 1. Buscar la fórmula: por codform si viene, sino por codart
  const query = codform
    ? "SELECT f.formula, f.codform, f.codart FROM FORMULAS f WHERE f.codform = ? LIMIT 1"
    : "SELECT f.formula, f.codform, f.codart FROM FORMULAS f WHERE f.codart = ? LIMIT 1";
  const param = codform ? codform : codart_modelo;

  db.query(query, [param], (err, fResult) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!fResult.length) {
      return res.status(404).json({
        error: codform
          ? `No existe la fórmula "${codform}".`
          : `No hay fórmula configurada para el artículo ${codart_modelo}. Configurala en Ver Tablas → Fórmulas.`,
      });
    }

    const formulaExpr = fResult[0].formula;

    // 2. Buscar precio del artículo en tabla articulos
    db.query(
      "SELECT precio, articulo FROM articulos WHERE codartint = ? LIMIT 1",
      [codart_modelo],
      (err2, aResult) => {
        if (err2) return res.status(500).json({ error: err2.message });

        const precio_bd = aResult.length
          ? parseFloat(aResult[0].precio) || 0
          : 0;
        // Si el frontend ya envió precio_vidrio (ajustado por incoloro/esmerilado), usarlo
        // Si no, usar el precio de la BD
        const precio_vidrio =
          variables.precio_vidrio != null
            ? parseFloat(variables.precio_vidrio)
            : precio_bd;
        const articulo_nombre = aResult.length
          ? aResult[0].articulo
          : codart_modelo;

        // 3. Detectar variables campo_CODART en la fórmula
        const varsMatch = [
          ...formulaExpr.matchAll(
            /\b(?:precio|ancho|alto|cantidad|margen)_([A-Za-z0-9]+)\b/g,
          ),
        ];
        const codartReferences = [...new Set(varsMatch.map((m) => m[1]))];

        // 4. Buscar precios de todos los codart referenciados
        const fetchPreciosCodart = (codarts, callback) => {
          if (codarts.length === 0) return callback({});
          const placeholders = codarts.map(() => "?").join(",");
          // Fetch articulos data
          db.query(
            `SELECT codartint, precio, ancho, alto, cantidad FROM articulos WHERE codartint IN (${placeholders})`,
            codarts,
            (err3, rows) => {
              if (err3) return callback({});
              const map = {};
              rows.forEach((r) => {
                map[r.codartint] = {
                  precio: parseFloat(r.precio) || 0,
                  ancho: parseFloat(r.ancho) || 0,
                  alto: parseFloat(r.alto) || 0,
                  cantidad: parseFloat(r.cantidad) || 0,
                  margen: 0, // will be overwritten if found in MARGEN table
                };
              });
              // Also fetch margen from MARGEN table
              db.query(
                `SELECT CODART, MARGEN FROM MARGEN WHERE CODART IN (${placeholders})`,
                codarts,
                (err4, margenRows) => {
                  if (!err4) {
                    margenRows.forEach((r) => {
                      const val = r.MARGEN
                        ? parseFloat(
                            String(r.MARGEN).replace("%", "").trim(),
                          ) || 0
                        : 0;
                      if (map[r.CODART]) map[r.CODART].margen = val;
                      else
                        map[r.CODART] = {
                          precio: 0,
                          ancho: 0,
                          alto: 0,
                          cantidad: 0,
                          margen: val,
                        };
                    });
                  }
                  callback(map);
                },
              );
            },
          );
        };

        fetchPreciosCodart(codartReferences, (preciosMap) => {
          // Construir variables: precio_vidrio + campo_CODART para cada artículo referenciado
          const vars = { ...variables, precio_vidrio, precio: precio_vidrio };
          for (const [codart, row] of Object.entries(preciosMap)) {
            vars[`precio_${codart}`] = row.precio ?? 0;
            vars[`ancho_${codart}`] = row.ancho ?? 0;
            vars[`alto_${codart}`] = row.alto ?? 0;
            vars[`cantidad_${codart}`] = row.cantidad ?? 0;
            vars[`margen_${codart}`] = row.margen ?? 0;
          }

          const evaluar = (expr) => {
            let e = expr;
            const keys = Object.keys(vars).sort((a, b) => b.length - a.length);
            for (const key of keys) {
              e = e.replace(
                new RegExp("\\b" + key + "\\b", "gi"),
                parseFloat(vars[key]) || 0,
              );
            }
            return parseFloat(
              Function('"use strict"; return (' + e + ")")().toFixed(2),
            );
          };

          try {
            const resultado = evaluar(formulaExpr);
            return res.json({
              resultado,
              formula: formulaExpr,
              precio_vidrio,
              articulo: articulo_nombre,
              precios_usados: vars,
            });
          } catch (e) {
            return res
              .status(400)
              .json({ error: "Error al evaluar la fórmula: " + e.message });
          }
        });
      },
    );
  });
});

// ───────────────────────────────────────────
// COLOCACION
// Tabla: colocacion (id, codart, articulo, precio)
// ───────────────────────────────────────────

// Buscar por codart exacto — para precargar en presupuesto
app.get("/colocacion/buscar", (req, res) => {
  const { codart } = req.query;
  if (!codart) return res.status(400).json({ error: "codart requerido" });
  db.query(
    "SELECT * FROM colocacion WHERE codart = ? LIMIT 1",
    [codart],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(result.length ? result[0] : { precio: null });
    },
  );
});

app.get("/colocacion", (req, res) => {
  db.query("SELECT * FROM colocacion ORDER BY id", (err, r) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(r);
  });
});

app.post("/colocacion", (req, res) => {
  const { id, ...item } = req.body;
  db.query("INSERT INTO colocacion SET ?", item, (err, r) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: r.insertId, ...item });
  });
});

app.put("/colocacion/:id", (req, res) => {
  const { id } = req.params;
  const { id: _id, ...item } = req.body;
  db.query("UPDATE colocacion SET ? WHERE id = ?", [item, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id, ...item });
  });
});

app.delete("/colocacion/:id", (req, res) => {
  db.query("DELETE FROM colocacion WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: req.params.id });
  });
});

// ───────────────────────────────────────────
// PRESUPUESTOS_MAMPARAS
//
// Modelo de revisiones:
//   - Cada guardado inserta una nueva fila en PRESUPUESTOS_MAMPARAS.
//   - Los presupuestos del mismo número comparten el campo NUMERO.
//   - REVISION se incrementa por cada guardado posterior.
//   - La fila más reciente (mayor REVISION) es la vigente.
//
// Columnas de PRESUPUESTOS_MAMPARAS:
//   id, NUMERO, NOMBRE, FECHA, CANTIDAD, MODELO, ANCHO, ALTO,
//   VIDRIO, COLOCACION, PRECIO, REVISION,
//   art1..art10, valor1..valor10
//
// SQL para agregar columnas faltantes (ejecutar una vez si es necesario):
//   ALTER TABLE PRESUPUESTOS_MAMPARAS
//     ADD COLUMN IF NOT EXISTS NUMERO INT DEFAULT NULL,
//     ADD COLUMN IF NOT EXISTS art1 VARCHAR(100), ADD COLUMN IF NOT EXISTS valor1 VARCHAR(100),
//     ADD COLUMN IF NOT EXISTS art2 VARCHAR(100), ADD COLUMN IF NOT EXISTS valor2 VARCHAR(100),
//     ADD COLUMN IF NOT EXISTS art3 VARCHAR(100), ADD COLUMN IF NOT EXISTS valor3 VARCHAR(100),
//     ADD COLUMN IF NOT EXISTS art4 VARCHAR(100), ADD COLUMN IF NOT EXISTS valor4 VARCHAR(100),
//     ADD COLUMN IF NOT EXISTS art5 VARCHAR(100), ADD COLUMN IF NOT EXISTS valor5 VARCHAR(100),
//     ADD COLUMN IF NOT EXISTS art6 VARCHAR(100), ADD COLUMN IF NOT EXISTS valor6 VARCHAR(100),
//     ADD COLUMN IF NOT EXISTS art7 VARCHAR(100), ADD COLUMN IF NOT EXISTS valor7 VARCHAR(100),
//     ADD COLUMN IF NOT EXISTS art8 VARCHAR(100), ADD COLUMN IF NOT EXISTS valor8 VARCHAR(100),
//     ADD COLUMN IF NOT EXISTS art9 VARCHAR(100), ADD COLUMN IF NOT EXISTS valor9 VARCHAR(100),
//     ADD COLUMN IF NOT EXISTS art10 VARCHAR(100), ADD COLUMN IF NOT EXISTS valor10 VARCHAR(100);
// ───────────────────────────────────────────

// Helper: construye objeto con art1..art10 + valor1..valor10 + margen1..margen10 desde el body
const extractArtValores = (body) => {
  const obj = {};
  for (let n = 1; n <= 10; n++) {
    obj[`art${n}`] = body[`art${n}`] ?? null;
    obj[`valor${n}`] = body[`valor${n}`] ?? null;
    obj[`margen${n}`] = body[`margen${n}`] ?? null;
  }
  return obj;
};

// GET todos — devuelve solo la revisión más reciente de cada número
app.get("/presupuestos-mamparas", (req, res) => {
  db.query(
    `SELECT p.*, COALESCE(c.nombre, p.codcliente) AS NOMBRE
     FROM PRESUPUESTOS_MAMPARAS p
     LEFT JOIN clientes c ON c.codcliente = p.codcliente
     INNER JOIN (
       SELECT COALESCE(presm, id) AS num, MAX(REVISION) AS max_rev
       FROM PRESUPUESTOS_MAMPARAS
       GROUP BY COALESCE(presm, id)
     ) latest
       ON COALESCE(p.presm, p.id) = latest.num
      AND p.REVISION = latest.max_rev
     ORDER BY p.id DESC`,
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(result);
    },
  );
});

// GET próximo número de presupuesto (para presupuestos nuevos)
// ⚠️ DEBE ir ANTES de /:numero/revisiones para que Express no confunda
//    "proximo-numero" con un parámetro dinámico :numero
app.get("/presupuestos-mamparas/proximo-numero", (req, res) => {
  db.query(
    "SELECT COALESCE(MAX(id), 0) + 1 AS proximo FROM PRESUPUESTOS_MAMPARAS",
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ proximo: Number(result[0].proximo) });
    },
  );
});

// GET todas las revisiones de un número de presupuesto
app.get("/presupuestos-mamparas/:id", (req, res) => {
  const { id } = req.params;
  db.query(
    "SELECT * FROM presupuestos_mamparas WHERE id = ? LIMIT 1",
    [id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!rows.length) return res.status(404).json({ error: "No encontrado" });
      res.json(rows[0]);
    }
  );
});

app.get("/presupuestos-mamparas/:numero/revisiones", (req, res) => {
  const { numero } = req.params;
  db.query(
    `SELECT * FROM PRESUPUESTOS_MAMPARAS
     WHERE COALESCE(NUMERO, id) = ?
     ORDER BY REVISION ASC`,
    [numero],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(result);
    },
  );
});

// POST — guarda un presupuesto (nuevo o nueva revisión de uno existente)
//
// Si el body trae presm → es una revisión de un presupuesto ya guardado.
//   Lee la revisión máxima actual para ese presm y le suma 1.
// Si no trae presm → es nuevo. Inserta con REVISION=0.
//   Después actualiza esa fila para setear presm = id (el id auto asignado).
// Columnas reales de presupuestos_mamparas
const MAMPARAS_COLS_UPPER = new Set([
  'CODCLIENTE','NUMEROPRES','PRESM','FECHA','CANTIDAD','MODELO',
  'ANCHO','ALTO','VIDRIO','COLOCACION','PRECIO','REVISION',
  'ART1','VALOR1','MARGEN1','ART2','VALOR2','MARGEN2',
  'ART3','VALOR3','MARGEN3','ART4','VALOR4','MARGEN4',
  'ART5','VALOR5','MARGEN5','ART6','VALOR6','MARGEN6',
  'ART7','VALOR7','MARGEN7','ART8','VALOR8','MARGEN8',
  'ART9','VALOR9','MARGEN9','ART10','VALOR10','MARGEN10',
]);

app.post("/presupuestos-mamparas", (req, res) => {
  const { REVISION: _rev, ...fields } = req.body;
  const artValores = extractArtValores(req.body);

  const rawItem = {
    ...fields,
    ...artValores,
    REVISION: req.body.REVISION != null ? Number(req.body.REVISION) : 0,
    fecha: fields.fecha ?? fields.FECHA ?? ahora(),
  };

  // Filtrar solo columnas reales de la tabla y normalizar claves a minúscula
  // (MySQL en Linux es case-sensitive en nombres de columna)
  const item = Object.fromEntries(
    Object.entries(rawItem)
      .filter(([k]) => MAMPARAS_COLS_UPPER.has(k.toUpperCase()))
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .map(([k, v]) => [k.toLowerCase(), v])
  );

  console.log('INSERT presupuesto-mampara keys:', Object.keys(item));

  db.query("INSERT INTO presupuestos_mamparas SET ?", item, (err, result) => {
    if (err) {
      console.error("Error INSERT presupuestos_mamparas:", err.message);
      return res.status(500).json({ error: err.message });
    }
    const newId = result.insertId;
    console.log('INSERT OK, newId:', newId);

    // Leer presm generado por el trigger de la BD
    db.query(
      "SELECT presm FROM presupuestos_mamparas WHERE id = ?",
      [newId],
      (err2, rows) => {
        if (err2) console.error("Error leyendo presm:", err2.message);
        const presmVal = (!err2 && rows.length > 0) ? rows[0].presm : null;
        res.json({ id: newId, presm: presmVal ?? newId, ...item });
      }
    );
  });
});

// PUT — actualiza un registro existente por id (edición directa, sin revisión)
app.put("/presupuestos-mamparas/:id", (req, res) => {
  const { id } = req.params;
  const { id: _id, presm: _presm, ...fields } = req.body;
  const artValores = extractArtValores(req.body);
  const item = Object.fromEntries(
    Object.entries({ ...fields, ...artValores })
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .map(([k, v]) => [k.toLowerCase(), v])
  );
  db.query(
    "UPDATE presupuestos_mamparas SET ? WHERE id = ?",
    [item, id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: Number(id), ...item });
    },
  );
});

// DELETE — elimina todas las revisiones de un número de presupuesto
app.delete("/presupuestos-mamparas/:id", (req, res) => {
  const { id } = req.params;
  // Elimina todas las revisiones que tengan ese NUMERO o ese id
  db.query(
    "DELETE FROM presupuestos_mamparas WHERE COALESCE(NUMERO, id) = ?",
    [id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ deleted: id });
    },
  );
});

// ───────────────────────────────────────────
// MAMPARAS_TIPOS
// ───────────────────────────────────────────

app.get("/mamparas-tipos", (req, res) => {
  db.query("SELECT * FROM MAMPARAS_TIPOS ORDER BY id", (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
});

app.post("/mamparas-tipos", (req, res) => {
  const item = req.body;
  db.query("INSERT INTO MAMPARAS_TIPOS SET ?", item, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: result.insertId, ...item });
  });
});

app.put("/mamparas-tipos/:id", (req, res) => {
  const { id } = req.params;
  const item = req.body;
  db.query("UPDATE MAMPARAS_TIPOS SET ? WHERE id = ?", [item, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id, ...item });
  });
});

app.delete("/mamparas-tipos/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM MAMPARAS_TIPOS WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: id });
  });
});

// ───────────────────────────────────────────
// ASOCIACIONES
// Tabla: asociaciones (id, codart, articulo, cod1..cod10, art1..art10)
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

// ───────────────────────────────────────────
// ASOCIACIONES_FORM
// Tabla: asociaciones_form
// Columnas: id, codart, articulo, rubro, familia,
//           codf, form,
//           codf1, form1 … codf10, form10
// ───────────────────────────────────────────

app.get("/asociaciones-form", (req, res) => {
  db.query("SELECT * FROM asociaciones_form ORDER BY id", (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
});

app.post("/asociaciones-form", (req, res) => {
  const { id, ...item } = req.body;
  db.query("INSERT INTO asociaciones_form SET ?", item, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: result.insertId, ...item });
  });
});

app.put("/asociaciones-form/:id", (req, res) => {
  const { id } = req.params;
  const { id: _id, ...item } = req.body;
  db.query("UPDATE asociaciones_form SET ? WHERE id = ?", [item, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id, ...item });
  });
});

app.delete("/asociaciones-form/:id", (req, res) => {
  db.query(
    "DELETE FROM asociaciones_form WHERE id = ?",
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ deleted: req.params.id });
    },
  );
});

// ───────────────────────────────────────────
// FORMULAS
// ───────────────────────────────────────────
// PRESUPUESTOS_VANITORY
// ───────────────────────────────────────────

app.get("/presupuestos-vanitory/proximo-numero", (req, res) => {
  db.query(
    "SELECT COALESCE(MAX(id), 0) + 1 AS proximo FROM presupuestos_vanitory",
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ proximo: Number(result[0].proximo) });
    },
  );
});

app.get("/presupuestos-vanitory", (req, res) => {
  db.query(
    "SELECT * FROM presupuestos_vanitory ORDER BY id DESC",
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(result);
    },
  );
});

app.post("/presupuestos-vanitory", (req, res) => {
  const { id, ...item } = req.body;
  console.log("[POST vanitory] keys:", Object.keys(item));
  db.query("INSERT INTO presupuestos_vanitory SET ?", item, (err, result) => {
    if (err) { console.error("[POST vanitory] Error INSERT:", err.message); return res.status(500).json({ error: err.message }); }
    const newId = result.insertId;
    const presv = `V${String(newId).padStart(5, "0")}`;
    // Igual que mampara: UPDATE presv dentro del callback y responder DESPUÉS
    db.query(
      "UPDATE presupuestos_vanitory SET presv = ? WHERE id = ?",
      [presv, newId],
      (errUpd) => {
        if (errUpd) console.error("Error UPDATE presupuestos_vanitory presv:", errUpd.message);
        // Leer presv confirmado de la BD (igual que mampara lee presm)
        db.query(
          "SELECT presv FROM presupuestos_vanitory WHERE id = ?",
          [newId],
          (err2, rows) => {
            if (err2) console.error("Error leyendo presv:", err2.message);
            const presvVal = (!err2 && rows.length > 0) ? rows[0].presv : presv;
            console.log("[POST vanitory] id:", newId, "presv:", presvVal);
            res.json({ id: newId, presv: presvVal, ...item });
          }
        );
      }
    );
  });
});

// POST — vincula presupuestos de vanitory huérfanos con el presupuesto principal
app.post("/presupuestos-vanitory/vincular", (req, res) => {
  const { numeropres, ids } = req.body;
  if (!numeropres || !Array.isArray(ids) || ids.length === 0)
    return res.status(400).json({ error: "Faltan numeropres o ids" });
  db.query(
    "UPDATE presupuestos_vanitory SET numeropres = ? WHERE id IN (?)",
    [numeropres, ids],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ ok: true, numeropres, ids });
    },
  );
});

app.put("/presupuestos-vanitory/:id", (req, res) => {
  const { id } = req.params;
  const { id: _id, ...item } = req.body;
  db.query(
    "UPDATE presupuestos_vanitory SET ? WHERE id = ?",
    [item, id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id, ...item });
    },
  );
});

app.delete("/presupuestos-vanitory/:id", (req, res) => {
  db.query(
    "DELETE FROM presupuestos_vanitory WHERE id = ?",
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ deleted: req.params.id });
    },
  );
});


// ───────────────────────────────────────────
// PRESUPUESTOS_DESPENSERO
// ───────────────────────────────────────────

app.get("/presupuestos-despensero/proximo-numero", (req, res) => {
  db.query(
    "SELECT COALESCE(MAX(id), 0) + 1 AS proximo FROM presupuestos_despensero",
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ proximo: Number(result[0].proximo) });
    }
  );
});

app.get("/presupuestos-despensero", (req, res) => {
  db.query(
    "SELECT * FROM presupuestos_despensero ORDER BY id DESC",
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(result);
    }
  );
});

app.post("/presupuestos-despensero", (req, res) => {
  const { id, ...item } = req.body;
  db.query("INSERT INTO presupuestos_despensero SET ?", item, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: result.insertId, ...item });
  });
});

app.put("/presupuestos-despensero/:id", (req, res) => {
  const { id } = req.params;
  const { id: _id, ...item } = req.body;
  db.query(
    "UPDATE presupuestos_despensero SET ? WHERE id = ?",
    [item, id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id, ...item });
    }
  );
});

app.delete("/presupuestos-despensero/:id", (req, res) => {
  db.query(
    "DELETE FROM presupuestos_despensero WHERE id = ?",
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ deleted: req.params.id });
    }
  );
});

// ───────────────────────────────────────────
// PRESUPUESTOS_AMOBLAMIENTO
// Usado por PresupuestoNuevo para guardar presupuestos generales
// (cocina, placard, mampara, especiales)
//
// Columnas relevantes:
//   id, NUMERO, NOMBRE, FECHA, LOCALIDAD, REVISION,
//   TELEFONO1, TELEFONO2, WAPP,
//   LISTA_PRECIO, MOSTRAR_COSTO, INCLUIR_PRECIO, INCLUIR_TOTAL,
//   COLOR, INCLUIR_TEXTO_COLOC, AGREGAR_IVA,
//   LINEA1..LINEA3 + _C2/_C3, LEYENDA, OBSERVACIONES
//
// Si la tabla ya existe sin las columnas de teléfono, ejecutar:
//   ALTER TABLE presupuestos_amoblamiento
//     ADD COLUMN IF NOT EXISTS TELEFONO1 VARCHAR(50) DEFAULT NULL,
//     ADD COLUMN IF NOT EXISTS TELEFONO2 VARCHAR(50) DEFAULT NULL,
//     ADD COLUMN IF NOT EXISTS WAPP      VARCHAR(50) DEFAULT NULL;
// ───────────────────────────────────────────

app.get("/presupuestos-amoblamiento/proximo-numero", (req, res) => {
  db.query(
    "SELECT COALESCE(MAX(id), 0) + 1 AS proximo FROM presupuestos_amoblamiento",
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ proximo: Number(result[0].proximo) });
    },
  );
});

app.get("/presupuestos-amoblamiento", (req, res) => {
  db.query(
    "SELECT * FROM presupuestos_amoblamiento ORDER BY id DESC",
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(result);
    },
  );
});

app.get("/presupuestos-amoblamiento/:id", (req, res) => {
  db.query(
    "SELECT * FROM presupuestos_amoblamiento WHERE id = ? LIMIT 1",
    [req.params.id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!result.length)
        return res.status(404).json({ error: "No encontrado" });
      res.json(result[0]);
    },
  );
});

app.post("/presupuestos-amoblamiento", (req, res) => {
  const { id, ...item } = req.body;
  db.query(
    "INSERT INTO presupuestos_amoblamiento SET ?",
    item,
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      const newId = result.insertId;
      db.query(
        "UPDATE presupuestos_amoblamiento SET NUMERO = ? WHERE id = ?",
        [newId, newId],
        (err2) => {
          if (err2) return res.status(500).json({ error: err2.message });
          res.json({ id: newId, NUMERO: newId, ...item });
        },
      );
    },
  );
});

app.put("/presupuestos-amoblamiento/:id", (req, res) => {
  const { id } = req.params;
  const { id: _id, ...item } = req.body;
  db.query(
    "UPDATE presupuestos_amoblamiento SET ? WHERE id = ?",
    [item, id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id, ...item });
    },
  );
});

app.delete("/presupuestos-amoblamiento/:id", (req, res) => {
  db.query(
    "DELETE FROM presupuestos_amoblamiento WHERE id = ?",
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ deleted: req.params.id });
    },
  );
});

// ───────────────────────────────────────────
// TABLA_INDICE + TABLA_PRESUPUESTOS
//
// Modelo de datos:
//   tabla_indice     → encabezado del presupuesto
//     Columnas: id, numeropres, nombre, fecha, id_presupuesto, valor, revision
//
//   tabla_presupuestos → items/detalle del presupuesto
//     Columnas: id, numeropres, articulo, nombrart, linea, cantidad,
//               margen, valor, valor1, porcentaje1, valor2, porcentaje2,
//               valor3, porcentaje3, revision
//
// Ambas tablas se vinculan por el campo `numeropres`.
// El número de presupuesto es autogenerado por tabla_indice (AUTO_INCREMENT en id)
// y luego se copia al campo numeropres de ambas tablas.
// ───────────────────────────────────────────

// Próximo número — lee el MAX de tabla_indice (fuente de verdad del número)
// ⚠️ DEBE ir ANTES de GET /tabla-presupuestos
app.get("/tabla-presupuestos/proximo-numero", (req, res) => {
  db.query(
    "SELECT COALESCE(MAX(numeropres), 0) + 1 AS proximo FROM tabla_indice",
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ proximo: Number(result[0].proximo) });
    },
  );
});

// GET items de tabla_presupuestos (filtrable por numeropres y revision)
// GET encabezados: última revisión por numeropres, con totales calculados en SQL
// Reemplaza tabla_indice para la vista de lista de presupuestos
app.get("/tabla-presupuestos/encabezados", (req, res) => {
  const sql = `
    SELECT
      t.numeropres,
      t.revision,
      t.codcliente,
      c.nombre,
      t.fecha,
      t.linea1,
      t.linea2,
      t.linea3,
      ROUND(SUM(COALESCE(t.valor1,0) * COALESCE(t.cantidad,1)), 2) AS total1,
      ROUND(SUM(COALESCE(t.valor2,0) * COALESCE(t.cantidad,1)), 2) AS total2,
      ROUND(SUM(COALESCE(t.valor3,0) * COALESCE(t.cantidad,1)), 2) AS total3
    FROM tabla_presupuestos t
    LEFT JOIN clientes c ON c.codcliente = t.codcliente
    INNER JOIN (
      SELECT numeropres, MAX(revision) AS max_rev
      FROM tabla_presupuestos
      GROUP BY numeropres
    ) ult ON t.numeropres = ult.numeropres AND t.revision = ult.max_rev
    GROUP BY t.numeropres, t.revision, t.codcliente, c.nombre, t.fecha, t.linea1, t.linea2, t.linea3
    ORDER BY t.numeropres DESC
  `;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
});

// GET todas las revisiones de un numeropres, con totales calculados en SQL
app.get("/tabla-presupuestos/revisiones/:numeropres", (req, res) => {
  const { numeropres } = req.params;
  const sql = `
    SELECT
      t.numeropres,
      t.revision,
      t.codcliente,
      c.nombre,
      t.fecha,
      t.linea1,
      ROUND(SUM(COALESCE(t.valor1,0) * COALESCE(t.cantidad,1)), 2) AS total1
    FROM tabla_presupuestos t
    LEFT JOIN clientes c ON c.codcliente = t.codcliente
    WHERE t.numeropres = ?
    GROUP BY t.numeropres, t.revision, t.codcliente, c.nombre, t.fecha, t.linea1
    ORDER BY t.revision ASC
  `;
  db.query(sql, [numeropres], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
});

app.get("/tabla-presupuestos", (req, res) => {
  const { numeropres, revision } = req.query;
  let sql = "SELECT * FROM tabla_presupuestos";
  const params = [];
  const conds = [];
  if (numeropres) {
    conds.push("numeropres = ?");
    params.push(numeropres);
  }
  if (revision !== undefined && revision !== "") {
    conds.push("revision = ?");
    params.push(Number(revision));
  }
  if (conds.length) sql += " WHERE " + conds.join(" AND ");
  sql += " ORDER BY id ASC";
  db.query(sql, params, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
});

// GET encabezados de tabla_indice (lista de presupuestos)
// Soporta ?numeropres=N para traer todas las revisiones de un presupuesto
app.get("/tabla-indice", (req, res) => {
  const { numeropres } = req.query;
  if (numeropres) {
    db.query(
      "SELECT * FROM tabla_indice WHERE numeropres = ? ORDER BY revision ASC",
      [numeropres],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result);
      },
    );
  } else {
    // Devuelve solo la última revisión de cada numeropres
    db.query(
      `SELECT t1.* FROM tabla_indice t1
       INNER JOIN (
         SELECT numeropres, MAX(revision) AS max_rev
         FROM tabla_indice
         GROUP BY numeropres
       ) t2 ON t1.numeropres = t2.numeropres AND t1.revision = t2.max_rev
       ORDER BY t1.id DESC`,
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result);
      },
    );
  }
});

// GET un encabezado por numeropres
app.get("/tabla-indice/:numeropres", (req, res) => {
  db.query(
    "SELECT * FROM tabla_indice WHERE numeropres = ? ORDER BY revision DESC LIMIT 1",
    [req.params.numeropres],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!result.length)
        return res.status(404).json({ error: "No encontrado" });
      res.json(result[0]);
    },
  );
});

// ── POST /tabla-presupuestos ──────────────────────────────────────────────────
// Flujo:
//   NUEVO presupuesto (sin numero en el body):
//     1. Calcula el total sumando subtotales de los items
//     2. INSERT en tabla_indice (nombre, fecha, valor=total, revision=1)
//     3. UPDATE tabla_indice SET numeropres = id WHERE id = id  (el id es el numeropres)
//     4. DELETE items previos de tabla_presupuestos para ese numeropres (por si acaso)
//     5. INSERT de cada item en tabla_presupuestos con todos los campos mapeados
//
//   REVISIÓN (con numero en el body):
//     1. Calcula nueva revisión = MAX(revision) + 1 en tabla_indice para ese numeropres
//     2. Calcula el total sumando subtotales de los items
//     3. INSERT nuevo encabezado en tabla_indice con la revisión nueva y el total actualizado
//     4. DELETE items previos de tabla_presupuestos para ese numeropres
//     5. INSERT de cada item con la revisión nueva
//
// Campos compartidos entre ambas tablas: numeropres, nombre (cliente), revision
//
// Mapeo frontend → tabla_indice:
//   nombre   ← body.nombre  (nombre del cliente)
//   fecha    ← body.fecha
//   valor    ← suma de (item.precio * item.cantidad) de todos los items
//   revision ← calculada automáticamente
//
// Mapeo frontend → tabla_presupuestos (por item):
//   numeropres  ← numeropres asignado
//   nombre      ← body.nombre  (cliente — dato compartido con tabla_indice)
//   articulo    ← item.descripcion  (código/nombre del artículo)
//   nombrart    ← item.nombreart    (nombre descriptivo del artículo)
//   tipo        ← item.seccion      (ej: "Cocina / Bajomesadas", "Mampara", etc.)
//   linea       ← item.linea ?? extraído de item.seccion
//   ancho       ← item.ancho        (si viene en el item)
//   alto        ← item.alto
//   profundidad ← item.profundidad
//   cantidad    ← item.cantidad
//   valor       ← item.precio       (precio unitario)
//   margen      ← item.margen
//   valor1..3   ← item.valor1..3
//   porcentaje1..3 ← item.porcentaje1..3
//   revision    ← calculada automáticamente
// ─────────────────────────────────────────────────────────────────────────────
app.post("/tabla-presupuestos", (req, res) => {
  const {
    items,
    numero: numEntrada,
    NUMERO: numEntradaMay,
    revision: _rev,
    REVISION: _revMay,
    id: _id,
    nombre: nombreMin,
    NOMBRE: nombreMay,
    fecha: fechaMin,
    FECHA: fechaMay,
    lista,
    lineasElegidas,
    codcliente: codclienteMin,
    CODCLIENTE: codclienteMay,
    presmv: presmvPayload,
  } = req.body;

  const numFinal = numEntrada ?? numEntradaMay ?? null;
  const nombreCliente = (nombreMin ?? nombreMay ?? "").trim() || null;
  const codclienteVal = codclienteMin ?? codclienteMay ?? null;
  const listaGuardar = lista ?? null;
  const lineasArr = Array.isArray(lineasElegidas) ? lineasElegidas : [];

  // Sanitizar fecha
  const fechaRaw = (fechaMin ?? fechaMay ?? "").trim();
  const fechaValida = /^\d{4}-\d{2}-\d{2}$/.test(fechaRaw) ? fechaRaw : null;
  const fecha = fechaValida ?? ahora();

  const filas = Array.isArray(items) ? items : [];

  // Totales por línea para tabla_indice
  const totalesPorLinea = lineasArr
    .map((_, li) =>
      filas.reduce((s, it) => {
        const p =
          parseFloat(
            it.precios?.[li]?.precio ?? (li === 0 ? it.precio : null) ?? 0,
          ) || 0;
        return s + p * (parseFloat(it.cantidad) || 1);
      }, 0),
    )
    .map((t) => Math.round(t * 100) / 100 || null);

  // ── Paso 1: guardar encabezado en tabla_indice ───────────────────────────
  const numFinalVal = numFinal ? Number(numFinal) : null;
  const nuevaRevision = !!(req.body.nuevaRevision);
  console.log("[POST /tabla-presupuestos] numFinal:", numFinal, "| numFinalVal:", numFinalVal, "| nuevaRevision:", nuevaRevision, "| raw:", req.body.nuevaRevision, "| items:", (items ?? []).length);

  const ejecutarGuardado = (numeroPres, revision = 0) => {
    let primerInsert = true;
    console.log("[tabla-presupuestos] presmvPayload recibido:", presmvPayload, "| numeroPres:", numeroPres);
    console.log("[tabla-presupuestos] items recibidos:", JSON.stringify((items ?? []).map(it => ({ seccion: it.seccion, presmv: it.presmv, presv: it.presv }))), "| total:", (items ?? []).length);
    console.log("[tabla-presupuestos] filas.length:", filas.length);
    if (filas.length === 0) {
      return res.json({ numero: numeroPres, revision, insertados: 0 });
    }

    // Siempre INSERT — nunca DELETE.
    // Cada guardado queda registrado con su número de revisión (REV0, REV1, REV2...).
    let pendientes = filas.length;
    let errGlobal = null;

    filas.forEach((it) => {
      const filaItem = {
        numeropres: numeroPres,
        codcliente: codclienteVal != null ? Number(codclienteVal) : null,
        articulo: it.descripcion ?? it.articulo ?? null,
        nombreart: it.nombreart ?? it.nombrart ?? null,
        tipo: it.seccion ?? it.tipo ?? null,
        cantidad: parseFloat(it.cantidad) || 1,
        revision: Number(revision),
        fecha: ahora(),
        ancho: it.ancho != null ? String(it.ancho) : null,
        alto:  it.alto  != null ? String(it.alto)  : null,
        presmv: it.presmv ?? it.presv ?? presmvPayload ?? null,
        linea1: lineasArr[0] ?? null,
        valor1: parseFloat(it.precios?.[0]?.precio ?? it.valor1 ?? it.precio) || null,
        porcentaje1: it.porcentaje1 ?? it.margen1 ?? null,
        linea2: lineasArr[1] ?? null,
        valor2: parseFloat(it.precios?.[1]?.precio ?? it.valor2) || null,
        porcentaje2: it.porcentaje2 ?? it.margen2 ?? null,
        linea3: lineasArr[2] ?? null,
        valor3: parseFloat(it.precios?.[2]?.precio ?? it.valor3) || null,
        porcentaje3: it.porcentaje3 ?? it.margen3 ?? null,
      };

      // Proteger codcliente y presmv: conservarlos aunque sean null
      const camposProtegidos = new Set(["codcliente", "presmv"]);
      Object.keys(filaItem).forEach((k) => {
        if (filaItem[k] === null && !camposProtegidos.has(k)) delete filaItem[k];
      });

      console.log("[tabla-presupuestos] intentando INSERT filaItem:", JSON.stringify(filaItem));
      db.query("INSERT INTO tabla_presupuestos SET ?", filaItem, (err2, result2) => {
        if (err2) {
          if (!errGlobal) errGlobal = err2;
          console.error(
            "Error INSERT tabla_presupuestos:",
            err2.message,
            "| fila:",
            JSON.stringify(filaItem),
          );
        } else {
          console.log("[tabla-presupuestos] INSERT OK insertId:", result2.insertId, "affectedRows:", result2.affectedRows);
        }
        // Si el item es mampara, actualizar numeropres en presupuestos_mamparas

        // Actualizar numeropres en presupuestos_mamparas si es mampara
        const presmvVal = filaItem.presmv;
        if (!err2 && presmvVal && String(presmvVal).startsWith("M")) {
          db.query("UPDATE presupuestos_mamparas SET numeropres = ? WHERE presm = ?", [numeroPres, presmvVal],
            (errUpd) => { if (errUpd) console.error("Error UPDATE mamparas:", errUpd.message); });
        }
        // Actualizar numeropres en presupuestos_vanitory si es vanitory
        if (!err2 && presmvVal && String(presmvVal).startsWith("V")) {
          // Extraer id numérico del presv ("V00018" → 18)
          const vanitoryIdNum = parseInt(String(presmvVal).replace(/^V0*/i, ""), 10);
          console.log("[tabla-presupuestos] vinculando vanitory presv:", presmvVal, "id:", vanitoryIdNum, "numeroPres:", numeroPres);
          // Vincular PRIMERO por id numérico (robusto, no depende de que presv ya esté escrito en BD)
          if (!isNaN(vanitoryIdNum) && vanitoryIdNum > 0) {
            db.query(
              "UPDATE presupuestos_vanitory SET numeropres = ? WHERE id = ?",
              [numeroPres, vanitoryIdNum],
              (errUpd) => {
                if (errUpd) console.error("Error UPDATE vanitory por id:", errUpd.message);
                else console.log("[tabla-presupuestos] vanitory id", vanitoryIdNum, "→ numeropres:", numeroPres, "OK");
              }
            );
          }
          // También vincular por presv por si el id no coincide
          db.query(
            "UPDATE presupuestos_vanitory SET numeropres = ? WHERE presv = ? AND (numeropres IS NULL OR numeropres = 0)",
            [numeroPres, presmvVal],
            (errUpd2) => { if (errUpd2) console.error("Error UPDATE vanitory por presv:", errUpd2.message); }
          );
        }
        // Fallback: si el item tiene vtabla pero presmv no empezó con "V"
        const vtablaVal = it.vtabla ?? null;
        if (!err2 && vtablaVal && (!presmvVal || !String(presmvVal).startsWith("V"))) {
          const vtablaId = parseInt(vtablaVal, 10);
          const presvGen = vtablaId ? `V${String(vtablaId).padStart(5, "0")}` : null;
          if (!isNaN(vtablaId) && vtablaId > 0) {
            console.log("[tabla-presupuestos] fallback vtabla", vtablaId, "→ numeroPres:", numeroPres);
            db.query(
              "UPDATE presupuestos_vanitory SET numeropres = ?, presv = COALESCE(presv, ?) WHERE id = ?",
              [numeroPres, presvGen, vtablaId],
              (errUpd3) => { if (errUpd3) console.error("Error UPDATE vanitory por vtabla:", errUpd3.message); }
            );
          }
        }
        pendientes--;
        if (pendientes === 0) {
          if (errGlobal)
            return res.status(500).json({ error: errGlobal.message });
          res.json({ numero: numeroPres, revision, insertados: filas.length });
        }
      });
    });
  }; // fin ejecutarGuardado

  if (numFinalVal != null) {
    if (nuevaRevision) {
      // Calcular MAX(revision) + 1 para este numeropres
      db.query(
        "SELECT COALESCE(MAX(revision), 0) + 1 AS siguiente FROM tabla_presupuestos WHERE numeropres = ?",
        [numFinalVal],
        (err, rows) => {
          const siguienteRev = (!err && rows[0]) ? Number(rows[0].siguiente) : 1;
          console.log("[tabla-presupuestos] nueva revisión:", siguienteRev, "para numeropres:", numFinalVal);
          ejecutarGuardado(numFinalVal, siguienteRev);
        }
      );
    } else {
      ejecutarGuardado(numFinalVal, 0);
    }
  } else {
    db.query("SELECT COALESCE(MAX(numeropres), 0) + 1 AS siguiente FROM tabla_presupuestos", (err, rows) => {
      const siguiente = (!err && rows[0]) ? rows[0].siguiente : 1;
      ejecutarGuardado(siguiente, 0);
    });
  }
});

// PUT encabezado en tabla_indice (edición directa sin nueva revisión)
app.put("/tabla-indice/:id", (req, res) => {
  const { id } = req.params;
  const { id: _id, numeropres: _np, ...campos } = req.body;
  const fila = {
    nombre: campos.nombre ?? null,
    fecha: campos.fecha ?? null,
    lista: campos.lista ?? null,
    linea1: campos.linea1 ?? null,
    valor1: campos.valor1 ?? null,
    linea2: campos.linea2 ?? null,
    valor2: campos.valor2 ?? null,
    linea3: campos.linea3 ?? null,
    valor3: campos.valor3 ?? null,
    revision: campos.revision ?? null,
  };
  // Quitar nulls para no sobreescribir campos no enviados
  Object.keys(fila).forEach((k) => fila[k] === null && delete fila[k]);
  db.query("UPDATE tabla_indice SET ? WHERE id = ?", [fila, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id, ...fila });
  });
});

// PUT item de tabla_presupuestos
app.put("/tabla-presupuestos/:id", (req, res) => {
  const { id } = req.params;
  const { id: _id, ...item } = req.body;
  db.query(
    "UPDATE tabla_presupuestos SET ? WHERE id = ?",
    [item, id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id, ...item });
    },
  );
});

// DELETE item de tabla_presupuestos
app.delete("/tabla-presupuestos/:id", (req, res) => {
  db.query(
    "DELETE FROM tabla_presupuestos WHERE id = ?",
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ deleted: req.params.id });
    },
  );
});

// DELETE presupuesto completo (indice + todos sus items)
app.delete("/tabla-indice/:numeropres", (req, res) => {
  const { numeropres } = req.params;
  db.query(
    "DELETE FROM tabla_presupuestos WHERE numeropres = ?",
    [numeropres],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      db.query(
        "DELETE FROM tabla_indice WHERE numeropres = ?",
        [numeropres],
        (err2) => {
          if (err2) return res.status(500).json({ error: err2.message });
          res.json({ deleted: numeropres });
        },
      );
    },
  );
});

// ───────────────────────────────────────────
// LISTA
// Tabla: lista (id, lista, porcentaje)
// ───────────────────────────────────────────

app.get("/lista", (req, res) => {
  db.query("SELECT * FROM lista ORDER BY lista", (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
});

app.post("/lista", (req, res) => {
  const { id, ...item } = req.body;
  db.query("INSERT INTO lista SET ?", item, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: result.insertId, ...item });
  });
});

app.put("/lista/:id", (req, res) => {
  const { id } = req.params;
  const { id: _id, ...item } = req.body;
  db.query("UPDATE lista SET ? WHERE id = ?", [item, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id, ...item });
  });
});

app.delete("/lista/:id", (req, res) => {
  db.query("DELETE FROM lista WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: req.params.id });
  });
});

// ───────────────────────────────────────────
// PROVEEDORES  (tabla: proveedor)
// Columnas: id, provnombre, fantasia, domicilio, localidad,
//           telefono, telefono1, wapp, domrem, ubicacion,
//           cuit, rubro, tipo_fact, cod_postal, descuento, flete
// ───────────────────────────────────────────

// Rubros únicos de proveedores (para el desplegable en Proveedores)
app.get("/proveedores/rubros", (req, res) => {
  db.query(
    `SELECT DISTINCT rubro FROM proveedor
     WHERE rubro IS NOT NULL AND TRIM(rubro) != ''
     ORDER BY rubro`,
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(result.map((r) => r.rubro).filter(Boolean));
    }
  );
});

app.get("/proveedores/buscar", (req, res) => {
  const { q } = req.query;
  if (!q || !q.trim()) return res.json([]);
  const like = `%${q.trim()}%`;
  db.query(
    `SELECT * FROM proveedor
     WHERE provnombre LIKE ?
        OR fantasia   LIKE ?
        OR localidad  LIKE ?
        OR rubro      LIKE ?
     ORDER BY provnombre
     LIMIT 10`,
    [like, like, like, like],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(result);
    },
  );
});

app.get("/proveedores", (req, res) => {
  db.query("SELECT * FROM proveedor ORDER BY provnombre", (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
});

app.post("/proveedores", (req, res) => {
  const { id, ...item } = req.body;
  db.query("INSERT INTO proveedor SET ?", item, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: result.insertId, ...item });
  });
});

app.put("/proveedores/:id", (req, res) => {
  const { id } = req.params;
  const { id: _id, ...item } = req.body;
  db.query("UPDATE proveedor SET ? WHERE id = ?", [item, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id, ...item });
  });
});

app.delete("/proveedores/:id", (req, res) => {
  db.query("DELETE FROM proveedor WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: req.params.id });
  });
});
// ───────────────────────────────────────────

app.listen(3001, () => {
  console.log("Servidor corriendo en puerto 3001");
});
