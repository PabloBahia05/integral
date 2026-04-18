import { useState, useRef, useEffect } from "react";
import DataTable from "../Component/DataTable";
import Modal from "../Component/Modal";
import ActionBar from "../Component/ActionBar";
import ScreenHeader from "../Component/ScreenHeader";
import ConfirmDelete from "../Component/ConfirmDelete";

const API = "http://localhost:3001";

const COLUMNS = [
  { key: "id", label: "ID" },
  { key: "codtipvan", label: "Código" },
  { key: "nombre", label: "Nombre" },
  { key: "descripcion", label: "Descripción" },
  {
    key: "rubro",
    label: "Rubro",
    render: (v) =>
      v ? (
        <span
          style={{
            display: "inline-block",
            padding: "2px 10px",
            background: "#eff4ff",
            color: "#2563eb",
            borderRadius: 5,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {v}
        </span>
      ) : (
        <span style={{ color: "#b0c8d8", fontSize: 11 }}>—</span>
      ),
  },
  {
    key: "foto",
    label: "Foto",
    render: (v) =>
      v ? (
        <img
          src={v}
          alt="foto"
          style={{
            width: 48,
            height: 48,
            objectFit: "cover",
            borderRadius: 6,
            border: "1px solid #d0dde8",
          }}
        />
      ) : (
        <span style={{ color: "#b0c8d8", fontSize: 11 }}>Sin foto</span>
      ),
  },
];

const EMPTY = {
  nombre: "",
  codtipvan: "",
  descripcion: "",
  rubro: "",
  foto: "",
};

export default function TiposVanitory({
  tiposVanitory,
  onSave,
  onDelete,
  selected,
  onSelect,
  modal,
  onOpenModal,
  onCloseModal,
  onArmar,
  onPrueba,
}) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [rubros, setRubros] = useState([]);
  const [nuevoRubro, setNuevoRubro] = useState("");
  const [agregandoRubro, setAgregandoRubro] = useState(false);
  const fileRef = useRef(null);

  const cargarRubros = () => {
    fetch(`${API}/articulos/rubros`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setRubros(data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    cargarRubros();
  }, []);

  const filtered = (tiposVanitory ?? []).filter((t) => {
    const q = search.toLowerCase();
    return (
      (t.nombre ?? "").toLowerCase().includes(q) ||
      (t.codtipvan ?? "").toLowerCase().includes(q) ||
      (t.descripcion ?? "").toLowerCase().includes(q) ||
      (t.rubro ?? "").toLowerCase().includes(q)
    );
  });

  const openNew = () => {
    setForm(EMPTY);
    setError("");
    setAgregandoRubro(false);
    setNuevoRubro("");
    onOpenModal("nuevo");
  };

  const openEdit = () => {
    if (!selected) return;
    setForm({
      nombre: selected.nombre ?? "",
      codtipvan: selected.codtipvan ?? "",
      descripcion: selected.descripcion ?? "",
      rubro: selected.rubro ?? "",
      foto: selected.foto ?? "",
    });
    setError("");
    setAgregandoRubro(false);
    setNuevoRubro("");
    onOpenModal("editar");
  };

  const handleAgregarRubro = () => {
    const r = nuevoRubro.trim().toUpperCase();
    if (!r) return;
    if (!rubros.includes(r)) setRubros((prev) => [...prev, r].sort());
    setForm((f) => ({ ...f, rubro: r }));
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
      const res = await fetch(`${API}/api/upload-imagen`, {
        method: "POST",
        body: fd,
      });
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
    if (!form.nombre.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    if (!form.codtipvan.trim()) {
      setError("El código es obligatorio.");
      return;
    }
    onSave(modal === "nuevo" ? form : { ...form, id: selected.id });
    onCloseModal();
    setForm(EMPTY);
    setAgregandoRubro(false);
    setNuevoRubro("");
  };

  const set = (field, val) => setForm((p) => ({ ...p, [field]: val }));

  return (
    <>
      <ScreenHeader
        icon="🛁"
        title="Tipos de Vanitory"
        subtitle="Gestión de tipos de vanitory"
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 8,
        }}
      >
        <ActionBar
          selected={selected}
          onNew={openNew}
          onEdit={openEdit}
          onDelete={() => selected && onOpenModal("eliminar")}
          search={search}
          onSearch={setSearch}
        />
        <button
          onClick={() => selected && onArmar?.(selected)}
          disabled={!selected}
          style={{
            padding: "7px 18px",
            borderRadius: 6,
            border: "none",
            background: selected ? "#0f2944" : "#d0dde8",
            color: selected ? "#fff" : "#8aabb8",
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: "0.08em",
            cursor: selected ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            gap: 7,
            whiteSpace: "nowrap",
            transition: "all 0.15s",
          }}
          title={
            selected
              ? `Armar vanitory: ${selected.nombre}`
              : "Seleccioná un tipo primero"
          }
        >
          🔨 Armar Vanitory
        </button>
        <button
          onClick={onPrueba}
          style={{
            padding: "7px 18px",
            borderRadius: 6,
            border: "none",
            background: "#2d7fc1",
            color: "#fff",
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: "0.08em",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 7,
            whiteSpace: "nowrap",
            transition: "all 0.15s",
          }}
        >
          🧮 PRUEBA
        </button>
      </div>

      <DataTable
        columns={COLUMNS}
        rows={filtered}
        selectedId={selected?.id}
        onSelect={onSelect}
      />

      {(modal === "nuevo" || modal === "editar") && (
        <Modal
          title={
            modal === "nuevo"
              ? "Nuevo tipo de vanitory"
              : "Editar tipo de vanitory"
          }
          onClose={onCloseModal}
        >
          {error && <p className="form-error">{error}</p>}

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Nombre *</label>
              <input
                className="form-input"
                placeholder="Ej: Vanitory Colgante"
                value={form.nombre}
                onChange={(e) => set("nombre", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Código *</label>
              <input
                className="form-input"
                placeholder="Ej: VAN01"
                value={form.codtipvan}
                onChange={(e) => set("codtipvan", e.target.value)}
              />
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Descripción</label>
              <input
                className="form-input"
                placeholder="Ej: Vanitory moderno con cajones"
                value={form.descripcion}
                onChange={(e) => set("descripcion", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Rubro</label>

              {!agregandoRubro ? (
                <div style={{ display: "flex", gap: 8 }}>
                  <select
                    className="form-input"
                    style={{ flex: 1 }}
                    value={form.rubro}
                    onChange={(e) => set("rubro", e.target.value)}
                  >
                    <option value="">— Sin rubro —</option>
                    {rubros.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn-save"
                    style={{ padding: "0 14px", fontSize: 18, flexShrink: 0 }}
                    title="Agregar nuevo rubro"
                    onClick={() => setAgregandoRubro(true)}
                  >
                    ＋
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    className="form-input"
                    style={{ flex: 1 }}
                    placeholder="Nuevo rubro..."
                    value={nuevoRubro}
                    onChange={(e) => setNuevoRubro(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAgregarRubro()}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="btn-save"
                    style={{ padding: "0 14px", flexShrink: 0 }}
                    onClick={handleAgregarRubro}
                  >
                    ✓
                  </button>
                  <button
                    type="button"
                    className="btn-cancel"
                    style={{ padding: "0 14px", flexShrink: 0 }}
                    onClick={() => {
                      setAgregandoRubro(false);
                      setNuevoRubro("");
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}

              {form.rubro && (
                <span
                  style={{
                    fontSize: 11,
                    color: "#2563eb",
                    marginTop: 4,
                    display: "block",
                  }}
                >
                  Rubro seleccionado: <strong>{form.rubro}</strong>
                </span>
              )}
            </div>
          </div>

          {/* Foto */}
          <div className="form-group">
            <label className="form-label">Foto del modelo</label>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {form.foto ? (
                <img
                  src={form.foto}
                  alt="preview"
                  style={{
                    width: 80,
                    height: 80,
                    objectFit: "cover",
                    borderRadius: 8,
                    border: "1.5px solid #d0dde8",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 8,
                    border: "2px dashed #d0dde8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#b0c8d8",
                    fontSize: 24,
                  }}
                >
                  🛁
                </div>
              )}
              <div style={{ flex: 1 }}>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleUpload}
                />
                <button
                  type="button"
                  className="btn-cancel"
                  style={{ width: "100%", marginBottom: 6 }}
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? "⏳ Subiendo..." : "📷 Subir foto"}
                </button>
                {form.foto && (
                  <button
                    type="button"
                    className="btn-cancel"
                    style={{
                      width: "100%",
                      fontSize: 11,
                      color: "#dc2626",
                      borderColor: "#fca5a5",
                    }}
                    onClick={() => set("foto", "")}
                  >
                    ✕ Quitar foto
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button className="btn-cancel" onClick={onCloseModal}>
              Cancelar
            </button>
            <button
              className="btn-save"
              onClick={handleSubmit}
              disabled={uploading}
            >
              {modal === "nuevo" ? "Guardar" : "Actualizar"}
            </button>
          </div>
        </Modal>
      )}

      {modal === "eliminar" && (
        <ConfirmDelete
          item={selected}
          onConfirm={onDelete}
          onClose={onCloseModal}
        />
      )}
    </>
  );
}
