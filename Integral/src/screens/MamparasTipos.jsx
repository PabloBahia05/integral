import { useState } from "react";
import DataTable from "../Component/DataTable";
import Modal from "../Component/Modal";
import ActionBar from "../Component/ActionBar";
import ScreenHeader from "../Component/ScreenHeader";
import ConfirmDelete from "../Component/ConfirmDelete";

const COLUMNS = [
  { key: "id",             label: "ID" },
  { key: "NOMBRE",         label: "Nombre" },
  { key: "CODFORMV",       label: "Cód. Vidrio" },
  { key: "FORMULA_VIDRIO", label: "Fórmula Vidrio" },
  { key: "CODFORMH",       label: "Cód. Heraje" },
  { key: "FORMULA_HERRAJE", label: "Fórmula Heraje" },
];

const EMPTY = { NOMBRE: "", CODFORMV: "", FORMULA_VIDRIO: "", CODFORMH: "", FORMULA_HERRAJE: "" };

export default function MamparasTipos({
  mamparasTipos, onSave, onDelete,
  selected, onSelect, modal, onOpenModal, onCloseModal,
}) {
  const [form, setForm]     = useState(EMPTY);
  const [error, setError]   = useState("");
  const [search, setSearch] = useState("");

  const filtered = mamparasTipos.filter((t) => {
    const q = search.toLowerCase();
    return (
      (t.NOMBRE         ?? "").toLowerCase().includes(q) ||
      (t.CODFORMV       ?? "").toLowerCase().includes(q) ||
      (t.FORMULA_VIDRIO ?? "").toLowerCase().includes(q)
    );
  });

  const openNew = () => { setForm(EMPTY); setError(""); onOpenModal("nuevo"); };

  const openEdit = () => {
    if (!selected) return;
    setForm({
      NOMBRE:         selected.NOMBRE         ?? "",
      CODFORMV:       selected.CODFORMV       ?? "",
      FORMULA_VIDRIO: selected.FORMULA_VIDRIO ?? "",
      CODFORMH:       selected.CODFORMH       ?? "",
      FORMULA_HERRAJE: selected.FORMULA_HERRAJE ?? "",
    });
    setError("");
    onOpenModal("editar");
  };

  const handleSubmit = () => {
    if (!form.NOMBRE.trim())         { setError("El nombre es obligatorio."); return; }
    if (!form.CODFORMV.trim())       { setError("El código de vidrio es obligatorio."); return; }
    if (!form.FORMULA_VIDRIO.trim()) { setError("La fórmula de vidrio es obligatoria."); return; }
    if (!form.CODFORMH.trim())       { setError("El código de heraje es obligatorio."); return; }
    if (!form.FORMULA_HERRAJE.trim()) { setError("La fórmula de heraje es obligatoria."); return; }
    onSave(modal === "nuevo" ? form : { ...form, id: selected.id });
    onCloseModal();
    setForm(EMPTY);
  };

  const set = (field, val) => setForm((p) => ({ ...p, [field]: val }));

  const hint = (
    <p style={{ fontSize: "11px", color: "#88aacc", marginTop: "4px" }}>
      Variables: <strong>ancho</strong>, <strong>alto</strong>, <strong>cantidad</strong>, <strong>colocacion</strong>
    </p>
  );

  return (
    <>
      <ScreenHeader icon="🪟" title="Tipos de Mampara" subtitle="Gestión de tipos, códigos y fórmulas" />

      <ActionBar
        selected={selected} onNew={openNew} onEdit={openEdit}
        onDelete={() => selected && onOpenModal("eliminar")}
        search={search} onSearch={setSearch}
      />

      <DataTable columns={COLUMNS} rows={filtered} selectedId={selected?.id} onSelect={onSelect} />

      {(modal === "nuevo" || modal === "editar") && (
        <Modal title={modal === "nuevo" ? "Nuevo tipo de mampara" : "Editar tipo"} onClose={onCloseModal}>
          {error && <p className="form-error">{error}</p>}

          <div className="form-group">
            <label className="form-label">Nombre *</label>
            <input className="form-input" placeholder="Ej: Corrediza Clásica"
              value={form.NOMBRE} onChange={(e) => set("NOMBRE", e.target.value)} />
          </div>

          <div className="form-grid">
            <div>
              <div className="form-group">
                <label className="form-label">Código vidrio *</label>
                <input className="form-input" placeholder="Ej: CV-CORREDIZA"
                  value={form.CODFORMV} onChange={(e) => set("CODFORMV", e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Fórmula vidrio *</label>
                <input className="form-input" placeholder="Ej: ancho * alto * cantidad * 0.00095"
                  value={form.FORMULA_VIDRIO} onChange={(e) => set("FORMULA_VIDRIO", e.target.value)} />
                {hint}
              </div>
            </div>
            <div>
              <div className="form-group">
                <label className="form-label">Código heraje *</label>
                <input className="form-input" placeholder="Ej: CH-CORREDIZA"
                  value={form.CODFORMH} onChange={(e) => set("CODFORMH", e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Fórmula heraje *</label>
                <input className="form-input" placeholder="Ej: cantidad * 8500"
                  value={form.FORMULA_HERRAJE} onChange={(e) => set("FORMULA_HERRAJE", e.target.value)} />
                {hint}
              </div>
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
