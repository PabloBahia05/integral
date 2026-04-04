import { useState, useEffect, useRef } from "react";
import DataTable from "../Component/DataTable";
import Modal from "../Component/Modal";
import ActionBar from "../Component/ActionBar";
import ScreenHeader from "../Component/ScreenHeader";
import ConfirmDelete from "../Component/ConfirmDelete";

/* ─────────────────────────────────────────────
   Colocacion.jsx
   Tabla BD: colocacion (id, codart, articulo, precio)
   Endpoints usados:
     GET    /colocacion                → registros[]
     POST   /colocacion                → { id, codart, articulo, precio }
     PUT    /colocacion/:id            → { id, codart, articulo, precio }
     DELETE /colocacion/:id            → { deleted }
     GET    /articulos/rubros           → string[]
     GET    /articulos/por-rubro?rubro= → { codart, articulo, precio }[]
     GET    /articulos/rubro-de?codart= → { rubro }
───────────────────────────────────────────── */

const API = "http://localhost:3001";

const EMPTY_FORM = { id: null, rubro: "", codart: "", articulo: "", precio: "" };

const DISPLAY_COLUMNS = [
  { key: "articulo",      label: "Artículo"  },
  { key: "codart",        label: "Cód. art." },
  { key: "precioDisplay", label: "Precio"    },
];

