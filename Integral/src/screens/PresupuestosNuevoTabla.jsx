import { useState, useEffect } from "react";
import DataTable from "../Component/DataTable";
import Modal from "../Component/Modal";
import ActionBar from "../Component/ActionBar";
import ScreenHeader from "../Component/ScreenHeader";
import StatCards from "../Component/StatCards";
import ConfirmDelete from "../Component/ConfirmDelete";

const API = "http://localhost:3001";

const COLUMNS_BASE = [
  { key: "numeropres", label: "N°"       },
  { key: "revision",   label: "Rev."     },
  { key: "nombre",     label: "Cliente"  },
  { key: "fecha",      label: "Fecha"    },
  { key: "valor",      label: "Total"    },
];

const formatPeso = (n) =>
  n != null && n !== "" ? "$" + Number(n).toLocaleString("es-AR").replace(/,/g, ".") : "—";

const formatFecha = (f) => {
  if (!f) return "—";
  const iso = String(f).slice(0, 10);
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return f;
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
};

const COLUMNS = COLUMNS_BASE.map((col) => {
  if (col.key === "valor") return { ...col, render: (v) => formatPeso(v) };
  if (col.key === "fecha") return { ...col, render: (v) => formatFecha(v) };
  if (col.key === "revision") return {
    ...col, render: (v) => (
      <span style={{
        display: "inline-block",
        background: Number(v) <= 1 ? "#eaf3fb" : "#fff3cd",
        color: Number(v) <= 1 ? "#2d7fc1" : "#856404",
        border: `1px solid ${Number(v) <= 1 ? "#b8d6ef" : "#ffc107"}`,
        borderRadius: "4px",
        padding: "1px 8px",
        fontSize: "11px",
        fontWeight: 700,
        fontFamily: "'Space Mono', monospace",
      }}>
        Rev. {v ?? 1}
      </span>
    ),
  };
  if (col.key === "numeropres") return {
    ...col, render: (v) => v ? String(v).padStart(4, "0") : "—",
  };
  return col;
});

const EMPTY = { nombre: "", fecha: "", valor: "" };

