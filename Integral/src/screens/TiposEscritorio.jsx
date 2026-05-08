import { useState, useRef, useEffect } from "react";
import DataTable from "../Component/DataTable";
import Modal from "../Component/Modal";
import ActionBar from "../Component/ActionBar";
import ScreenHeader from "../Component/ScreenHeader";
import ConfirmDelete from "../Component/ConfirmDelete";

const API = "http://localhost:3001";

const COLUMNS = [
  { key: "id",          label: "ID" },
  { key: "codtipesc",   label: "Código" },
  { key: "NOMBRE",      label: "Nombre" },
  { key: "DESCRIPCION", label: "Descripción" },
  { key: "MATERIAL",    label: "Rubro", render: (v) => v
      ? <span style={{ display: "inline-block", padding: "2px 10px", background: "#eff4ff", color: "#2563eb", borderRadius: 5, fontSize: 12, fontWeight: 600 }}>{v}</span>
      : <span style={{ color: "#b0c8d8", fontSize: 11 }}>—</span>
  },
  { key: "foto",        label: "Foto", render: (v) => v
      ? <img src={v} alt="foto" style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 6, border: "1px solid #d0dde8" }} />
      : <span style={{ color: "#b0c8d8", fontSize: 11 }}>Sin foto</span>
  },
];

const EMPTY = { NOMBRE: "", codtipesc: "", DESCRIPCION: "", MATERIAL: "", foto: "" };

