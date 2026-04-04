import { useState } from "react";
import DataTable from "../Component/DataTable";
import Modal from "../Component/Modal";
import ActionBar from "../Component/ActionBar";
import ScreenHeader from "../Component/ScreenHeader";
import ConfirmDelete from "../Component/ConfirmDelete";

const COLUMNS = [
  { key: "id",          label: "ID" },
  { key: "NOMBRE",      label: "Nombre" },
  { key: "DESCRIPCION", label: "Descripción" },
  { key: "MATERIAL",    label: "Material" },
  { key: "PRECIO_BASE", label: "Precio Base ($)" },
];

const EMPTY = { NOMBRE: "", DESCRIPCION: "", MATERIAL: "", PRECIO_BASE: "" };

export default function TiposDespensero({
  tiposDespensero, onSave, onDelete,
  selected, onSelect, modal, onOpenModal, onCloseModal,
}) {
  const [form, setForm]     = useState(EMPTY);
  const [error, setError]   = useState("");
  const [search, setSearch] = useState("");

  const filtered = (tiposDespensero ?? []).filter((t) => {
    const q = search.toLowerCase();
    return (
      (t.NOMBRE      ?? "").toLowerCase().includes(q) ||
      (t.MATERIAL    ?? "").toLowerCase().includes(q) ||
      (t.DESCRIPCION ?? "").toLowerCase().includes(q)
    );
  });

  const openNew = () => { setForm(EMPTY); setError(""); onOpenModal("nuevo"); };

  const openEdit = () => {
    if (!selected) return;
    setForm({
      NOMBRE:      selected.NOMBRE      ?? "",
      DESCRIPCION: selected.DESCRIPCION ?? "",
      MATERIAL:    selected.MATERIAL    ?? "",
      PRECIO_BASE: selected.PRECIO_BASE ?? "",
    });
    setError("");
    onOpenModal("editar");
  };

  const handleSubmit = () => {
    if (!form.NOMBRE.trim()) { setError("El nombre es obligatorio."); return; }
    onSave(modal === "nuevo" ? form : { ...form, id: selected.id });
    onCloseModal();
    setForm(EMPTY);
  };

  const set = (field, val) => setForm((p) => ({ ...p, [field]: val }));

  return (
    <>
      <ScreenHeader icon="🗄️" title="Tipos de Despensero" subtitle="Gestión de tipos de despensero" />

      <ActionBar
        selected={selected} onNew={openNew} onEdit={openEdit}
        onDelete={() => selected && onOpenModal("eliminar")}
        search={search} onSearch={setSearch}
      />

      <DataTable columns={COLUMNS} rows={filtered} selectedId={selected?.id} onSelect={onSelect} />

      {(modal === "nuevo" || modal === "editar") && (
        <Modal title={modal === "nuevo" ? "Nuevo tipo de despensero" : "Editar tipo de despensero"} onClose={onCloseModal}>
          {error && <p className="form-error">{error}</p>}

          <div className="form-group">
            <label className="form-label">Nombre *</label>
            <input className="form-input" placeholder="Ej: Despensero Alto"
              value={form.NOMBRE} onChange={(e) => set("NOMBRE", e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Descripción</label>
            <input className="form-input" placeholder="Ej: Mueble despensero con puertas batientes"
              value={form.DESCRIPCION} onChange={(e) => set("DESCRIPCION", e.target.value)} />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Material</label>
              <input className="form-input" placeholder="Ej: Melamina, Roble"
                value={form.MATERIAL} onChange={(e) => set("MATERIAL", e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Precio Base ($)</label>
              <input className="form-input" type="number" placeholder="Ej: 95000"
                value={form.PRECIO_BASE} onChange={(e) => set("PRECIO_BASE", e.target.value)} />
            </div>
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