export default function PresupuestosNuevoTabla({ onAbrirPresupuesto }) {
  const [presupuestos, setPresupuestos] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selected, setSelected]         = useState(null);
  const [search, setSearch]             = useState("");
  const [modal, setModal]               = useState(null);
  const [form, setForm]                 = useState(EMPTY);
  const [error, setError]               = useState("");

  // Modal historial de revisiones
  const [modalHistorial, setModalHistorial] = useState(false);
  const [revisiones, setRevisiones]         = useState([]);
  const [loadingRev, setLoadingRev]         = useState(false);

  const fetchData = () => {
    setLoading(true);
    fetch(`${API}/tabla-indice`)
      .then((r) => r.json())
      .then((data) => {
        setPresupuestos(Array.isArray(data) ? data : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const normalize = (p) => ({
    ...p,
    nombre:     p.nombre     ?? p.NOMBRE     ?? "",
    fecha:      p.fecha      ?? p.FECHA      ?? "",
    valor:      p.valor      ?? p.VALOR      ?? null,
    numeropres: p.numeropres ?? p.NUMEROPRES ?? p.id,
    revision:   p.revision   ?? p.REVISION   ?? 1,
  });

  const rows = presupuestos.map(normalize);

  const filtered = rows.filter((p) => {
    const q = search.toLowerCase();
    return (
      (p.nombre     ?? "").toLowerCase().includes(q) ||
      String(p.numeropres ?? "").includes(q) ||
      (p.fecha      ?? "").includes(q)
    );
  });

  const totalPresupuestado = rows.reduce((s, p) => s + Number(p.valor ?? 0), 0);

  const openNew = () => {
    setForm(EMPTY);
    setError("");
    setModal("nuevo");
  };

  const openEdit = () => {
    if (!selected) return;
    setForm({
      nombre: selected.nombre ?? "",
      fecha:  (selected.fecha ?? "").slice(0, 10),
      valor:  selected.valor  ?? "",
    });
    setError("");
    setModal("editar");
  };

  const openHistorial = async () => {
    if (!selected) return;
    setLoadingRev(true);
    setModalHistorial(true);
    try {
      const num = selected.numeropres ?? selected.id;
      // Trae todas las revisiones del numeropres
      const res  = await fetch(`${API}/tabla-indice?numeropres=${num}`);
      const data = await res.json();
      // Si el endpoint no soporta filtro, filtramos en cliente
      const todas = Array.isArray(data) ? data : [];
      const delNum = todas.filter(r =>
        String(r.numeropres ?? r.NUMEROPRES ?? r.id) === String(num)
      );
      setRevisiones(delNum.length ? delNum : todas.slice(0, 20));
    } catch {
      setRevisiones([]);
    } finally {
      setLoadingRev(false);
    }
  };

  const handleSubmit = () => {
    if (!form.nombre.trim()) { setError("El nombre del cliente es obligatorio."); return; }
    const payload = {
      nombre: form.nombre,
      fecha:  form.fecha || (() => { const h = new Date(); return `${h.getFullYear()}-${String(h.getMonth()+1).padStart(2,"0")}-${String(h.getDate()).padStart(2,"0")}`; })(),
      valor:  form.valor !== "" ? Number(form.valor) : null,
    };

    if (modal === "editar" && selected) {
      fetch(`${API}/tabla-indice/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(() => { fetchData(); setModal(null); setSelected(null); })
        .catch((e) => setError(e.message));
    }
    // "nuevo" — no aplica aquí, los presupuestos se crean desde PresupuestoNuevo
  };

  const handleDelete = async (id) => {
    const item = presupuestos.find((r) => r.id === id);
    const num  = item?.numeropres ?? item?.id;
    try {
      await fetch(`${API}/tabla-indice/${num}`, { method: "DELETE" });
      fetchData();
      setSelected(null);
      setModal(null);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <style>{`
        .pnt-badge {
          display: inline-block;
          background: #eaf3fb;
          border: 1px solid #b8d6ef;
          border-radius: 4px;
          padding: 2px 10px;
          font-size: 11px;
          color: #2d7fc1;
          font-weight: 700;
          font-family: 'Space Mono', monospace;
        }
        .pnt-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 24px; }
        .pnt-form-group { margin-bottom: 14px; }
        .pnt-form-group label { display: block; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; color: #4a8ab5; text-transform: uppercase; margin-bottom: 5px; }
        /* Historial */
        .rev-table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 13px; }
        .rev-table th { background: #0f2944; color: #fff; padding: 8px 12px; text-align: left; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }
        .rev-table td { padding: 9px 12px; border-bottom: 1px solid #e8f0f7; color: #2a3a4a; }
        .rev-table tr:nth-child(even) td { background: #f7fafd; }
        .rev-table tr:last-child td { border-bottom: none; }
        .rev-badge { display: inline-block; border-radius: 4px; padding: 1px 8px; font-size: 11px; font-weight: 700; }
        .rev-badge-0 { background: #eaf3fb; color: #2d7fc1; border: 1px solid #b8d6ef; }
        .rev-badge-n { background: #fff3cd; color: #856404; border: 1px solid #ffc107; }
        .rev-empty { text-align: center; padding: 24px; color: #8aabb8; font-size: 13px; }
        .btn-historial {
          padding: 7px 14px;
          border-radius: 5px;
          border: 1.5px solid #b8d6ef;
          background: #eaf3fb;
          color: #2d7fc1;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
          display: flex; align-items: center; gap: 5px;
        }
        .btn-historial:hover { background: #d0e8f7; border-color: #2d7fc1; }
        .btn-historial:disabled { opacity: 0.4; cursor: default; }
        .btn-abrir {
          padding: 7px 14px;
          border-radius: 5px;
          border: 1.5px solid #4caf50;
          background: #e8f5e9;
          color: #1b5e20;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
          display: flex; align-items: center; gap: 5px;
        }
        .btn-abrir:hover { background: #c8e6c9; border-color: #2e7d32; }
        .btn-abrir:disabled { opacity: 0.4; cursor: default; }
      `}</style>

      <ScreenHeader icon="📋" title="Presupuestos" subtitle="Registro de presupuestos — tabla_indice" />

      <StatCards stats={[
        { label: "Total registros",      value: rows.length },
        { label: "Filtrados",            value: filtered.length },
        { label: "Total presupuestado",  value: formatPeso(totalPresupuestado) },
      ]} />

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <ActionBar
          selected={selected}
          onNew={null}         // los presupuestos se crean desde PresupuestoNuevo
          onEdit={openEdit}
          onDelete={() => selected && setModal("eliminar")}
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
        {onAbrirPresupuesto && (
          <button
            className="btn-abrir"
            disabled={!selected}
            onClick={() => selected && onAbrirPresupuesto(selected)}
            title="Abrir este presupuesto en el editor"
          >
            📝 Abrir
          </button>
        )}
      </div>

      {loading ? (
        <p style={{ padding: "24px", color: "#4a8ab5", fontFamily: "'Space Mono',monospace" }}>
          ⏳ Cargando presupuestos...
        </p>
      ) : (
        <DataTable
          columns={COLUMNS}
          rows={filtered}
          selectedId={selected?.id}
          onSelect={(row) => setSelected(row?.id === selected?.id ? null : row)}
        />
      )}

      {/* MODAL EDITAR */}
      {modal === "editar" && (
        <Modal
          title={`Editar encabezado N° ${String(selected?.numeropres ?? selected?.id ?? "").padStart(4, "0")}`}
          onClose={() => setModal(null)}
        >
          {error && <p className="form-error">{error}</p>}
          <div className="pnt-form-grid">
            <div>
              <div className="pnt-form-group">
                <label>Cliente *</label>
                <input
                  className="form-input"
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                />
              </div>
              <div className="pnt-form-group">
                <label>Fecha</label>
                <input
                  className="form-input"
                  type="date"
                  value={form.fecha}
                  onChange={(e) => setForm((p) => ({ ...p, fecha: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <div className="pnt-form-group">
                <label>Total ($)</label>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  value={form.valor}
                  onChange={(e) => setForm((p) => ({ ...p, valor: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <div className="form-actions">
            <button className="btn-cancel" onClick={() => setModal(null)}>Cancelar</button>
            <button className="btn-save" onClick={handleSubmit}>Actualizar</button>
          </div>
        </Modal>
      )}

      {/* MODAL HISTORIAL */}
      {modalHistorial && (
        <Modal
          title={`Revisiones — N° ${String(selected?.numeropres ?? selected?.id ?? "").padStart(4, "0")} · ${selected?.nombre ?? ""}`}
          onClose={() => setModalHistorial(false)}
        >
          {loadingRev ? (
            <p style={{ textAlign: "center", padding: "24px", color: "#4a8ab5" }}>⏳ Cargando...</p>
          ) : revisiones.length === 0 ? (
            <p className="rev-empty">No hay revisiones registradas.</p>
          ) : (
            <table className="rev-table">
              <thead>
                <tr>
                  <th>Rev.</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {revisiones.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span className={`rev-badge ${Number(r.revision ?? r.REVISION) === 0 ? "rev-badge-0" : "rev-badge-n"}`}>
                        Rev. {String(r.revision ?? r.REVISION ?? 0).padStart(2, "0")}
                      </span>
                    </td>
                    <td>{formatFecha(r.fecha ?? r.FECHA)}</td>
                    <td>{r.nombre ?? r.NOMBRE ?? "—"}</td>
                    <td style={{ fontWeight: 700, color: "#0f2944" }}>{formatPeso(r.valor ?? r.VALOR)}</td>
                    <td>
                      {onAbrirPresupuesto && (
                        <button
                          className="btn-abrir"
                          style={{ padding: "3px 10px", fontSize: 11 }}
                          onClick={() => {
                            setModalHistorial(false);
                            onAbrirPresupuesto(r);
                          }}
                        >
                          📝 Abrir
                        </button>
                      )}
                    </td>
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

      {modal === "eliminar" && (
        <ConfirmDelete
          item={selected}
          onConfirm={handleDelete}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
