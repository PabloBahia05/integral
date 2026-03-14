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
  { key: "nombre", label: "Producto" },
  { key: "categoria", label: "Categoría" },
  { key: "precio", label: "Precio", render: (v) => `$${parseFloat(v || 0).toFixed(2)}` },
  { key: "stock", label: "Stock", render: (v) => <span className="badge">{v} u.</span> },
];

const EMPTY = { nombre: "", categoria: "", precio: "", stock: "" };

const FIELDS = [
  { field: "nombre",    label: "Producto *",           placeholder: "Ej: Silla ergonómica" },
  { field: "categoria", label: "Categoría",            placeholder: "Ej: Mobiliario" },
  { field: "precio",    label: "Precio ($) *",         placeholder: "Ej: 15000" },
  { field: "stock",     label: "Stock (unidades)",     placeholder: "Ej: 50" },
];

export default function Productos({ productos, onSave, onDelete, selected, onSelect, modal, onOpenModal, onCloseModal }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");

  const openNew = () => { setForm(EMPTY); setError(""); onOpenModal("nuevo"); };
  const openEdit = () => {
    if (!selected) return;
    setForm({ nombre: selected.nombre, categoria: selected.categoria, precio: String(selected.precio), stock: String(selected.stock) });
    setError(""); onOpenModal("editar");
  };

  const handleSubmit = () => {
    if (!form.nombre.trim()) { setError("El nombre es obligatorio."); return; }
    if (isNaN(parseFloat(form.precio))) { setError("El precio debe ser un número."); return; }
    const data = { ...form, precio: parseFloat(form.precio), stock: parseInt(form.stock) || 0 };
    onSave(modal === "nuevo" ? { ...data, id: Date.now() } : { ...data, id: selected.id });
    onCloseModal(); setForm(EMPTY);
  };

  const totalStock  = productos.reduce((acc, p) => acc + (parseInt(p.stock) || 0), 0);
  const valorTotal  = productos.reduce((acc, p) => acc + (parseFloat(p.precio) || 0) * (parseInt(p.stock) || 0), 0);

  return (
    <>
      <ScreenHeader icon="🛒" title="Productos" subtitle="Gestión de productos" />

      <StatCards stats={[
        { label: "Productos",      value: productos.length },
        { label: "Stock total",    value: totalStock },
        { label: "Valor en stock", value: `$${valorTotal.toFixed(0)}` },
      ]} />

      <ActionBar
        selected={selected}
        onNew={openNew}
        onEdit={openEdit}
        onDelete={() => selected && onOpenModal("eliminar")}
      />

      <DataTable columns={COLUMNS} rows={productos} selectedId={selected?.id} onSelect={onSelect} />

      {(modal === "nuevo" || modal === "editar") && (
        <Modal title={modal === "nuevo" ? "Nuevo producto" : "Editar producto"} onClose={onCloseModal}>
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
