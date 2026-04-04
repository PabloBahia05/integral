import { useState, useRef, useEffect } from "react";
import DataTable from "../Component/DataTable";
import Modal from "../Component/Modal";
import ActionBar from "../Component/ActionBar";
import ScreenHeader from "../Component/ScreenHeader";
import ConfirmDelete from "../Component/ConfirmDelete";

const API = "http://localhost:3001";

const COLUMNS = [
  { key: "CODART",   label: "Código" },
  { key: "ARTICULO", label: "Artículo" },
  { key: "AREA",     label: "Área" },
  { key: "FAMILIA",  label: "Familia" },
  { key: "MARGEN",   label: "Margen" },
];

const EMPTY = { CODART: "", ARTICULO: "", AREA: "", FAMILIA: "", MARGEN: "" };

function BuscadorArticulo({ onSelect }) {
  const [buscar, setBuscar]         = useState("");
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando]     = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (buscar.length < 2) { setResultados([]); return; }
      setBuscando(true);
      try {
        const r = await fetch(`${API}/productos?search=${encodeURIComponent(buscar)}&limit=15`);
        const d = await r.json();
        setResultados(Array.isArray(d) ? d : []);
      } catch { setResultados([]); }
      finally { setBuscando(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [buscar]);

  const elegir = (art) => {
    onSelect(art);
    setBuscar(art.articulo);
    setResultados([]);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <label className="form-label">Buscar artículo *</label>
      <input
        className="form-input"
        placeholder="Escribí nombre o código del artículo..."
        value={buscar}
        onChange={e => { setBuscar(e.target.value); }}
      />
      {(resultados.length > 0 || buscando) && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 300,
          background: "#fff", border: "1.5px solid #2277bb", borderRadius: 4,
          maxHeight: 200, overflowY: "auto", boxShadow: "0 4px 16px rgba(0,0,0,0.12)"
        }}>
          {buscando && <div style={{ padding: "10px 14px", color: "#88aacc", fontSize: 13 }}>Buscando...</div>}
          {resultados.map(a => (
            <div
              key={a.id ?? a.codart}
              style={{ padding: "9px 14px", cursor: "pointer", borderBottom: "1px solid #eef2f7", fontSize: 13 }}
              onMouseEnter={e => e.currentTarget.style.background = "#eaf3fb"}
              onMouseLeave={e => e.currentTarget.style.background = ""}
              onMouseDown={e => { e.preventDefault(); elegir(a); }}
            >
              <strong style={{ color: "#0a3a5c" }}>{a.articulo}</strong>
              <span style={{ color: "#6699bb", marginLeft: 8, fontSize: 11 }}>{a.codart}</span>
              {a.familia && <span style={{ color: "#aaa", marginLeft: 8, fontSize: 11 }}>{a.familia}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Margen({ margen, onSave, onDelete, selected, onSelect, modal, onOpenModal, onCloseModal }) {
  const [form, setForm]     = useState(EMPTY);
  const [error, setError]   = useState("");
  const [search, setSearch] = useState("");

  const filtered = (margen ?? []).filter((m) => {
    const q = search.toLowerCase();
    return (
      (m.CODART   ?? "").toLowerCase().includes(q) ||
      (m.ARTICULO ?? "").toLowerCase().includes(q) ||
      (m.FAMILIA  ?? "").toLowerCase().includes(q)
    );
  });

  const openNew = () => { setForm(EMPTY); setError(""); onOpenModal("nuevo"); };

  const openEdit = () => {
    if (!selected) return;
    setForm({
      CODART:   selected.CODART   ?? "",
      ARTICULO: selected.ARTICULO ?? "",
      AREA:     selected.AREA     ?? "",
      FAMILIA:  selected.FAMILIA  ?? "",
      MARGEN:   selected.MARGEN   ?? "",
    });
    setError("");
    onOpenModal("editar");
  };

  const handleSelect = (art) => {
    setForm(p => ({
      ...p,
      CODART:   art.codart   ?? "",
      ARTICULO: art.articulo ?? "",
      AREA:     art.area     ?? "",
      FAMILIA:  art.familia  ?? "",
    }));
  };

  const handleSubmit = () => {
    if (!form.CODART.trim())  { setError("Seleccioná un artículo."); return; }
    if (!form.MARGEN.trim())  { setError("El margen es obligatorio."); return; }
    const payload = modal === "nuevo" ? form : { ...form, id: selected.id };
    onSave(payload);
    onCloseModal();
    setForm(EMPTY);
  };

  return (
    <>
      <ScreenHeader icon="📊" title="Márgenes" subtitle="Gestión de márgenes por artículo" />

      <ActionBar
        selected={selected} onNew={openNew} onEdit={openEdit}
        onDelete={() => selected && onOpenModal("eliminar")}
        search={search} onSearch={setSearch}
      />

      <DataTable columns={COLUMNS} rows={filtered} selectedId={selected?.id} onSelect={onSelect} />

      {(modal === "nuevo" || modal === "editar") && (
        <Modal
          title={modal === "nuevo" ? "Nuevo margen" : "Editar margen"}
          onClose={onCloseModal}
        >
          {error && <p className="form-error">{error}</p>}

          {/* Buscador de artículo */}
          <div className="form-group">
            <BuscadorArticulo onSelect={handleSelect} />
          </div>

          {/* Campos autocargados — read only */}
          <div className="form-grid">
            <div>
              <div className="form-group">
                <label className="form-label">Código (CODART)</label>
                <input className="form-input" value={form.CODART} readOnly
                  style={{ background: "#f0f6fb", cursor: "default" }} />
              </div>
              <div className="form-group">
                <label className="form-label">Artículo</label>
                <input className="form-input" value={form.ARTICULO} readOnly
                  style={{ background: "#f0f6fb", cursor: "default" }} />
              </div>
            </div>
            <div>
              <div className="form-group">
                <label className="form-label">Área</label>
                <input className="form-input" value={form.AREA} readOnly
                  style={{ background: "#f0f6fb", cursor: "default" }} />
              </div>
              <div className="form-group">
                <label className="form-label">Familia</label>
                <input className="form-input" value={form.FAMILIA} readOnly
                  style={{ background: "#f0f6fb", cursor: "default" }} />
              </div>
            </div>
          </div>

          {/* Margen — único campo editable manualmente */}
          <div className="form-group">
            <label className="form-label">Margen *</label>
            <input
              className="form-input"
              placeholder="Ej: 30% o 1.30"
              value={form.MARGEN}
              onChange={e => setForm(p => ({ ...p, MARGEN: e.target.value }))}
            />
          </div>

          <div className="form-actions">
            <button className="btn-cancel" onClick={onCloseModal}>Cancelar</button>
            <button className="btn-save" onClick={handleSubmit}>
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
