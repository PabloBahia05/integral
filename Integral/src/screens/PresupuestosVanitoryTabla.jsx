import { useState, useEffect } from "react";
import DataTable from "../Component/DataTable";
import Modal from "../Component/Modal";
import ActionBar from "../Component/ActionBar";
import ScreenHeader from "../Component/ScreenHeader";
import StatCards from "../Component/StatCards";
import ConfirmDelete from "../Component/ConfirmDelete";

const API = "http://localhost:3001";

const COLUMNS_BASE = [
  { key: "NUMERO",           label: "N°"          },
  { key: "REVISION",         label: "Rev."         },
  { key: "NOMBRE",           label: "Cliente"      },
  { key: "FECHA",            label: "Fecha"        },
  { key: "MODELO",           label: "Modelo"       },
  { key: "CANTIDAD",         label: "Cant."        },
  { key: "ANCHO",            label: "Ancho"        },
  { key: "ALTO",             label: "Alto"         },
  { key: "PROFUNDO",         label: "Prof."        },
  { key: "MATERIAL",         label: "Material"     },
  { key: "MATERIAL_PRECIO",  label: "Mat. $"       },
  { key: "CORREDERA",        label: "Corredera"    },
  { key: "CORREDERA_PRECIO", label: "Cor. $"       },
  { key: "CORREDERA_CANTIDAD", label: "Cor. Cant." },
  { key: "COLOCACION",       label: "Colocación"   },
  { key: "MARGEN",           label: "Margen %"     },
  { key: "PRECIO",           label: "Total"        },
];

const EMPTY = {
  NOMBRE: "", FECHA: "", CANTIDAD: 1, MODELO: "",
  ANCHO: "", ALTO: "", PROFUNDO: "",
  MATERIAL: "", MATERIAL_PRECIO: 0,
  CORREDERA: "", CORREDERA_PRECIO: 0, CORREDERA_CANTIDAD: 1,
  COLOCACION: 0, MARGEN: 0, PRECIO: 0,
};

const formatPeso = (n) =>
  n != null ? "$" + Number(n).toLocaleString("es-AR").replace(/,/g, ".") : "—";

const formatFecha = (f) => {
  if (!f) return "—";
  const iso = String(f).slice(0, 10);
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return f;
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
};

const applyRender = (col) => {
  if (["PRECIO", "COLOCACION", "MATERIAL_PRECIO", "CORREDERA_PRECIO"].includes(col.key))
    return { ...col, render: (v) => formatPeso(v) };
  if (col.key === "FECHA")
    return { ...col, render: (v) => formatFecha(v) };
  if (col.key === "MARGEN")
    return { ...col, render: (v) => (v != null && v !== "" ? `${v}%` : "—") };
  if (col.key === "REVISION")
    return { ...col, render: (v) => (
      <span style={{
        display: "inline-block",
        background: Number(v) === 0 ? "#eaf3fb" : "#fff3cd",
        color:      Number(v) === 0 ? "#2d7fc1" : "#856404",
        border:     `1px solid ${Number(v) === 0 ? "#b8d6ef" : "#ffc107"}`,
        borderRadius: "4px", padding: "1px 8px",
        fontSize: "11px", fontWeight: 700,
        fontFamily: "'Space Mono', monospace",
      }}>
        Rev. {v ?? 0}
      </span>
    )};
  if (col.key === "NUMERO")
    return { ...col, render: (v) => v ? String(v).padStart(4, "0") : "—" };
  if (col.key === "ANCHO" || col.key === "ALTO" || col.key === "PROFUNDO")
    return { ...col, render: (v) => v ? `${v} cm` : "—" };
  return col;
};

const COLUMNS = COLUMNS_BASE.map(applyRender);