export default function Colocacion() {
  const [selected, setSelected]         = useState(null);
  const [modal, setModal]               = useState(null);
  const onSelect     = (row) => setSelected(row?.id === selected?.id ? null : row);
  const onOpenModal  = (m)   => setModal(m);
  const onCloseModal = ()    => setModal(null);

  const [colocaciones, setColocaciones] = useState([]);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [error, setError]               = useState("");
  const [search, setSearch]             = useState("");
  const [saving, setSaving]             = useState(false);
  const pendingCodart = useRef("");

  const [rubros, setRubros]                     = useState([]);
  const [artsPorRubro, setArtsPorRubro]         = useState([]);
  const [loadingRubros, setLoadingRubros]       = useState(false);
  const [loadingArticulos, setLoadingArticulos] = useState(false);

  /* ── cargar colocaciones al montar ── */
  useEffect(() => {
    fetch(`${API}/colocacion`)
      .then((r) => r.json())
      .then((d) => setColocaciones(Array.isArray(d) ? d : []))
      .catch(() => setColocaciones([]));
  }, []);

  /* ── cargar rubros al montar ── */
  useEffect(() => {
    setLoadingRubros(true);
    fetch(`${API}/articulos/rubros`)
      .then((r) => r.json())
      .then((d) => setRubros(Array.isArray(d) ? d : []))
      .catch(() => setRubros([]))
      .finally(() => setLoadingRubros(false));
  }, []);

  /* ── cargar artículos cuando cambia el rubro ── */
  useEffect(() => {
    if (!form.rubro) { setArtsPorRubro([]); return; }
    setLoadingArticulos(true);
    fetch(`${API}/articulos/por-rubro?rubro=${encodeURIComponent(form.rubro)}`)
      .then((r) => r.json())
      .then((d) => {
        const arts = Array.isArray(d) ? d : [];
        setArtsPorRubro(arts);
        // Si hay un codart pendiente (venimos de openEdit), preseleccionar el artículo
        if (pendingCodart.current) {
          const art = arts.find((a) => a.codart === pendingCodart.current);
          if (art) {
            setForm((prev) => ({
              ...prev,
              codart:   art.codart,
              articulo: art.articulo,
            }));
          }
          pendingCodart.current = "";
        }
      })
      .catch(() => setArtsPorRubro([]))
      .finally(() => setLoadingArticulos(false));
  }, [form.rubro]);

  /* ── filas para la tabla principal ── */
  const rows = colocaciones.map((c) => ({
    ...c,
    precioDisplay: Number(c.precio).toLocaleString("es-AR", { minimumFractionDigits: 2 }),
  }));

  const filtered = rows.filter((r) => {
    const q = search.toLowerCase();
    return (
      (r.articulo ?? "").toLowerCase().includes(q) ||
      (r.codart   ?? "").toLowerCase().includes(q)
    );
  });

  /* ── abrir modal NUEVO ── */
  const openNew = () => {
    setForm(EMPTY_FORM);
    setError("");
    onOpenModal("nuevo");
  };

  /* ── abrir modal EDITAR ── */
  const openEdit = () => {
    if (!selected) return;
    pendingCodart.current = "";
    setForm({
      id:       selected.id,
      rubro:    "",
      codart:   selected.codart   ?? "",
      articulo: selected.articulo ?? "",
      precio:   selected.precio   ?? "",
    });
    setError("");
    onOpenModal("editar");
  };

  /* ── cambio de rubro: limpiar artículo ── */
  const handleRubroChange = (e) => {
    pendingCodart.current = "";
    setForm((prev) => ({
      ...prev,
      rubro:    e.target.value,
      codart:   "",
      articulo: "",
    }));
  };

  /* ── cambio de artículo: autocompletar codart ── */
  const handleArticuloChange = (e) => {
    const art = artsPorRubro.find((a) => a.codart === e.target.value);
    setForm((prev) => ({
      ...prev,
      codart:   art?.codart   ?? "",
      articulo: art?.articulo ?? "",
    }));
  };

  /* ── guardar: POST o PUT directo al servidor ── */
  const handleSubmit = async () => {
    if (modal === "nuevo" && !form.rubro)  { setError("Seleccioná un rubro."); return; }
    if (!form.codart)                      { setError("Seleccioná un artículo."); return; }
    if (form.precio === "")                { setError("El precio es obligatorio."); return; }

    const payload = {
      codart:   form.codart,
      articulo: form.articulo,
      precio:   form.precio,
    };

    setSaving(true);
    setError("");

    try {
      if (modal === "nuevo") {
        /* ── POST ── */
        const res = await fetch(`${API}/colocacion`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Error al guardar");
        const nueva = await res.json();
        setColocaciones((prev) => [...prev, nueva]);
      } else {
        /* ── PUT ── */
        const res = await fetch(`${API}/colocacion/${form.id}`, {
          method:  "PUT",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Error al actualizar");
        const actualizada = await res.json();
        setColocaciones((prev) =>
          prev.map((c) => (c.id === actualizada.id ? actualizada : c))
        );
      }

      onCloseModal();
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(err.message || "Error de conexión con el servidor.");
    } finally {
      setSaving(false);
    }
  };

  /* ── eliminar: DELETE directo al servidor ── */
  const handleDelete = async () => {
    try {
      const res = await fetch(`${API}/colocacion/${selected?.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Error al eliminar");
      setColocaciones((prev) => prev.filter((c) => c.id !== selected?.id));
      onCloseModal();
    } catch (err) {
      setError(err.message || "Error de conexión con el servidor.");
    }
  };

  /* ── render ── */
  return (
    <>
      <ScreenHeader icon="📐" title="Colocación" subtitle="Gestión de valores de colocación por artículo" />

      <ActionBar
        selected={selected}
        onNew={openNew}
        onEdit={openEdit}
        onDelete={() => selected && onOpenModal("eliminar")}
        search={search}
        onSearch={setSearch}
      />

      <DataTable
        columns={DISPLAY_COLUMNS}
        rows={filtered}
        selectedId={selected?.id}
        onSelect={onSelect}
      />

      {/* ── modal nuevo / editar ── */}
      {(modal === "nuevo" || modal === "editar") && (
        <Modal
          title={modal === "nuevo" ? "Nueva colocación" : "Editar colocación"}
          onClose={onCloseModal}
        >
          {error && <p className="form-error">{error}</p>}

          {modal === "nuevo" ? (
            <>
              {/* 1. Rubro — solo en nuevo */}
              <div className="form-group">
                <label className="form-label">Rubro *</label>
                <select
                  className="form-input"
                  value={form.rubro}
                  onChange={handleRubroChange}
                  autoFocus
                  disabled={loadingRubros}
                >
                  <option value="">
                    {loadingRubros ? "Cargando rubros..." : "— seleccionar rubro —"}
                  </option>
                  {rubros.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* 2. Artículo — solo en nuevo */}
              <div className="form-group">
                <label className="form-label">Artículo *</label>
                <select
                  className="form-input"
                  value={form.codart}
                  onChange={handleArticuloChange}
                  disabled={!form.rubro || loadingArticulos}
                  style={!form.rubro ? { background: "#f0f6fb", cursor: "not-allowed" } : {}}
                >
                  <option value="">
                    {!form.rubro
                      ? "Primero seleccioná un rubro"
                      : loadingArticulos
                      ? "Cargando artículos..."
                      : "— seleccionar artículo —"}
                  </option>
                  {artsPorRubro.map((a) => (
                    <option key={a.codart} value={a.codart}>
                      {a.articulo}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Cód. art. — read only */}
              <div className="form-group">
                <label className="form-label">Cód. art.</label>
                <input
                  className="form-input"
                  value={form.codart}
                  readOnly
                  style={{ background: "#f0f6fb", cursor: "default" }}
                />
              </div>
            </>
          ) : (
            <>
              {/* En edición: artículo y codart son read-only */}
              <div className="form-group">
                <label className="form-label">Artículo</label>
                <input
                  className="form-input"
                  value={form.articulo}
                  readOnly
                  style={{ background: "#f0f6fb", cursor: "default" }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Cód. art.</label>
                <input
                  className="form-input"
                  value={form.codart}
                  readOnly
                  style={{ background: "#f0f6fb", cursor: "default" }}
                />
              </div>
            </>
          )}

          {/* Precio — editable siempre */}
          <div className="form-group">
            <label className="form-label">Precio *</label>
            <input
              className="form-input"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={form.precio}
              autoFocus={modal === "editar"}
              onChange={(e) => setForm((prev) => ({ ...prev, precio: e.target.value }))}
            />
          </div>

          <div className="form-actions">
            <button className="btn-cancel" onClick={onCloseModal} disabled={saving}>
              Cancelar
            </button>
            <button className="btn-save" onClick={handleSubmit} disabled={saving}>
              {saving ? "Guardando..." : modal === "nuevo" ? "Guardar" : "Actualizar"}
            </button>
          </div>
        </Modal>
      )}

      {/* ── confirmación de borrado ── */}
      {modal === "eliminar" && (
        <ConfirmDelete item={selected} onConfirm={handleDelete} onClose={onCloseModal} />
      )}
    </>
  );
}
