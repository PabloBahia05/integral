import { useState, useEffect, useRef } from "react";

const API = "http://localhost:3001";

const MONEDAS = ["ARS", "USD", "EUR"];
const TIPOS_FACTURA = ["A", "B", "C", "M", "E"];
const CONDICIONES_PAGO = ["Contado", "30 días", "60 días", "90 días", "Cuenta Corriente"];

const fmt = (n) =>
  n != null ? Number(n).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—";

// factura cabecera — campos alineados a tabla `facturas`
const EMPTY_FACTURA = {
  proveedor_id: "", numero: "", fecha: "", tipo_factura: "",
  condicion_pago: "", subtotal: "", iva_pct: "21", iva: "", total: "", moneda: "ARS",
};

// ítem — campos alineados a tabla `facturas_items`
const EMPTY_ITEM = { codigo: "", descripcion: "", cantidad: "", precio_unit: "", subtotalprod: "" };

// ── Estilos ──────────────────────────────────────────────────────────────────
const S = {
  wrap: { fontFamily: "'Space Mono', monospace", color: "#0a3a5c", minHeight: "100vh" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 },
  title: { fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, color: "#0a3a5c" },
  subtitle: { fontSize: 11, color: "#6699bb", letterSpacing: 3, textTransform: "uppercase", marginTop: 4 },
  btnPrimary: {
    background: "#0a3a5c", color: "#fff", border: "none", borderRadius: 3,
    padding: "10px 20px", fontFamily: "'Space Mono', monospace", fontSize: 12,
    cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
  },
  btnSecondary: {
    background: "#fff", color: "#0a3a5c", border: "1px solid #a0cce8", borderRadius: 3,
    padding: "9px 18px", fontFamily: "'Space Mono', monospace", fontSize: 12, cursor: "pointer",
  },
  btnDanger: {
    background: "#fff", color: "#cc3333", border: "1px solid #ffaaaa", borderRadius: 3,
    padding: "7px 14px", fontFamily: "'Space Mono', monospace", fontSize: 11, cursor: "pointer",
  },
  btnSmall: {
    background: "#e8f5fd", color: "#0a3a5c", border: "1px solid #a0cce8", borderRadius: 3,
    padding: "5px 11px", fontFamily: "'Space Mono', monospace", fontSize: 11, cursor: "pointer",
  },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 12 },
  th: { background: "#e8f5fd", padding: "8px 12px", textAlign: "left", borderBottom: "2px solid #a0cce8", whiteSpace: "nowrap" },
  td: { padding: "8px 12px", borderBottom: "1px solid #e0eef7", verticalAlign: "middle" },
  badge: (color) => ({
    display: "inline-block", padding: "2px 10px", borderRadius: 20,
    fontSize: 10, fontWeight: 700, background: color + "22", color: color, letterSpacing: 1,
  }),
  input: {
    width: "100%", padding: "8px 10px", border: "1px solid #a0cce8", borderRadius: 3,
    fontFamily: "'Space Mono', monospace", fontSize: 12, color: "#0a3a5c", background: "#fff",
    boxSizing: "border-box",
  },
  select: {
    width: "100%", padding: "8px 10px", border: "1px solid #a0cce8", borderRadius: 3,
    fontFamily: "'Space Mono', monospace", fontSize: 12, color: "#0a3a5c", background: "#fff",
  },
  label: { fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#6699bb", marginBottom: 5, display: "block" },
  field: { marginBottom: 16 },
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  row3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 },
  row4: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16 },
  overlay: {
    position: "fixed", inset: 0, background: "#00000066", zIndex: 200,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  modal: {
    background: "#fff", border: "1px solid #a0cce8", borderRadius: 6,
    width: "min(900px, 96vw)", maxHeight: "90vh", overflowY: "auto",
    padding: "32px 36px", position: "relative",
  },
  modalTitle: { fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, marginBottom: 24, color: "#0a3a5c" },
  dropzone: {
    border: "2px dashed #a0cce8", borderRadius: 6, padding: "36px 24px",
    textAlign: "center", cursor: "pointer", color: "#6699bb", fontSize: 13,
    transition: "all .2s", marginBottom: 20,
  },
  dropzoneActive: { borderColor: "#0a3a5c", background: "#e8f5fd", color: "#0a3a5c" },
  progressBar: { height: 4, background: "#e0eef7", borderRadius: 2, overflow: "hidden", marginBottom: 16 },
  progressFill: (pct) => ({ height: "100%", width: pct + "%", background: "#0a3a5c", transition: "width .3s" }),
  // ítem: código | descripción | cantidad | precio_unit | subtotalprod | ✕
  itemRow: { display: "grid", gridTemplateColumns: "100px 3fr 80px 110px 110px auto", gap: 8, marginBottom: 8, alignItems: "center" },
  sectionTitle: {
    fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#6699bb",
    borderBottom: "1px solid #e0eef7", paddingBottom: 6, marginBottom: 14,
  },
  ivaPctWrap: { display: "flex", gap: 8 },
};