export default function PresupuestosVanitoryTabla({
  presupuestos, onSave, onDelete, selected, onSelect, modal, onOpenModal, onCloseModal,
}) {
  const [form, setForm]     = useState(EMPTY);
  const [error, setError]   = useState("");
  const [search, setSearch] = useState("");

  // Modal historial
  const [modalHistorial, setModalHistorial] = useState(false);
  const [revisiones, setRevisiones]         = useState([]);
  const [loadingRev, setLoadingRev]         = useState(false);

  const normalize = (p) => ({
    ...p,
    NOMBRE:             p.NOMBRE             ?? p.nombre             ?? "",
    FECHA:              p.FECHA              ?? p.fecha              ?? "",
    CANTIDAD:           p.CANTIDAD           ?? p.cantidad           ?? "",
    MODELO:             p.MODELO             ?? p.modelo             ?? "",
    ANCHO:              p.ANCHO              ?? p.ancho              ?? "",
    ALTO:               p.ALTO               ?? p.alto               ?? "",
    PROFUNDO:           p.PROFUNDO           ?? p.profundo           ?? "",
    MATERIAL:           p.MATERIAL           ?? p.material           ?? "",
    MATERIAL_PRECIO:    p.MATERIAL_PRECIO    ?? p.material_precio    ?? 0,
    CORREDERA:          p.CORREDERA          ?? p.corredera          ?? "",
    CORREDERA_PRECIO:   p.CORREDERA_PRECIO   ?? p.corredera_precio   ?? 0,
    CORREDERA_CANTIDAD: p.CORREDERA_CANTIDAD ?? p.corredera_cantidad ?? 1,
    COLOCACION:         p.COLOCACION         ?? p.colocacion         ?? 0,
    MARGEN:             p.MARGEN             ?? p.margen             ?? 0,
    REVISION:           p.REVISION           ?? p.revision           ?? 0,
    PRECIO:             p.PRECIO             ?? p.precio             ?? 0,
  });

  const rows = (Array.isArray(presupuestos) ? presupuestos : []).map(normalize);

  const filtered = rows.filter((p) => {
    const q = search.toLowerCase();
    return (
      (p.NOMBRE  ?? "").toLowerCase().includes(q) ||
      (p.MODELO  ?? "").toLowerCase().includes(q) ||
      String(p.NUMERO ?? p.id ?? "").includes(q)
    );
  });

  const openNew = () => {
    setForm(EMPTY); setError("");
    onOpenModal("nuevo");
  };

  const openEdit = () => {
    if (!selected) return;
    setForm({
      NOMBRE:             selected.NOMBRE             ?? "",
      FECHA:              (selected.FECHA ?? "").slice(0, 10),
      CANTIDAD:           selected.CANTIDAD           ?? 1,
      MODELO:             selected.MODELO             ?? "",
      ANCHO:              selected.ANCHO              ?? "",
      ALTO:               selected.ALTO               ?? "",
      PROFUNDO:           selected.PROFUNDO           ?? "",
      MATERIAL:           selected.MATERIAL           ?? "",
      MATERIAL_PRECIO:    selected.MATERIAL_PRECIO    ?? 0,
      CORREDERA:          selected.CORREDERA          ?? "",
      CORREDERA_PRECIO:   selected.CORREDERA_PRECIO   ?? 0,
      CORREDERA_CANTIDAD: selected.CORREDERA_CANTIDAD ?? 1,
      COLOCACION:         selected.COLOCACION         ?? 0,
      MARGEN:             selected.MARGEN             ?? 0,
      PRECIO:             selected.PRECIO             ?? 0,
    });
    setError("");
    onOpenModal("editar");
  };

  const openHistorial = async () => {
    if (!selected) return;
    setLoadingRev(true);
    setModalHistorial(true);
    try {
      const numeroParam = selected.NUMERO ?? selected.id;
      const res  = await fetch(`${API}/presupuestos-vanitory/${numeroParam}/revisiones`);
      const data = await res.json();
      setRevisiones(Array.isArray(data) ? data : []);
    } catch {
      setRevisiones([]);
    } finally {
      setLoadingRev(false);
    }
  };

  const handleSubmit = () => {
    if (!form.NOMBRE.trim()) { setError("El nombre del cliente es obligatorio."); return; }
    if (!form.MODELO.trim()) { setError("El modelo es obligatorio."); return; }

    const payload = {
      NOMBRE:             form.NOMBRE,
      FECHA:              form.FECHA || new Date().toISOString().slice(0, 10),
      CANTIDAD:           Number(form.CANTIDAD),
      MODELO:             form.MODELO,
      ANCHO:              Number(form.ANCHO)              || 0,
      ALTO:               Number(form.ALTO)               || 0,
      PROFUNDO:           Number(form.PROFUNDO)           || 0,
      MATERIAL:           form.MATERIAL                   || null,
      MATERIAL_PRECIO:    Number(form.MATERIAL_PRECIO)    || 0,
      CORREDERA:          form.CORREDERA                  || null,
      CORREDERA_PRECIO:   Number(form.CORREDERA_PRECIO)   || 0,
      CORREDERA_CANTIDAD: Number(form.CORREDERA_CANTIDAD) || 1,
      COLOCACION:         Number(form.COLOCACION)         || 0,
      MARGEN:             Number(form.MARGEN)             || 0,
      PRECIO:             Number(form.PRECIO)             || 0,
    };

    onSave(modal === "nuevo"
      ? payload
      : { ...payload, NUMERO: selected.NUMERO ?? selected.id }
    );
    onCloseModal();
    setForm(EMPTY);
  };

  const inp = (field, type = "text", extra = {}) => (
    <input
      className="form-input"
      type={type}
      value={form[field] ?? ""}
      onChange={(e) => {
        const val = type === "number"
          ? (e.target.value === "" ? "" : Number(e.target.value))
          : e.target.value;
        setForm((p) => ({ ...p, [field]: val }));
      }}
      {...extra}
    />
  );

  const totalPresupuestado = rows.reduce((s, p) => s + Number(p.PRECIO ?? 0), 0);

  return (
    <>
      <style>{`
        .pvtabla-badge {
          display: inline-block; background: #eaf3fb; border: 1px solid #b8d6ef;
          border-radius: 4px; padding: 2px 10px; font-size: 11px; color: #2d7fc1;
          font-weight: 700; font-family: 'Space Mono', monospace; letter-spacing: 0.04em;
        }
        .pv-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 24px; }
        .pv-form-group { margin-bottom: 14px; }
        .pv-form-group label { display: block; font-size: 11px; font-weight: 700;
          letter-spacing: 0.12em; color: #4a8ab5; text-transform: uppercase; margin-bottom: 5px; }
        .pv-section-title {
          font-size: 11px; font-weight: 700; letter-spacing: 0.12em; color: #4a8ab5;
          text-transform: uppercase; margin: 18px 0 10px;
          border-bottom: 1.5px solid #e8f0f7; padding-bottom: 6px;
        }
        /* Historial */
        .rev-table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 13px; }
        .rev-table th { background: #0f2944; color: #fff; padding: 8px 12px; text-align: left;
          font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }
        .rev-table td { padding: 9px 12px; border-bottom: 1px solid #e8f0f7; color: #2a3a4a; }
        .rev-table tr:nth-child(even) td { background: #f7fafd; }
        .rev-table tr:last-child td { border-bottom: none; }
        .rev-badge { display: inline-block; border-radius: 4px; padding: 1px 8px; font-size: 11px; font-weight: 700; }
        .rev-badge-0 { background: #eaf3fb; color: #2d7fc1; border: 1px solid #b8d6ef; }
        .rev-badge-n { background: #fff3cd; color: #856404; border: 1px solid #ffc107; }
        .rev-empty { text-align: center; padding: 24px; color: #8aabb8; font-size: 13px; }
        .btn-historial {
          padding: 7px 14px; border-radius: 5px; border: 1.5px solid #b8d6ef;
          background: #eaf3fb; color: #2d7fc1; font-size: 13px; font-weight: 700;
          cursor: pointer; transition: all 0.15s; display: flex; align-items: center; gap: 5px;
        }
        .btn-historial:hover { background: #d0e8f7; border-color: #2d7fc1; }
        .btn-historial:disabled { opacity: 0.4; cursor: default; }
      `}</style>

      <ScreenHeader icon="🛁" title="Presupuestos Vanitory" subtitle="Historial y gestión de presupuestos" />

      <StatCards stats={[
        { label: "Total presupuestos",   value: rows.length },
        { label: "Filtrados",            value: filtered.length },
        { label: "Total presupuestado",  value: formatPeso(totalPresupuestado) },
      ]} />

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <ActionBar
          selected={selected}
          onNew={openNew}
          onEdit={openEdit}
          onDelete={() => selected && onOpenModal("eliminar")}
          search={search}
          onSearch={setSearch}
        />
        <button
          className="btn-historial"
          disabled={!selected}
          onClick={openHistorial}
          title="Ver historial de revisiones"
        >
          🕓 Revisiones
        </button>
      </div>

      <DataTable
        columns={COLUMNS}
        rows={filtered}
        selectedId={selected?.id}
        onSelect={onSelect}
      />

      {/* ── MODAL NUEVO / EDITAR ── */}
      {(modal === "nuevo" || modal === "editar") && (
        <Modal
          title={modal === "nuevo"
            ? "Nuevo presupuesto vanitory"
            : `Editar presupuesto N° ${String(selected?.NUMERO ?? selected?.id ?? "").padStart(4, "0")} — guardará nueva revisión`}
          onClose={onCloseModal}
        >
          {error && <p className="form-error">{error}</p>}

          {/* ── Datos generales ── */}
          <div className="pv-section-title">🛁 Datos generales</div>
          <div className="pv-form-grid">
            <div>
              <div className="pv-form-group">
                <label>Cliente *</label>
                {inp("NOMBRE")}
              </div>
              <div className="pv-form-group">
                <label>Fecha</label>
                {inp("FECHA", "date")}
              </div>
              <div className="pv-form-group">
                <label>Modelo *</label>
                {inp("MODELO")}
              </div>
              <div className="pv-form-group">
                <label>Cantidad</label>
                {inp("CANTIDAD", "number", { min: 1 })}
              </div>
            </div>
            <div>
              <div className="pv-form-group">
                <label>Ancho (cm)</label>
                {inp("ANCHO", "number", { min: 0 })}
              </div>
              <div className="pv-form-group">
                <label>Alto (cm)</label>
                {inp("ALTO", "number", { min: 0 })}
              </div>
              <div className="pv-form-group">
                <label>Profundo (cm)</label>
                {inp("PROFUNDO", "number", { min: 0 })}
              </div>
              <div className="pv-form-group">
                <label>Colocación ($)</label>
                {inp("COLOCACION", "number", { min: 0 })}
              </div>
            </div>
          </div>

          {/* ── Material ── */}
          <div className="pv-section-title">🪵 Material</div>
          <div className="pv-form-grid">
            <div className="pv-form-group">
              <label>Material</label>
              {inp("MATERIAL")}
            </div>
            <div className="pv-form-group">
              <label>Precio material ($)</label>
              {inp("MATERIAL_PRECIO", "number", { min: 0 })}
            </div>
          </div>

          {/* ── Corredera ── */}
          <div className="pv-section-title">🔩 Corredera</div>
          <div className="pv-form-grid">
            <div>
              <div className="pv-form-group">
                <label>Corredera</label>
                {inp("CORREDERA")}
              </div>
              <div className="pv-form-group">
                <label>Precio corredera ($)</label>
                {inp("CORREDERA_PRECIO", "number", { min: 0 })}
              </div>
            </div>
            <div>
              <div className="pv-form-group">
                <label>Cantidad correderas</label>
                {inp("CORREDERA_CANTIDAD", "number", { min: 1 })}
              </div>
            </div>
          </div>

          {/* ── Margen y precio ── */}
          <div className="pv-section-title">📈 Precio final</div>
          <div className="pv-form-grid">
            <div className="pv-form-group">
              <label>Margen (%)</label>
              {inp("MARGEN", "number", { min: 0, step: 0.5 })}
            </div>
            <div className="pv-form-group">
              <label>Precio total ($)</label>
              <div style={{
                padding: "9px 12px", background: "#f7fafd",
                border: "1.5px solid #d0dde8", borderRadius: "6px",
                fontSize: "16px", fontWeight: 700, color: "#0f2944",
                fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.04em",
                minHeight: "40px", display: "flex", alignItems: "center",
              }}>
                {formatPeso(form.PRECIO)}
              </div>
            </div>
          </div>

          {modal === "editar" && (
            <p style={{
              fontSize: "12px", color: "#856404", background: "#fff3cd",
              border: "1px solid #ffc107", borderRadius: "5px",
              padding: "8px 12px", marginBottom: "12px",
            }}>
              ⚠️ Al actualizar se guardará una nueva revisión incremental. Las revisiones anteriores se conservan.
            </p>
          )}

          <div className="form-actions">
            <button className="btn-cancel" onClick={onCloseModal}>Cancelar</button>
            <button className="btn-save" onClick={handleSubmit}>
              {modal === "nuevo" ? "Guardar" : "Actualizar (nueva revisión)"}
            </button>
          </div>
        </Modal>
      )}

      {/* ── MODAL HISTORIAL DE REVISIONES ── */}
      {modalHistorial && (
        <Modal
          title={`Historial de revisiones — N° ${String(selected?.NUMERO ?? selected?.id ?? "").padStart(4, "0")} · ${selected?.NOMBRE ?? ""}`}
          onClose={() => setModalHistorial(false)}
        >
          {loadingRev ? (
            <p style={{ textAlign: "center", padding: "24px", color: "#4a8ab5" }}>⏳ Cargando revisiones...</p>
          ) : revisiones.length === 0 ? (
            <p className="rev-empty">No hay revisiones registradas para este presupuesto.</p>
          ) : (
            <table className="rev-table">
              <thead>
                <tr>
                  <th>Rev.</th>
                  <th>Fecha edición</th>
                  <th>Modelo</th>
                  <th>Ancho</th>
                  <th>Alto</th>
                  <th>Prof.</th>
                  <th>Material</th>
                  <th>Mat. $</th>
                  <th>Corredera</th>
                  <th>Cor. $</th>
                  <th>Cor. Cant.</th>
                  <th>Colocación</th>
                  <th>Margen %</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {revisiones.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span className={`rev-badge ${Number(r.REVISION) === 0 ? "rev-badge-0" : "rev-badge-n"}`}>
                        Rev. {r.REVISION}
                      </span>
                    </td>
                    <td>{formatFecha(r.FECHA_REVISION ?? r.FECHA)}</td>
                    <td>{r.MODELO ?? "—"}</td>
                    <td>{r.ANCHO    ? `${r.ANCHO} cm`    : "—"}</td>
                    <td>{r.ALTO     ? `${r.ALTO} cm`     : "—"}</td>
                    <td>{r.PROFUNDO ? `${r.PROFUNDO} cm` : "—"}</td>
                    <td>{r.MATERIAL           || "—"}</td>
                    <td>{formatPeso(r.MATERIAL_PRECIO)}</td>
                    <td>{r.CORREDERA          || "—"}</td>
                    <td>{formatPeso(r.CORREDERA_PRECIO)}</td>
                    <td>{r.CORREDERA_CANTIDAD ?? "—"}</td>
                    <td>{formatPeso(r.COLOCACION)}</td>
                    <td>{r.MARGEN != null ? `${r.MARGEN}%` : "—"}</td>
                    <td style={{ fontWeight: 700, color: "#0f2944" }}>{formatPeso(r.PRECIO)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="form-actions" style={{ marginTop: "16px" }}>
            <button className="btn-cancel" onClick={() => setModalHistorial(false)}>Cerrar</button>
          </div>
        </Modal>
      )}

      {/* ── CONFIRMAR ELIMINAR ── */}
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
