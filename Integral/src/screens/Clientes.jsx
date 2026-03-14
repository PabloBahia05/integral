import { useState } from "react";
import DataTable from "../Component/DataTable";
import Modal from "../Component/Modal";
import ActionBar from "../Component/ActionBar";
import ScreenHeader from "../Component/ScreenHeader";
import StatCards from "../Component/StatCards";
import ConfirmDelete from "../Component/ConfirmDelete";
import FormField from "../Component/FormField";

const COLUMNS = [
  { key: "id", label: "ID" },
  { key: "nombre", label: "Nombre" },
  { key: "email", label: "Email" },
  { key: "telefono", label: "Teléfono" },
  { key: "ciudad", label: "Ciudad" },
];

const EMPTY = { nombre: "", email: "", telefono: "", ciudad: "" };

const FIELDS = [
  { field: "nombre",   label: "Nombre *",    placeholder: "Ej: Juan Pérez" },
  { field: "email",    label: "Email",        placeholder: "Ej: juan@email.com" },
  { field: "telefono", label: "Teléfono",     placeholder: "Ej: 291-555-1234" },
  { field: "ciudad",   label: "Ciudad",       placeholder: "Ej: Bahía Blanca" },
];

export default function Clientes({ clientes, onSave, onDelete, selected, onSelect, modal, onOpenModal, onCloseModal }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");

  const openNew = () => { setForm(EMPTY); setError(""); onOpenModal("nuevo"); };
  const openEdit = () => {
    if (!selected) return;
    setForm({ nombre: selected.nombre, email: selected.email, telefono: selected.telefono, ciudad: selected.ciudad });
    setError(""); onOpenModal("editar");
  };

  const handleSubmit = () => {
    if (!form.nombre.trim()) { setError("El nombre es obligatorio."); return; }
    onSave(modal === "nuevo" ? { ...form, id: Date.now() } : { ...form, id: selected.id });
    onCloseModal(); setForm(EMPTY);
  };

  return (
    <>
      <ScreenHeader icon="👥" title="Clientes" subtitle="Gestión de clientes" />

      <StatCards stats={[{ label: "Total clientes", value: clientes.length }]} />

      <ActionBar
        selected={selected}
        onNew={openNew}
        onEdit={openEdit}
        onDelete={() => selected && onOpenModal("eliminar")}
      />

      <DataTable columns={COLUMNS} rows={clientes} selectedId={selected?.id} onSelect={onSelect} />

      {(modal === "nuevo" || modal === "editar") && (
        <Modal title={modal === "nuevo" ? "Nuevo cliente" : "Editar cliente"} onClose={onCloseModal}>
          {error && <p className="form-error">{error}</p>}
          {FIELDS.map(f => <FormField key={f.field} {...f} form={form} setForm={setForm} />)}
          <div className="form-actions">
            <button className="btn-cancel" onClick={onCloseModal}>Cancelar</button>
            <button className="btn-save" onClick={handleSubmit}>{modal === "nuevo" ? "Guardar" : "Actualizar"}</button>
          </div>
        </Modal>
      )}

      {modal === "eliminar" && (
        <ConfirmDelete item={selected} onConfirm={onDelete} onClose={onCloseModal} />
      )}
    </>
  );
}
