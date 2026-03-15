import { useState } from "react";
import DataTable from "../Component/DataTable";
import Modal from "../Component/Modal";
import ActionBar from "../Component/ActionBar";
import ScreenHeader from "../Component/ScreenHeader";
import StatCards from "../Component/StatCards";
import ConfirmDelete from "../Component/ConfirmDelete";
import FormField from "../Component/FormField";

const COLUMNS = [
  { key: "id",               label: "ID" },
  { key: "codcliente",       label: "Cód. Cliente" },
  { key: "nombre",           label: "Nombre" },
  { key: "domicilio fiscal", label: "Domicilio" },
  { key: "localidad",        label: "Localidad" },
  { key: "telefono1",        label: "Teléfono" },
  { key: "cuit",             label: "CUIT" },
  { key: "tipofact",         label: "Tipo Fact." },
];

const EMPTY = {
  codcliente: "", nombre: "", "domicilio fiscal": "", codloc: "",
  telefono1: "", telefono2: "", wapp: "", domrem: "",
  ubicacion: "", cuit: "", dni: "", tipofact: "",
  profesional: "", localidad: "", codpostal: "",
};

const FIELDS_LEFT = [
  { field: "codcliente",       label: "Código Cliente",  placeholder: "Ej: 1001" },
  { field: "nombre",           label: "Nombre *",         placeholder: "Ej: Juan Pérez" },
  { field: "domicilio fiscal", label: "Domicilio Fiscal", placeholder: "Ej: Av. Colón 123" },
  { field: "domrem",           label: "Dom. Remito",      placeholder: "Ej: Av. Alem 456" },
  { field: "localidad",        label: "Localidad",        placeholder: "Ej: Bahía Blanca" },
  { field: "codpostal",        label: "Código Postal",    placeholder: "Ej: 8000" },
  { field: "codloc",           label: "Cód. Localidad",   placeholder: "Ej: 06" },
  { field: "ubicacion",        label: "Ubicación",        placeholder: "Ej: Centro" },
];

const FIELDS_RIGHT = [
  { field: "telefono1",   label: "Teléfono 1",       placeholder: "Ej: 291-4551234" },
  { field: "telefono2",   label: "Teléfono 2",       placeholder: "Ej: 291-4559876" },
  { field: "wapp",        label: "WhatsApp",         placeholder: "Ej: 2914551234" },
  { field: "cuit",        label: "CUIT",             placeholder: "Ej: 20-12345678-9" },
  { field: "dni",         label: "DNI",              placeholder: "Ej: 12345678" },
  { field: "tipofact",    label: "Tipo Facturación", placeholder: "Ej: A / B / C" },
  { field: "profesional", label: "Profesional",      placeholder: "Ej: Comerciante" },
];

export default function Clientes({ clientes, onSave, onDelete, selected, onSelect, modal, onOpenModal, onCloseModal }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const filtered = clientes.filter((c) => {
    const q = search.toLowerCase();
    return (
      (c.nombre              ?? "").toLowerCase().includes(q) ||
      (c.localidad           ?? "").toLowerCase().includes(q) ||
      (c["domicilio fiscal"] ?? "").toLowerCase().includes(q) ||
      String(c.cuit       ?? "").includes(q) ||
      String(c.codcliente ?? "").includes(q)
    );
  });

  const openNew = () => { setForm(EMPTY); setError(""); onOpenModal("nuevo"); };

  const openEdit = () => {
    if (!selected) return;
    setForm({
      codcliente:         selected.codcliente          ?? "",
      nombre:             selected.nombre              ?? "",
      "domicilio fiscal": selected["domicilio fiscal"] ?? "",
      codloc:             selected.codloc              ?? "",
      telefono1:          selected.telefono1           ?? "",
      telefono2:          selected.telefono2           ?? "",
      wapp:               selected.wapp                ?? "",
      domrem:             selected.domrem              ?? "",
      ubicacion:          selected.ubicacion           ?? "",
      cuit:               selected.cuit                ?? "",
      dni:                selected.dni                 ?? "",
      tipofact:           selected.tipofact            ?? "",
      profesional:        selected.profesional         ?? "",
      localidad:          selected.localidad           ?? "",
      codpostal:          selected.codpostal           ?? "",
    });
    setError("");
    onOpenModal("editar");
  };

  const handleSubmit = () => {
    if (!form.nombre.trim()) { setError("El nombre es obligatorio."); return; }
    const data = {
      ...form,
      codcliente: form.codcliente ? parseInt(form.codcliente)  : null,
      codloc:     form.codloc     ? parseInt(form.codloc)      : null,
      telefono1:  form.telefono1  ? parseFloat(form.telefono1) : null,
      telefono2:  form.telefono2  ? parseFloat(form.telefono2) : null,
      wapp:       form.wapp       ? parseFloat(form.wapp)      : null,
      cuit:       form.cuit       ? parseFloat(form.cuit)      : null,
      dni:        form.dni        ? parseFloat(form.dni)       : null,
      codpostal:  form.codpostal  ? parseInt(form.codpostal)   : null,
    };
    onSave(modal === "nuevo" ? data : { ...data, id: selected.id });
    onCloseModal();
    setForm(EMPTY);
  };

  return (
    <>
      <ScreenHeader icon="👥" title="Clientes" subtitle="Gestión de clientes" />

      <StatCards stats={[
        { label: "Total clientes",    value: clientes.length },
        { label: "Resultados filtro", value: filtered.length },
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
        <Modal title={modal === "nuevo" ? "Nuevo cliente" : "Editar cliente"} onClose={onCloseModal}>
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
