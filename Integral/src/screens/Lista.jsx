import { useState } from "react";
import DataTable from "../Component/DataTable";
import Modal from "../Component/Modal";
import ActionBar from "../Component/ActionBar";
import ScreenHeader from "../Component/ScreenHeader";
import StatCards from "../Component/StatCards";
import ConfirmDelete from "../Component/ConfirmDelete";

const COLUMNS = [
  { key: "lista", label: "Lista" },
  { key: "porcentaje", label: "Porcentaje %" },
];

const EMPTY = { lista: "", porcentaje: "" };

export default function Lista({
  listas = [],
  selected,
  onSave,
  onDelete,
  onSelect,
  modal,
  onOpenModal,
  onCloseModal,
}) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const rows = Array.isArray(listas) ? listas : [];
  const filtered = rows.filter((r) => {
    const q = search.toLowerCase();
    return (
      (r.lista ?? "").toLowerCase().includes(q) ||
      String(r.porcentaje ?? "").includes(q)
    );
  });

  const openNew = () => {
    setForm(EMPTY);
    setError("");
    onOpenModal("nuevo");
  };

  const openEdit = () => {
    if (!selected) return;
    setForm({
      lista: selected.lista ?? "",
      porcentaje: selected.porcentaje ?? "",
    });
    setError("");
    onOpenModal("editar");
  };

  const handleSubmit = () => {
    if (!form.lista.trim()) {
      setError("El nombre de la lista es obligatorio.");
      return;
    }
    if (typeof onSave !== "function") {
      console.error("onSave no es función");
      return;
    }
    const payload = {
      lista: form.lista.trim(),
      porcentaje: form.porcentaje === "" ? null : Number(form.porcentaje),
    };
    onSave(modal === "nuevo" ? payload : { ...payload, id: selected.id });
    onCloseModal();
    setForm(EMPTY);
  };

  const inp = (field, type = "text", extra = {}) => (
    <input
      className="form-input"
      type={type}
      value={form[field] ?? ""}
      onChange={(e) => {
        const val =
          type === "number"
            ? e.target.value === ""
              ? ""
              : Number(e.target.value)
            : e.target.value;
        setForm((p) => ({ ...p, [field]: val }));
      }}
      {...extra}
    />
  );

  return (
    <>
      <style>{`
        .lista-badge {
          display: inline-block;
          background: #eaf3fb;
          border: 1px solid #b8d6ef;
          border-radius: 4px;
          padding: 2px 10px;
          font-size: 11px;
          color: #2d7fc1;
          font-weight: 700;
          font-family: 'Space Mono', monospace;
          letter-spacing: 0.04em;
        }
        .lista-pct {
          display: inline-block;
          background: #e8f5e9;
          border: 1px solid #a5d6a7;
          border-radius: 4px;
          padding: 2px 10px;
          font-size: 11px;
          color: #2e7d32;
          font-weight: 700;
          font-family: 'Space Mono', monospace;
        }
        .lf-grid  { display: grid; grid-template-columns: 1fr 1fr; gap: 0 24px; }
        .lf-group { margin-bottom: 14px; }
        .lf-group label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: #4a8ab5;
          text-transform: uppercase;
          margin-bottom: 5px;
        }
      `}</style>

      <ScreenHeader
        icon="📊"
        title="Lista de Márgenes"
        subtitle="Gestión de listas y porcentajes de margen"
      />

      <StatCards
        stats={[
          { label: "Total listas", value: rows.length },
          { label: "Filtradas", value: filtered.length },
        ]}
      />

      <ActionBar
        selected={selected}
        onNew={openNew}
        onEdit={openEdit}
        onDelete={() => selected && onOpenModal("eliminar")}
        search={search}
        onSearch={setSearch}
      />

      <DataTable
        columns={COLUMNS.map((col) => {
          if (col.key === "lista") {
            return {
              ...col,
              render: (v) => <span className="lista-badge">{v ?? "—"}</span>,
            };
          }
          if (col.key === "porcentaje") {
            return {
              ...col,
              render: (v) =>
                v != null && v !== "" ? (
                  <span className="lista-pct">{v}%</span>
                ) : (
                  "—"
                ),
            };
          }
          return col;
        })}
        rows={filtered}
        selected={selected}
        onSelect={onSelect}
        keyField="id"
      />

      {(modal === "nuevo" || modal === "editar") && (
        <Modal
          title={
            modal === "nuevo"
              ? "Nueva Lista de Margen"
              : "Editar Lista de Margen"
          }
          onClose={onCloseModal}
        >
          <div className="lf-grid">
            <div className="lf-group" style={{ gridColumn: "1 / -1" }}>
              <label>Nombre de la lista</label>
              {inp("lista", "text", { placeholder: "Ej: Lista 1, Lista VIP…" })}
            </div>
            <div className="lf-group" style={{ gridColumn: "1 / -1" }}>
              <label>Porcentaje (%)</label>
              {inp("porcentaje", "number", {
                placeholder: "0",
                min: 0,
                step: 0.01,
              })}
            </div>
          </div>
          {error && (
            <p style={{ color: "#e63946", fontSize: 12, marginTop: 4 }}>
              {error}
            </p>
          )}
          <div
            style={{
              display: "flex",
              gap: 10,
              marginTop: 18,
              justifyContent: "flex-end",
            }}
          >
            <button className="btn-secondary" onClick={onCloseModal}>
              Cancelar
            </button>
            <button className="btn-primary" onClick={handleSubmit}>
              {modal === "nuevo" ? "Crear" : "Guardar cambios"}
            </button>
          </div>
        </Modal>
      )}

      {modal === "eliminar" && (
        <ConfirmDelete
          message={`¿Eliminás la lista "${selected?.lista}"?`}
          onConfirm={() => {
            onDelete(selected.id);
            onCloseModal();
          }}
          onCancel={onCloseModal}
        />
      )}
    </>
  );
}