// ── Componente principal ──────────────────────────────────────────────────────
export default function Facturas({ proveedores = [] }) {
  const [facturas, setFacturas]     = useState([]);
  const [selected, setSelected]     = useState(null);
  const [detalle, setDetalle]       = useState(null);
  const [modal, setModal]           = useState(null); // "nueva"|"editar"|"detalle"|"ocr"
  const [loading, setLoading]       = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrResult, setOcrResult]   = useState(null);
  const [form, setForm]             = useState(EMPTY_FACTURA);
  const [itemsForm, setItemsForm]   = useState([]);
  const [dragOver, setDragOver]     = useState(false);
  const [imgPreview, setImgPreview] = useState(null);
  const [imgFile, setImgFile]       = useState(null);
  const [filtro, setFiltro]         = useState("");
  const [provId, setProvId]         = useState("");
  const fileRef = useRef();

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchFacturas = () => {
    setLoading(true);
    fetch(`${API}/facturas`)
      .then((r) => r.json())
      .then((data) => { setFacturas(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchFacturas(); }, []);

  const fetchDetalle = (id) => {
    fetch(`${API}/facturas/${id}`)
      .then((r) => r.json())
      .then((d) => { setDetalle(d); setModal("detalle"); })
      .catch(console.error);
  };

  // ── Filtro ─────────────────────────────────────────────────────────────────
  const facturasFiltradas = facturas.filter((f) => {
    const txt = filtro.toLowerCase();
    return (
      !txt ||
      (f.numero ?? "").toLowerCase().includes(txt) ||
      (f.proveedor_nombre ?? "").toLowerCase().includes(txt) ||
      (f.fecha ?? "").includes(txt)
    );
  });

  // ── Cálculos automáticos de totales ────────────────────────────────────────
  // Recalcula iva$ y total cuando cambia subtotal o iva_pct
  const recalcTotales = (f) => {
    const sub = parseFloat(f.subtotal) || 0;
    const pct = parseFloat(f.iva_pct) || 0;
    const ivaImporte = +(sub * pct / 100).toFixed(2);
    const total = +(sub + ivaImporte).toFixed(2);
    return { ...f, iva: ivaImporte || "", total: total || "" };
  };

  const setFormField = (key, val) => {
    setForm((prev) => {
      const next = { ...prev, [key]: val };
      if (key === "subtotal" || key === "iva_pct") return recalcTotales(next);
      return next;
    });
  };

  // ── OCR ────────────────────────────────────────────────────────────────────
  const handleFile = (file) => {
    if (!file) return;
    setImgFile(file);
    setImgPreview(URL.createObjectURL(file));
  };

  const lanzarOcr = async () => {
    if (!imgFile) return;
    setOcrProgress(10);
    const fd = new FormData();
    fd.append("imagen", imgFile);
    if (provId) fd.append("proveedor_id", provId);

    try {
      setOcrProgress(40);
      const res = await fetch(`${API}/facturas/ocr-preview`, { method: "POST", body: fd });
      setOcrProgress(80);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setOcrProgress(100);
      setOcrResult(data);

      const f = data.factura ?? {};
      // Derivar iva_pct a partir de subtotal e iva si están disponibles
      let ivaPct = "21";
      if (f.subtotal && f.iva) {
        const derived = Math.round((parseFloat(f.iva) / parseFloat(f.subtotal)) * 100);
        if ([10.5, 21, 27].includes(derived)) ivaPct = String(derived);
      }

      setForm(recalcTotales({
        proveedor_id:   f.proveedor_id  ?? provId ?? "",
        numero:         f.numero        ?? "",
        fecha:          f.fecha         ?? "",
        tipo_factura:   f.tipo_factura  ?? "",
        condicion_pago: f.condicion_pago ?? "",
        subtotal:       f.subtotal      ?? "",
        iva_pct:        ivaPct,
        iva:            f.iva           ?? "",
        total:          f.total         ?? "",
        moneda:         f.moneda        ?? "ARS",
      }));

      setItemsForm(
        (data.items ?? []).map((it) => ({
          codigo:       it.codigo       ?? "",
          descripcion:  it.descripcion  ?? "",
          cantidad:     it.cantidad     ?? "",
          precio_unit:  it.precio_unit  ?? "",
          subtotalprod: it.subtotalprod ?? it.subtotal ?? "",
        }))
      );
      setTimeout(() => setOcrProgress(0), 800);
    } catch (e) {
      alert("Error OCR: " + e.message);
      setOcrProgress(0);
    }
  };

  // ── Guardar (manual o post-OCR) ────────────────────────────────────────────
  const guardarFactura = async () => {
    try {
      let imagenUrl = null;
      if (imgFile && !ocrResult) {
        const fd = new FormData();
        fd.append("imagen", imgFile);
        const up = await fetch(`${API}/api/upload-imagen-factura`, { method: "POST", body: fd });
        const upData = await up.json();
        imagenUrl = upData.url;
      }

      // Construir cabecera sin iva_pct (campo de UI, no de BD)
      const { iva_pct, ...formSinPct } = form;

      const body = {
        ...formSinPct,
        proveedor_id: form.proveedor_id ? Number(form.proveedor_id) : null,
        subtotal:     form.subtotal  ? Number(form.subtotal)  : null,
        iva:          form.iva       ? Number(form.iva)       : null,
        total:        form.total     ? Number(form.total)     : null,
        ...(imagenUrl ? { imagen_path: imagenUrl } : {}),
        ...(ocrResult?.imagenUrl ? { imagen_path: ocrResult.imagenUrl } : {}),
        items: itemsForm.map((it) => ({
          codigo:       it.codigo      || null,
          descripcion:  it.descripcion || null,
          cantidad:     it.cantidad    ? Number(it.cantidad)    : null,
          precio_unit:  it.precio_unit ? Number(it.precio_unit) : null,
          subtotalprod: it.subtotalprod ? Number(it.subtotalprod) : null,
        })),
      };

      const url    = modal === "editar" ? `${API}/facturas/${selected.id}` : `${API}/facturas`;
      const method = modal === "editar" ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      fetchFacturas();
      cerrarModal();
    } catch (e) {
      alert("Error al guardar: " + e.message);
    }
  };

  const eliminarFactura = async (id) => {
    if (!confirm("¿Eliminar esta factura y sus ítems?")) return;
    await fetch(`${API}/facturas/${id}`, { method: "DELETE" });
    setSelected(null);
    fetchFacturas();
  };

  // ── Helpers form ───────────────────────────────────────────────────────────
  const cerrarModal = () => {
    setModal(null); setForm(EMPTY_FACTURA); setItemsForm([]);
    setOcrResult(null); setImgFile(null); setImgPreview(null);
    setProvId(""); setOcrProgress(0);
  };

  const abrirEditar = (f) => {
    setSelected(f);
    // Derivar iva_pct desde iva e subtotal
    let ivaPct = "21";
    if (f.subtotal && f.iva) {
      const derived = Math.round((parseFloat(f.iva) / parseFloat(f.subtotal)) * 100);
      if ([10.5, 21, 27].includes(derived)) ivaPct = String(derived);
    }
    setForm({
      proveedor_id:   f.proveedor_id  ?? "",
      numero:         f.numero        ?? "",
      fecha:          f.fecha?.slice(0, 10) ?? "",
      tipo_factura:   f.tipo_factura  ?? "",
      condicion_pago: f.condicion_pago ?? "",
      subtotal:       f.subtotal      ?? "",
      iva_pct:        ivaPct,
      iva:            f.iva           ?? "",
      total:          f.total         ?? "",
      moneda:         f.moneda        ?? "ARS",
    });
    fetch(`${API}/facturas-items/${f.id}`)
      .then((r) => r.json())
      .then((items) => setItemsForm(items.map((it) => ({
        id:           it.id,
        codigo:       it.codigo       ?? "",
        descripcion:  it.descripcion  ?? "",
        cantidad:     it.cantidad     ?? "",
        precio_unit:  it.precio_unit  ?? "",
        subtotalprod: it.subtotalprod ?? "",
      }))));
    setModal("editar");
  };

  const addItem = () => setItemsForm((prev) => [...prev, { ...EMPTY_ITEM }]);
  const updateItem = (i, k, v) =>
    setItemsForm((prev) => prev.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)));
  const removeItem = (i) => setItemsForm((prev) => prev.filter((_, idx) => idx !== i));

  const calcSubtotalProd = (i) => {
    const it = itemsForm[i];
    const c = parseFloat(it.cantidad) || 0;
    const p = parseFloat(it.precio_unit) || 0;
    if (c && p) updateItem(i, "subtotalprod", (c * p).toFixed(2));
  };

  // ── Render lista ──────────────────────────────────────────────────────────
  const renderLista = () => (
    <>
      <div style={S.header}>
        <div>
          <h1 style={S.title}>Facturas</h1>
          <p style={S.subtitle}>Gestión de comprobantes</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={S.btnSecondary} onClick={() => setModal("ocr")}>🔍 Cargar con OCR</button>
          <button style={S.btnPrimary} onClick={() => setModal("nueva")}>＋ Nueva factura</button>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <input
          style={{ ...S.input, maxWidth: 360 }}
          placeholder="Buscar por número, proveedor o fecha…"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
      </div>

      {loading ? (
        <p style={{ color: "#6699bb", fontSize: 13 }}>Cargando…</p>
      ) : facturasFiltradas.length === 0 ? (
        <p style={{ color: "#6699bb", fontSize: 13 }}>No hay facturas registradas.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={S.table}>
            <thead>
              <tr>
                {["#", "Proveedor", "Tipo", "Número", "Fecha", "Subtotal", "IVA $", "Total", "Moneda", ""].map((h) => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {facturasFiltradas.map((f) => (
                <tr
                  key={f.id}
                  style={{ cursor: "pointer", background: selected?.id === f.id ? "#e8f5fd" : undefined }}
                  onClick={() => setSelected(selected?.id === f.id ? null : f)}
                  onDoubleClick={() => fetchDetalle(f.id)}
                >
                  <td style={S.td}>{f.id}</td>
                  <td style={S.td}>{f.proveedor_nombre ?? <span style={{ color: "#aaa" }}>—</span>}</td>
                  <td style={S.td}>
                    {f.tipo_factura
                      ? <span style={S.badge("#0a3a5c")}>F.{f.tipo_factura}</span>
                      : <span style={{ color: "#aaa" }}>—</span>}
                  </td>
                  <td style={S.td}><strong>{f.numero ?? "—"}</strong></td>
                  <td style={S.td}>{f.fecha?.slice(0, 10) ?? "—"}</td>
                  <td style={{ ...S.td, textAlign: "right" }}>{fmt(f.subtotal)}</td>
                  <td style={{ ...S.td, textAlign: "right" }}>{fmt(f.iva)}</td>
                  <td style={{ ...S.td, textAlign: "right", fontWeight: 700 }}>{fmt(f.total)}</td>
                  <td style={S.td}>
                    <span style={S.badge(f.moneda === "USD" ? "#2255aa" : "#00885a")}>{f.moneda ?? "ARS"}</span>
                  </td>
                  <td style={S.td}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button style={S.btnSmall} onClick={(e) => { e.stopPropagation(); fetchDetalle(f.id); }}>Ver</button>
                      <button style={S.btnSmall} onClick={(e) => { e.stopPropagation(); abrirEditar(f); }}>✏️</button>
                      <button style={S.btnDanger} onClick={(e) => { e.stopPropagation(); eliminarFactura(f.id); }}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );

  // ── Modal OCR ─────────────────────────────────────────────────────────────
  const renderModalOcr = () => (
    <div style={S.overlay} onClick={cerrarModal}>
      <div style={S.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={S.modalTitle}>🔍 Cargar factura con OCR</h2>

        <div
          style={{ ...S.dropzone, ...(dragOver ? S.dropzoneActive : {}) }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
          onClick={() => fileRef.current.click()}
        >
          {imgPreview ? (
            <img src={imgPreview} alt="preview" style={{ maxHeight: 180, maxWidth: "100%", borderRadius: 4 }} />
          ) : (
            <>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📄</div>
              <div>Arrastrá la imagen de la factura aquí<br />o hacé clic para seleccionar</div>
              <div style={{ fontSize: 11, marginTop: 8, color: "#99bbcc" }}>JPG · PNG · TIFF · BMP</div>
            </>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
          onChange={(e) => handleFile(e.target.files[0])} />

        <div style={S.field}>
          <label style={S.label}>Proveedor (opcional)</label>
          <select style={S.select} value={provId} onChange={(e) => setProvId(e.target.value)}>
            <option value="">— Sin asignar —</option>
            {proveedores.map((p) => <option key={p.id} value={p.id}>{p.provnombre}</option>)}
          </select>
        </div>

        {ocrProgress > 0 && (
          <div style={S.progressBar}>
            <div style={S.progressFill(ocrProgress)} />
          </div>
        )}

        {ocrResult && (
          <div style={{ background: "#e8f5fd", border: "1px solid #a0cce8", borderRadius: 4, padding: 14, marginBottom: 16, fontSize: 12 }}>
            <strong>✔ OCR completado</strong> — Revisá los datos en el formulario a continuación antes de guardar.
          </div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button style={S.btnSecondary} onClick={cerrarModal}>Cancelar</button>
          {!ocrResult ? (
            <button style={S.btnPrimary} onClick={lanzarOcr} disabled={!imgFile}>
              {ocrProgress > 0 ? "Procesando…" : "Extraer datos"}
            </button>
          ) : (
            <button style={S.btnPrimary} onClick={() => setModal("nueva")}>
              Revisar y guardar →
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // ── Modal form (nueva / editar) ────────────────────────────────────────────
  const renderModalForm = () => (
    <div style={S.overlay} onClick={cerrarModal}>
      <div style={{ ...S.modal, width: "min(960px, 96vw)" }} onClick={(e) => e.stopPropagation()}>
        <h2 style={S.modalTitle}>{modal === "editar" ? "✏️ Editar factura" : "Nueva factura"}</h2>

        {/* ── Cabecera ── */}
        <div style={{ ...S.sectionTitle }}>Datos de la factura</div>

        <div style={S.row3}>
          <div style={S.field}>
            <label style={S.label}>Proveedor</label>
            <select style={S.select} value={form.proveedor_id}
              onChange={(e) => setFormField("proveedor_id", e.target.value)}>
              <option value="">— Sin asignar —</option>
              {proveedores.map((p) => <option key={p.id} value={p.id}>{p.provnombre}</option>)}
            </select>
          </div>
          <div style={S.field}>
            <label style={S.label}>Tipo de factura</label>
            <select style={S.select} value={form.tipo_factura}
              onChange={(e) => setFormField("tipo_factura", e.target.value)}>
              <option value="">—</option>
              {TIPOS_FACTURA.map((t) => <option key={t} value={t}>Factura {t}</option>)}
            </select>
          </div>
          <div style={S.field}>
            <label style={S.label}>Número de factura</label>
            <input style={S.input} value={form.numero}
              placeholder="0001-00001234"
              onChange={(e) => setFormField("numero", e.target.value)} />
          </div>
        </div>

        <div style={S.row3}>
          <div style={S.field}>
            <label style={S.label}>Fecha</label>
            <input type="date" style={S.input} value={form.fecha}
              onChange={(e) => setFormField("fecha", e.target.value)} />
          </div>
          <div style={S.field}>
            <label style={S.label}>Condición de pago</label>
            <select style={S.select} value={form.condicion_pago}
              onChange={(e) => setFormField("condicion_pago", e.target.value)}>
              <option value="">—</option>
              {CONDICIONES_PAGO.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ ...S.field, maxWidth: "100%" }}>
            <label style={S.label}>Moneda</label>
            <select style={S.select} value={form.moneda}
              onChange={(e) => setFormField("moneda", e.target.value)}>
              {MONEDAS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        {/* ── Totales ── */}
        <div style={{ ...S.sectionTitle, marginTop: 8 }}>Importes</div>

        <div style={S.row4}>
          <div style={S.field}>
            <label style={S.label}>Subtotal $</label>
            <input type="number" style={S.input} value={form.subtotal} placeholder="0.00"
              onChange={(e) => setFormField("subtotal", e.target.value)} />
          </div>
          <div style={S.field}>
            <label style={S.label}>IVA %</label>
            <select style={S.select} value={form.iva_pct}
              onChange={(e) => setFormField("iva_pct", e.target.value)}>
              <option value="0">0 %</option>
              <option value="10.5">10,5 %</option>
              <option value="21">21 %</option>
              <option value="27">27 %</option>
            </select>
          </div>
          <div style={S.field}>
            <label style={S.label}>IVA $</label>
            <input type="number" style={S.input} value={form.iva} placeholder="0.00"
              onChange={(e) => setFormField("iva", e.target.value)} />
          </div>
          <div style={S.field}>
            <label style={S.label}>Total $</label>
            <input type="number" style={{ ...S.input, fontWeight: 700 }} value={form.total} placeholder="0.00"
              onChange={(e) => setFormField("total", e.target.value)} />
          </div>
        </div>

        {/* ── Ítems ── */}
        <div style={{ ...S.sectionTitle, marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Ítems del comprobante</span>
          <button style={S.btnSmall} onClick={addItem}>＋ Agregar ítem</button>
        </div>

        {itemsForm.length === 0 ? (
          <p style={{ color: "#aaa", fontSize: 12, marginBottom: 12 }}>Sin ítems cargados.</p>
        ) : (
          <>
            {/* Cabeceras items */}
            <div style={{ ...S.itemRow, marginBottom: 4 }}>
              {["Código", "Descripción", "Cant.", "Precio unit.", "Subtotal", ""].map((h) => (
                <div key={h} style={{ fontSize: 10, color: "#6699bb", letterSpacing: 1 }}>{h}</div>
              ))}
            </div>
            {itemsForm.map((it, i) => (
              <div key={i} style={S.itemRow}>
                <input style={S.input} value={it.codigo} placeholder="SKU/Cód."
                  onChange={(e) => updateItem(i, "codigo", e.target.value)} />
                <input style={S.input} value={it.descripcion} placeholder="Descripción"
                  onChange={(e) => updateItem(i, "descripcion", e.target.value)} />
                <input type="number" style={S.input} value={it.cantidad} placeholder="0"
                  onChange={(e) => updateItem(i, "cantidad", e.target.value)}
                  onBlur={() => calcSubtotalProd(i)} />
                <input type="number" style={S.input} value={it.precio_unit} placeholder="0.00"
                  onChange={(e) => updateItem(i, "precio_unit", e.target.value)}
                  onBlur={() => calcSubtotalProd(i)} />
                <input type="number" style={S.input} value={it.subtotalprod} placeholder="0.00"
                  onChange={(e) => updateItem(i, "subtotalprod", e.target.value)} />
                <button style={S.btnDanger} onClick={() => removeItem(i)}>✕</button>
              </div>
            ))}
          </>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
          <button style={S.btnSecondary} onClick={cerrarModal}>Cancelar</button>
          <button style={S.btnPrimary} onClick={guardarFactura}>
            {modal === "editar" ? "Guardar cambios" : "Guardar factura"}
          </button>
        </div>
      </div>
    </div>
  );

  // ── Modal detalle ─────────────────────────────────────────────────────────
  const renderModalDetalle = () => {
    if (!detalle) return null;
    const f = detalle;
    return (
      <div style={S.overlay} onClick={() => { setModal(null); setDetalle(null); }}>
        <div style={{ ...S.modal, width: "min(860px, 95vw)" }} onClick={(e) => e.stopPropagation()}>
          <h2 style={S.modalTitle}>
            {f.tipo_factura ? `Factura ${f.tipo_factura} ` : "Factura "}#{f.numero ?? f.id}
          </h2>

          <div style={S.row3}>
            <div><label style={S.label}>Proveedor</label><p style={{ fontSize: 13 }}>{f.proveedor_nombre ?? "—"}</p></div>
            <div><label style={S.label}>Fecha</label><p style={{ fontSize: 13 }}>{f.fecha?.slice(0, 10) ?? "—"}</p></div>
            <div><label style={S.label}>Moneda</label><p style={{ fontSize: 13 }}>{f.moneda ?? "ARS"}</p></div>
          </div>
          <div style={{ ...S.row3, marginTop: 12 }}>
            <div><label style={S.label}>Tipo de factura</label><p style={{ fontSize: 13 }}>{f.tipo_factura ? `Factura ${f.tipo_factura}` : "—"}</p></div>
            <div><label style={S.label}>Cond. de pago</label><p style={{ fontSize: 13 }}>{f.condicion_pago ?? "—"}</p></div>
            <div>
              <label style={S.label}>Totales</label>
              <p style={{ fontSize: 13 }}>
                Sub: <strong>{fmt(f.subtotal)}</strong> · IVA: <strong>{fmt(f.iva)}</strong> · Total: <strong>{fmt(f.total)}</strong>
              </p>
            </div>
          </div>

          {f.imagen_path && (
            <div style={{ margin: "16px 0" }}>
              <label style={S.label}>Imagen original</label>
              <a href={f.imagen_path} target="_blank" rel="noreferrer">
                <img src={f.imagen_path} alt="factura" style={{ maxHeight: 200, border: "1px solid #a0cce8", borderRadius: 4 }} />
              </a>
            </div>
          )}

          <label style={{ ...S.label, marginTop: 16 }}>Ítems ({(f.items ?? []).length})</label>
          {(f.items ?? []).length === 0 ? (
            <p style={{ color: "#aaa", fontSize: 12 }}>Sin ítems registrados.</p>
          ) : (
            <table style={{ ...S.table, marginTop: 8 }}>
              <thead>
                <tr>
                  {["Código", "Descripción", "Cantidad", "Precio unit.", "Subtotal prod."].map((h) => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {f.items.map((it) => (
                  <tr key={it.id}>
                    <td style={S.td}>{it.codigo ?? "—"}</td>
                    <td style={S.td}>{it.descripcion ?? "—"}</td>
                    <td style={{ ...S.td, textAlign: "right" }}>{it.cantidad ?? "—"}</td>
                    <td style={{ ...S.td, textAlign: "right" }}>{fmt(it.precio_unit)}</td>
                    <td style={{ ...S.td, textAlign: "right", fontWeight: 700 }}>{fmt(it.subtotalprod)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
            <button style={S.btnSecondary} onClick={() => { setModal(null); setDetalle(null); }}>Cerrar</button>
          </div>
        </div>
      </div>
    );
  };

  // ── Render principal ───────────────────────────────────────────────────────
  return (
    <div style={S.wrap}>
      {renderLista()}
      {modal === "ocr"     && renderModalOcr()}
      {(modal === "nueva" || modal === "editar") && renderModalForm()}
      {modal === "detalle" && renderModalDetalle()}
    </div>
  );
}