export default function TiposEscritorio({
  tiposEscritorio, onSave, onDelete,
  selected, onSelect, modal, onOpenModal, onCloseModal,
}) {
  const [form, setForm]               = useState(EMPTY);
  const [error, setError]             = useState("");
  const [search, setSearch]           = useState("");
  const [uploading, setUploading]     = useState(false);
  const [rubros, setRubros]   = useState([]);
  const [nuevoRubro, setNuevoRubro] = useState("");
  const [agregandoRubro, setAgregandoRubro] = useState(false);
  const fileRef = useRef(null);

  // Buscador de artículos
  const [artQuery, setArtQuery]               = useState("");
  const [artResultados, setArtResultados]     = useState([]);
  const [artBuscando, setArtBuscando]         = useState(false);
  const [artSeleccionado, setArtSeleccionado] = useState(null);
  const artTimer                              = useRef(null);

  const cargarRubros = () => {
    fetch(`${API}/articulos/rubros`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setRubros(data); })
      .catch(() => {});
  };

  useEffect(() => { cargarRubros(); }, []);

  const buscarArticulos = (q) => {
    setArtQuery(q);
    clearTimeout(artTimer.current);
    if (!q.trim()) { setArtResultados([]); return; }
    artTimer.current = setTimeout(() => {
      setArtBuscando(true);
      fetch(`${API}/escritorio-tipos/buscar-articulo?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((data) => setArtResultados(Array.isArray(data) ? data : []))
        .catch(() => setArtResultados([]))
        .finally(() => setArtBuscando(false));
    }, 280);
  };

  const seleccionarArticulo = (art) => {
    setArtSeleccionado(art);
    setArtQuery(art.articulo);
    setArtResultados([]);
    setForm((f) => ({
      ...f,
      NOMBRE:    art.articulo  ?? f.NOMBRE,
      codtipesc: art.codartint ?? f.codtipesc,
      MATERIAL:  art.rubro     ?? f.MATERIAL,
      foto:      art.artfoto   ?? f.foto,
    }));
  };

  const filtered = (tiposEscritorio ?? []).filter((t) => {
    const q = search.toLowerCase();
    return (
      (t.NOMBRE      ?? "").toLowerCase().includes(q) ||
      (t.codtipesc   ?? "").toLowerCase().includes(q) ||
      (t.DESCRIPCION ?? "").toLowerCase().includes(q) ||
      (t.MATERIAL    ?? "").toLowerCase().includes(q)
    );
  });

  const openNew = () => {
    setForm(EMPTY);
    setError("");
    setAgregandoRubro(false);
    setNuevoRubro("");
    setArtQuery("");
    setArtResultados([]);
    setArtSeleccionado(null);
    onOpenModal("nuevo");
  };

  const openEdit = () => {
    if (!selected) return;
    setForm({
      NOMBRE:      selected.NOMBRE      ?? "",
      codtipesc:   selected.codtipesc   ?? "",
      DESCRIPCION: selected.DESCRIPCION ?? "",
      MATERIAL:    selected.MATERIAL    ?? "",
      foto:        selected.foto        ?? "",
    });
    setError("");
    setAgregandoRubro(false);
    setNuevoRubro("");
    setArtQuery(selected.NOMBRE ?? "");
    setArtResultados([]);
    setArtSeleccionado({ articulo: selected.NOMBRE ?? "" });
    onOpenModal("editar");
  };

  const handleAgregarRubro = () => {
    const m = nuevoRubro.trim().toUpperCase();
    if (!m) return;
    if (!rubros.includes(m)) setRubros(prev => [...prev, m].sort());
    setForm(f => ({ ...f, MATERIAL: m }));
    setNuevoRubro("");
    setAgregandoRubro(false);
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("imagen", file);
      const res = await fetch(`${API}/api/upload-imagen`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al subir");
      setForm((p) => ({ ...p, foto: data.url }));
    } catch (err) {
      setError("Error al subir la imagen: " + err.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSubmit = () => {
    if (!form.NOMBRE.trim())    { setError("Seleccioná un artículo de la lista."); return; }
    if (!form.codtipesc.trim()) { setError("El código es obligatorio."); return; }
    onSave(modal === "nuevo" ? form : { ...form, id: selected.id });
    onCloseModal();
    setForm(EMPTY);
    setAgregandoRubro(false);
    setNuevoRubro("");
    setArtQuery("");
    setArtResultados([]);
    setArtSeleccionado(null);
  };

  const set = (field, val) => setForm((p) => ({ ...p, [field]: val }));

  return (
    <>
      <ScreenHeader icon="🖥️" title="Tipos de Escritorio" subtitle="Gestión de tipos de escritorio" />

      <ActionBar
        selected={selected} onNew={openNew} onEdit={openEdit}
        onDelete={() => selected && onOpenModal("eliminar")}
        search={search} onSearch={setSearch}
      />

      <DataTable columns={COLUMNS} rows={filtered} selectedId={selected?.id} onSelect={onSelect} />

      {(modal === "nuevo" || modal === "editar") && (
        <Modal title={modal === "nuevo" ? "Nuevo tipo de escritorio" : "Editar tipo de escritorio"} onClose={onCloseModal}>
          {error && <p className="form-error">{error}</p>}

          <div className="form-grid">
            {/* ── Buscador de artículos ── */}
            <div className="form-group" style={{ position: "relative" }}>
              <label className="form-label">Artículo (nombre) *</label>
              <input
                className="form-input"
                placeholder="Buscar en artículos…"
                value={artQuery}
                onChange={(e) => buscarArticulos(e.target.value)}
                autoComplete="off"
              />
              {artBuscando && (
                <div style={{ fontSize: 11, color: "#6699bb", marginTop: 3 }}>Buscando…</div>
              )}
              {artResultados.length > 0 && (
                <div style={{
                  position: "absolute", top: "100%", left: 0, right: 0, zIndex: 999,
                  background: "#fff", border: "1.5px solid #d0dde8", borderRadius: 8,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.12)", maxHeight: 220, overflowY: "auto",
                }}>
                  {artResultados.map((art) => (
                    <div
                      key={art.id}
                      onClick={() => seleccionarArticulo(art)}
                      style={{
                        padding: "8px 14px", cursor: "pointer", borderBottom: "1px solid #f0f4f8",
                        display: "flex", alignItems: "center", gap: 10,
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#eff4ff"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}
                    >
                      {art.artfoto
                        ? <img src={art.artfoto} alt="" style={{ width: 32, height: 32, objectFit: "cover", borderRadius: 4, border: "1px solid #d0dde8" }} />
                        : <div style={{ width: 32, height: 32, background: "#e8f0f7", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🖥️</div>
                      }
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#0a3a5c" }}>{art.articulo}</div>
                        {art.rubro && <div style={{ fontSize: 11, color: "#6699bb" }}>{art.rubro}</div>}
                      </div>
                      <div style={{ marginLeft: "auto", fontFamily: "Space Mono, monospace", fontSize: 10, color: "#2563eb" }}>{art.codartint}</div>
                    </div>
                  ))}
                </div>
              )}
              {artSeleccionado && artResultados.length === 0 && artQuery && (
                <div style={{ fontSize: 11, color: "#2563eb", marginTop: 3 }}>
                  ✓ Vinculado a: <strong>{artSeleccionado.articulo}</strong>
                </div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Código *</label>
              <input className="form-input" placeholder="Ej: ESC01"
                value={form.codtipesc} onChange={(e) => set("codtipesc", e.target.value)} />
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Descripción</label>
              <input className="form-input" placeholder="Ej: Escritorio en forma de L con cajones"
                value={form.DESCRIPCION} onChange={(e) => set("DESCRIPCION", e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Rubro</label>

              {!agregandoRubro ? (
                <div style={{ display: "flex", gap: 8 }}>
                  <select
                    className="form-input"
                    style={{ flex: 1 }}
                    value={form.MATERIAL}
                    onChange={(e) => set("MATERIAL", e.target.value)}
                  >
                    <option value="">— Sin rubro —</option>
                    {rubros.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn-save"
                    style={{ padding: "0 14px", fontSize: 18, flexShrink: 0 }}
                    title="Agregar nuevo rubro"
                    onClick={() => setAgregandoRubro(true)}
                  >＋</button>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    className="form-input"
                    style={{ flex: 1 }}
                    placeholder="Nuevo rubro..."
                    value={nuevoRubro}
                    onChange={e => setNuevoRubro(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleAgregarRubro()}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="btn-save"
                    style={{ padding: "0 14px", flexShrink: 0 }}
                    onClick={handleAgregarRubro}
                  >✓</button>
                  <button
                    type="button"
                    className="btn-cancel"
                    style={{ padding: "0 14px", flexShrink: 0 }}
                    onClick={() => { setAgregandoRubro(false); setNuevoRubro(""); }}
                  >✕</button>
                </div>
              )}

              {form.MATERIAL && (
                <span style={{ fontSize: 11, color: "#2563eb", marginTop: 4, display: "block" }}>
                  Rubro seleccionado: <strong>{form.MATERIAL}</strong>
                </span>
              )}
            </div>
          </div>

          {/* Foto */}
          <div className="form-group">
            <label className="form-label">Foto del modelo</label>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {form.foto ? (
                <img src={form.foto} alt="preview"
                  style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, border: "1.5px solid #d0dde8" }} />
              ) : (
                <div style={{ width: 80, height: 80, borderRadius: 8, border: "2px dashed #d0dde8",
                  display: "flex", alignItems: "center", justifyContent: "center", color: "#b0c8d8", fontSize: 24 }}>
                  🖥️
                </div>
              )}
              <div style={{ flex: 1 }}>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleUpload} />
                <button type="button" className="btn-cancel"
                  style={{ width: "100%", marginBottom: 6 }}
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}>
                  {uploading ? "⏳ Subiendo..." : "📷 Subir foto"}
                </button>
                {form.foto && (
                  <button type="button" className="btn-cancel"
                    style={{ width: "100%", fontSize: 11, color: "#dc2626", borderColor: "#fca5a5" }}
                    onClick={() => set("foto", "")}>
                    ✕ Quitar foto
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button className="btn-cancel" onClick={onCloseModal}>Cancelar</button>
            <button className="btn-save" onClick={handleSubmit} disabled={uploading}>
              {modal === "nuevo" ? "Guardar" : "Actualizar"}
            </button>
          </div>
        </Modal>
      )}

      {modal === "eliminar" && (
        <ConfirmDelete item={selected} onConfirm={onDelete} onClose={onCloseModal} />
      )}
    </>
  );
}
