import { useState } from "react";
import DataTable from "../Component/DataTable";
import Modal from "../Component/Modal";
import ActionBar from "../Component/ActionBar";
import ScreenHeader from "../Component/ScreenHeader";
import StatCards from "../Component/StatCards";
import ConfirmDelete from "../Component/ConfirmDelete";
import FormField from "../Component/FormField";

const COLUMNS = [
  { key: "id",      label: "ID" },
  { key: "codart",  label: "Código" },
  { key: "articulo", label: "Artículo" },
  { key: "area",    label: "Área" },
  { key: "precio",  label: "Precio",      render: (v) => v ? `$${parseFloat(v).toFixed(2)}` : "-" },
  { key: "preciorep", label: "Precio Rep.", render: (v) => v ? `$${parseFloat(v).toFixed(2)}` : "-" },
];

const EMPTY = {
  codart: "", articulo: "", area: "", artfoto: "",
  precio: "", "precio-21": "", "precio+10": "",
  "precio+10+10": "", "precio+10+15": "", preciorep: "",
};

const FIELDS_LEFT = [
  { field: "codart",   label: "Código Artículo", placeholder: "Ej: ART-001" },
  { field: "articulo", label: "Artículo *",       placeholder: "Ej: Silla ergonómica" },
  { field: "area",     label: "Área",             placeholder: "Ej: Oficina" },
  { field: "artfoto",  label: "Foto (URL)",       placeholder: "Ej: https://..." },
  { field: "precio",   label: "Precio base",      placeholder: "Ej: 15000" },
];

const FIELDS_RIGHT = [
  { field: "precio-21",    label: "Precio -21%",       placeholder: "Ej: 11850" },
  { field: "precio+10",    label: "Precio +10%",       placeholder: "Ej: 16500" },
  { field: "precio+10+10", label: "Precio +10+10%",    placeholder: "Ej: 18150" },
  { field: "precio+10+15", label: "Precio +10+15%",    placeholder: "Ej: 18975" },
  { field: "preciorep",    label: "Precio Reposición", placeholder: "Ej: 14000" },
];

const toDecimal = (v) => v !== "" && v !== null && v !== undefined ? parseFloat(v) || null : null;

export default function Productos({ productos, onSave, onDelete, selected, onSelect, modal, onOpenModal, onCloseModal }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const filtered = productos.filter((p) => {
    const q = search.toLowerCase();
    return (
      (p.articulo ?? "").toLowerCase().includes(q) ||
      (p.area     ?? "").toLowerCase().includes(q) ||
      String(p.codart ?? "").toLowerCase().includes(q)
    );
  });

  const openNew = () => { setForm(EMPTY); setError(""); onOpenModal("nuevo"); };

  const openEdit = () => {
    if (!selected) return;
    setForm({
      codart:          selected.codart          ?? "",
      articulo:        selected.articulo        ?? "",
      area:            selected.area            ?? "",
      artfoto:         selected.artfoto         ?? "",
      precio:          selected.precio          ?? "",
      "precio-21":     selected["precio-21"]    ?? "",
      "precio+10":     selected["precio+10"]    ?? "",
      "precio+10+10":  selected["precio+10+10"] ?? "",
      "precio+10+15":  selected["precio+10+15"] ?? "",
      preciorep:       selected.preciorep       ?? "",
    });
    setError("");
    onOpenModal("editar");
  };

  const handleSubmit = () => {
    if (!form.articulo.trim()) { setError("El artículo es obligatorio."); return; }
    const data = {
      ...form,
      precio:         toDecimal(form.precio),
      "precio-21":    toDecimal(form["precio-21"]),
      "precio+10":    toDecimal(form["precio+10"]),
      "precio+10+10": toDecimal(form["precio+10+10"]),
      "precio+10+15": toDecimal(form["precio+10+15"]),
      preciorep:      toDecimal(form.preciorep),
    };
    onSave(modal === "nuevo" ? data : { ...data, id: selected.id });
    onCloseModal();
    setForm(EMPTY);
  };

  const precioPromedio = productos.length
    ? (productos.reduce((acc, p) => acc + (parseFloat(p.precio) || 0), 0) / productos.length).toFixed(2)
    : "0.00";

  return (
    <>
      <ScreenHeader icon="🛒" title="Productos" subtitle="Gestión de productos" />

      <StatCards stats={[
        { label: "Total productos",   value: productos.length },
        { label: "Resultados filtro", value: filtered.length },
        { label: "Precio promedio",   value: `$${precioPromedio}` },
      ]} />

      <ActionBar
        selected={selected}
        onNew={openNew}
        onEdit={openEdit}
        onDelete={() => selected && onOpenModal("eliminar")}
        search={search}
        onSearch={setSearch}
      />

      <DataTable columns={COLUMNS} rows={filtered} selectedId={selected?.id} onSelect={onSelect} />

      {(modal === "nuevo" || modal === "editar") && (
        <Modal title={modal === "nuevo" ? "Nuevo producto" : "Editar producto"} onClose={onCloseModal}>
          {error && <p className="form-error">{error}</p>}
          <div className="form-grid">
            <div>{FIELDS_LEFT.map(f  => <FormField key={f.field} {...f} form={form} setForm={setForm} />)}</div>
            <div>{FIELDS_RIGHT.map(f => <FormField key={f.field} {...f} form={form} setForm={setForm} />)}</div>
          </div>
          <div className="form-actions">
            <button className="btn-cancel" onClick={onCloseModal}>Cancelar</button>
            <button className="btn-save"   onClick={handleSubmit}>{modal === "nuevo" ? "Guardar" : "Actualizar"}</button>
          </div>
        </Modal>
      )}

      {modal === "eliminar" && (
        <ConfirmDelete item={selected} onConfirm={onDelete} onClose={onCloseModal} />
      )}
    </>
  );
}
