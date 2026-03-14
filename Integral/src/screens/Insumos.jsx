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
  { key: "nombre", label: "Insumo" },
  { key: "proveedor", label: "Proveedor" },
  { key: "unidad", label: "Unidad" },
  {
    key: "cantidad",
    label: "Cantidad",
    render: (v) => <span className="badge">{v}</span>,
  },
  {
    key: "costoUnit",
    label: "Costo/u.",
    render: (v) => `$${parseFloat(v || 0).toFixed(2)}`,
  },
];

const EMPTY = {
  nombre: "",
  proveedor: "",
  unidad: "",
  cantidad: "",
  costoUnit: "",
};

const FIELDS = [
  { field: "nombre", label: "Insumo *", placeholder: "Ej: Tela de algodón" },
  { field: "proveedor", label: "Proveedor", placeholder: "Ej: Textil del Sur" },
  {
    field: "unidad",
    label: "Unidad de medida",
    placeholder: "Ej: metro, kg, litro",
  },
  { field: "cantidad", label: "Cantidad en stock", placeholder: "Ej: 200" },
  { field: "costoUnit", label: "Costo unitario ($)", placeholder: "Ej: 350" },
];

export default function Insumos({
  insumos,
  onSave,
  onDelete,
  selected,
  onSelect,
  modal,
  onOpenModal,
  onCloseModal,
}) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");

  const openNew = () => {
    setForm(EMPTY);
    setError("");
    onOpenModal("nuevo");
  };
  const openEdit = () => {
    if (!selected) return;
    setForm({
      nombre: selected.nombre,
      proveedor: selected.proveedor,
      unidad: selected.unidad,
      cantidad: String(selected.cantidad),
      costoUnit: String(selected.costoUnit),
    });
    setError("");
    onOpenModal("editar");
  };

  const handleSubmit = () => {
    if (!form.nombre.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    const data = {
      ...form,
      cantidad: parseInt(form.cantidad) || 0,
      costoUnit: parseFloat(form.costoUnit) || 0,
    };
    onSave(
      modal === "nuevo"
        ? { ...data, id: Date.now() }
        : { ...data, id: selected.id },
    );
    onCloseModal();
    setForm(EMPTY);
  };

  const totalItems = insumos.reduce(
    (acc, i) => acc + (parseInt(i.cantidad) || 0),
    0,
  );
  const valorTotal = insumos.reduce(
    (acc, i) =>
      acc + (parseFloat(i.costoUnit) || 0) * (parseInt(i.cantidad) || 0),
    0,
  );

  return (
    <>
      <ScreenHeader
        icon="📦"
        title="Insumos"
        subtitle="Gestión de insumos y materias primas"
      />

      <StatCards
        stats={[
          { label: "Insumos", value: insumos.length },
          { label: "Unidades totales", value: totalItems },
          { label: "Valor en stock", value: `$${valorTotal.toFixed(0)}` },
        ]}
      />

      <ActionBar
        selected={selected}
        onNew={openNew}
        onEdit={openEdit}
        onDelete={() => selected && onOpenModal("eliminar")}
      />

      <DataTable
        columns={COLUMNS}
        rows={insumos}
        selectedId={selected?.id}
        onSelect={onSelect}
      />

      {(modal === "nuevo" || modal === "editar") && (
        <Modal
          title={modal === "nuevo" ? "Nuevo insumo" : "Editar insumo"}
          onClose={onCloseModal}
        >
          {error && <p className="form-error">{error}</p>}
          {FIELDS.map((f) => (
            <FormField key={f.field} {...f} form={form} setForm={setForm} />
          ))}
          <div className="form-actions">
            <button className="btn-cancel" onClick={onCloseModal}>
              Cancelar
            </button>
            <button className="btn-save" onClick={handleSubmit}>
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
