import { useState, useEffect, useMemo, useRef, useCallback } from "react";

const API = "http://localhost:3001";
const SLOTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const EMPTY = () => ({
  codart: "", articulo: "", rubro: "", familia: "",
  codf1: "", form1: "", codf2: "", form2: "",
  codf3: "", form3: "", codf4: "", form4: "",
  codf5: "", form5: "", codf6: "", form6: "",
  codf7: "", form7: "", codf8: "", form8: "",
  codf9: "", form9: "", codf10: "", form10: "",
});

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

  .aform-root {
    font-family: 'DM Sans', sans-serif;
    background: #f0f4f8;
    min-height: 100vh;
    padding: 32px 28px;
    color: #1a2332;
  }

  .aform-header {
    display: flex; align-items: flex-end; justify-content: space-between;
    margin-bottom: 28px;
  }
  .aform-header-left { display: flex; flex-direction: column; gap: 2px; }
  .aform-eyebrow {
    font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 500;
    letter-spacing: 0.14em; text-transform: uppercase; color: #7a92b0;
  }
  .aform-title {
    font-family: 'Syne', sans-serif; font-size: 32px; font-weight: 800;
    color: #0f1f35; line-height: 1; display: flex; align-items: center; gap: 10px;
  }
  .aform-title-icon {
    width: 38px; height: 38px;
    background: linear-gradient(135deg, #e63946, #b5242f);
    border-radius: 10px; display: flex; align-items: center; justify-content: center;
    font-size: 18px;
  }

  .aform-toolbar {
    display: flex; gap: 12px; margin-bottom: 20px;
    align-items: center; flex-wrap: wrap;
  }
  .aform-search-wrap { position: relative; flex: 1; max-width: 340px; }
  .aform-search-icon {
    position: absolute; left: 13px; top: 50%; transform: translateY(-50%);
    color: #94a3b8; font-size: 15px; pointer-events: none;
  }
  .aform-search {
    width: 100%; padding: 10px 14px 10px 38px;
    border: 1.5px solid #dde4ef; border-radius: 10px;
    background: #fff; font-family: 'DM Sans', sans-serif;
    font-size: 14px; color: #1a2332; outline: none;
    transition: border-color 0.2s, box-shadow 0.2s; box-sizing: border-box;
  }
  .aform-search:focus { border-color: #e63946; box-shadow: 0 0 0 3px rgba(230,57,70,0.1); }
  .aform-search::placeholder { color: #aab5c8; }

  .aform-btn-add {
    padding: 10px 20px;
    background: linear-gradient(135deg, #e63946, #b5242f);
    color: #fff; border: none; border-radius: 10px;
    font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700;
    cursor: pointer; display: flex; align-items: center; gap: 6px;
    transition: transform 0.15s, box-shadow 0.15s;
    box-shadow: 0 4px 12px rgba(230,57,70,0.3); white-space: nowrap;
  }
  .aform-btn-add:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(230,57,70,0.4); }
  .aform-btn-add:active { transform: translateY(0); }
  .aform-count { margin-left: auto; font-size: 13px; color: #7a92b0; }

  .aform-card {
    background: #fff; border-radius: 16px;
    box-shadow: 0 2px 16px rgba(15,31,53,0.07), 0 1px 4px rgba(15,31,53,0.05);
    overflow: hidden; border: 1px solid #e8edf5;
  }
  .aform-table-wrap { overflow-x: auto; }
  .aform-table { width: 100%; border-collapse: collapse; font-size: 13.5px; min-width: 960px; }
  .aform-table thead tr { background: #f7f9fc; border-bottom: 2px solid #e8edf5; }
  .aform-table th {
    padding: 13px 16px; text-align: left;
    font-family: 'Syne', sans-serif; font-size: 11px; font-weight: 700;
    letter-spacing: 0.08em; text-transform: uppercase; color: #7a92b0; white-space: nowrap;
  }
  .aform-table th:first-child { padding-left: 20px; }
  .aform-table th:last-child { padding-right: 20px; text-align: right; }
  .aform-table tbody tr { border-bottom: 1px solid #f0f4f8; cursor: pointer; transition: background 0.12s; }
  .aform-table tbody tr:last-child { border-bottom: none; }
  .aform-table tbody tr:hover { background: #fff8f8; }
  .aform-table tbody tr.row-selected { background: #fff0f1; }
  .aform-table td { padding: 14px 16px; vertical-align: middle; color: #334155; }
  .aform-table td:first-child { padding-left: 20px; }
  .aform-table td:last-child { padding-right: 20px; text-align: right; }

  .aform-id-badge {
    display: inline-flex; align-items: center; justify-content: center;
    width: 28px; height: 28px; background: #fff0f1; color: #e63946;
    border-radius: 7px; font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 700;
  }
  .aform-cod-badge {
    display: inline-block; padding: 3px 8px;
    background: #f1f5f9; color: #475569; border-radius: 5px;
    font-size: 12px; font-weight: 500; font-family: monospace;
  }
  .aform-form-badge {
    display: inline-block; padding: 3px 8px;
    background: #fef3c7; color: #92400e; border-radius: 5px;
    font-size: 12px; font-weight: 600; font-family: monospace;
  }
  .aform-padre-name { font-weight: 500; color: #1a2332; font-size: 13.5px; }
  .aform-slot-cell { display: flex; flex-direction: column; gap: 2px; min-width: 110px; }
  .aform-slot-form {
    font-size: 12px; font-weight: 600; font-family: monospace;
    color: #92400e; background: #fef3c7; padding: 2px 6px;
    border-radius: 4px; width: fit-content;
  }
  .aform-slot-empty { color: #cbd5e1; font-size: 14px; }

  .aform-actions { display: flex; gap: 6px; justify-content: flex-end; }
  .aform-btn-icon {
    width: 32px; height: 32px; border: none; border-radius: 8px;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    font-size: 14px; transition: background 0.15s, transform 0.1s;
  }
  .aform-btn-icon:active { transform: scale(0.92); }
  .aform-btn-edit { background: #eff6ff; }
  .aform-btn-edit:hover { background: #dbeafe; }
  .aform-btn-del { background: #fff0f1; }
  .aform-btn-del:hover { background: #fecdd3; }
  .aform-btn-dup { background: #f0fdf4; }
  .aform-btn-dup:hover { background: #bbf7d0; }

  .aform-empty { display: flex; flex-direction: column; align-items: center; padding: 60px 20px; gap: 8px; }
  .aform-empty-icon { font-size: 40px; opacity: 0.3; }
  .aform-empty-text { font-size: 14px; color: #94a3b8; font-style: italic; }

  /* ── Modal ── */
  .aform-modal-overlay {
    position: fixed; inset: 0; background: rgba(15,31,53,0.45);
    backdrop-filter: blur(3px); z-index: 1000;
    pointer-events: none;
  }
  .aform-modal-box {
    background: #fff; border-radius: 18px;
    width: 100%; max-width: 860px; max-height: 92vh; overflow-y: auto;
    box-shadow: 0 24px 60px rgba(15,31,53,0.22); padding: 28px 32px 24px;
    position: fixed; pointer-events: all;
    user-select: none;
  }
  .aform-modal-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 22px; padding-bottom: 16px; border-bottom: 1.5px solid #f0f4f8;
    cursor: grab;
  }
  .aform-modal-header:active { cursor: grabbing; }
  .aform-modal-title {
    font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800;
    color: #0f1f35; display: flex; align-items: center; gap: 8px;
  }
  .aform-modal-close {
    width: 32px; height: 32px; border: none; border-radius: 8px;
    background: #f1f5f9; cursor: pointer; font-size: 14px; color: #64748b;
    display: flex; align-items: center; justify-content: center;
  }
  .aform-modal-close:hover { background: #e2e8f0; }

  .aform-section-label {
    font-family: 'Syne', sans-serif; font-size: 11px; font-weight: 700;
    letter-spacing: 0.1em; text-transform: uppercase; color: #94a3b8;
    margin: 18px 0 10px; display: flex; align-items: center; gap: 6px;
  }
  .aform-section-label::after { content: ''; flex: 1; height: 1px; background: #f0f4f8; }

  .aform-padre-row {
    display: grid; grid-template-columns: 1fr 1fr 1fr 140px; gap: 12px;
  }
  .aform-field-group { display: flex; flex-direction: column; gap: 5px; }
  .aform-field-label {
    font-size: 11px; font-weight: 600; letter-spacing: 0.06em;
    text-transform: uppercase; color: #7a92b0;
  }
  .aform-field-select, .aform-field-input {
    padding: 9px 12px; border: 1.5px solid #dde4ef; border-radius: 8px;
    font-family: 'DM Sans', sans-serif; font-size: 13px; color: #1a2332;
    background: #fff; outline: none; transition: border-color 0.2s;
    width: 100%; box-sizing: border-box;
  }
  .aform-field-select:focus, .aform-field-input:focus {
    border-color: #e63946; box-shadow: 0 0 0 3px rgba(230,57,70,0.08);
  }
  .aform-field-input.readonly { background: #f8fafc; color: #94a3b8; cursor: default; }

  /* ── Constructor fórmula principal ── */
  .aform-constructor {
    background: #fffbeb; border: 1.5px solid #fde68a;
    border-radius: 12px; padding: 16px; margin-top: 4px;
  }
  .aform-constructor-top {
    display: grid; grid-template-columns: 180px 1fr; gap: 12px; margin-bottom: 10px;
  }
  .aform-formula-textarea {
    width: 100%; padding: 10px 12px;
    border: 1.5px solid #fbbf24; border-radius: 8px;
    font-family: monospace; font-size: 13px; color: #1a2332;
    background: #fff; outline: none; resize: vertical; min-height: 62px;
    box-sizing: border-box; transition: border-color 0.2s, box-shadow 0.2s;
  }
  .aform-formula-textarea:focus {
    border-color: #e63946; box-shadow: 0 0 0 3px rgba(230,57,70,0.08);
  }
  .aform-constructor-hint {
    font-size: 11.5px; color: #92400e; margin-top: 4px;
    display: flex; align-items: center; gap: 4px; flex-wrap: wrap;
  }

  /* Slots */
  .aform-slots-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 12px; margin-top: 2px;
  }
  .aform-slot-card {
    background: #f8fafc; border: 1.5px solid #e8edf5;
    border-radius: 10px; padding: 12px;
    display: flex; flex-direction: column; gap: 7px;
  }
  .aform-slot-card-header {
    display: flex; align-items: center; justify-content: space-between;
  }
  .aform-slot-number {
    font-family: 'Syne', sans-serif; font-size: 11px; font-weight: 700;
    color: #e63946; letter-spacing: 0.08em; text-transform: uppercase;
  }
  .aform-slot-insert-btn {
    padding: 3px 10px;
    background: linear-gradient(135deg, #e63946, #b5242f);
    color: #fff; border: none; border-radius: 6px;
    font-family: 'Syne', sans-serif; font-size: 11px; font-weight: 700;
    cursor: not-allowed; white-space: nowrap; opacity: 0.35;
    transition: opacity 0.15s, transform 0.1s, box-shadow 0.15s;
  }
  .aform-slot-insert-btn.active {
    opacity: 1; cursor: pointer;
    box-shadow: 0 2px 8px rgba(230,57,70,0.3);
  }
  .aform-slot-insert-btn.active:hover {
    transform: translateY(-1px); box-shadow: 0 4px 12px rgba(230,57,70,0.4);
  }
  .aform-slot-insert-btn.active:active { transform: translateY(0); }

  .aform-slot-select, .aform-slot-input {
    padding: 7px 10px; border: 1.5px solid #e2e8f0; border-radius: 7px;
    font-family: 'DM Sans', sans-serif; font-size: 12.5px; color: #1a2332;
    background: #fff; outline: none; transition: border-color 0.18s;
    width: 100%; box-sizing: border-box;
  }
  .aform-slot-select:focus, .aform-slot-input:focus {
    border-color: #e63946; box-shadow: 0 0 0 2px rgba(230,57,70,0.08);
  }
  .aform-slot-select[data-filled="true"] {
    background: #fffbeb; border-color: #fbbf24; font-weight: 600; color: #92400e;
  }
  .aform-slot-input.readonly {
    background: #f1f5f9; color: #94a3b8; cursor: default;
    font-family: monospace; font-size: 11.5px;
  }

  .aform-modal-actions {
    display: flex; justify-content: flex-end; gap: 10px;
    margin-top: 24px; padding-top: 18px; border-top: 1.5px solid #f0f4f8;
  }
  .aform-btn-cancel {
    padding: 10px 22px; border: 1.5px solid #dde4ef; border-radius: 9px;
    background: #fff; font-family: 'DM Sans', sans-serif; font-size: 14px;
    font-weight: 500; color: #64748b; cursor: pointer; transition: background 0.15s;
  }
  .aform-btn-cancel:hover { background: #f8fafc; }
  .aform-btn-save {
    padding: 10px 26px;
    background: linear-gradient(135deg, #e63946, #b5242f);
    color: #fff; border: none; border-radius: 9px;
    font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700;
    cursor: pointer; box-shadow: 0 4px 12px rgba(230,57,70,0.3);
    transition: transform 0.15s, box-shadow 0.15s;
  }
  .aform-btn-save:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(230,57,70,0.4); }
`;

export default function AsociacionesForm({
  asociacionesForm = [],
  productos = [],
  selected,
  modal,
  onSelect,
  onSave,
  onDelete,
  onOpenModal,
  onCloseModal,
}) {
  const [search, setSearch]       = useState("");
  const [form, setForm]           = useState(EMPTY());
  const [editId, setEditId]       = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [rubros, setRubros]       = useState([]);
  const [familias, setFamilias]   = useState([]);
  const [formulas, setFormulas]   = useState([]);

  const [rubroPadre, setRubroPadre]     = useState("");
  const [familiaPadre, setFamiliaPadre] = useState("");
  const [artsPadre, setArtsPadre]       = useState([]);

  const [rubroSlots, setRubroSlots] = useState(() =>
    Object.fromEntries(SLOTS.map(n => [n, ""]))
  );

  // Drag state for modal
  const [modalPos, setModalPos] = useState({ x: null, y: null });
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, origX: 0, origY: 0 });

  const onDragStart = useCallback((e) => {
    const box = e.currentTarget.closest(".aform-modal-box");
    if (!box) return;
    const rect = box.getBoundingClientRect();
    dragRef.current = {
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
      origX: rect.left,
      origY: rect.top,
    };
    const onMove = (ev) => {
      if (!dragRef.current.dragging) return;
      const dx = ev.clientX - dragRef.current.startX;
      const dy = ev.clientY - dragRef.current.startY;
      setModalPos({ x: dragRef.current.origX + dx, y: dragRef.current.origY + dy });
    };
    const onUp = () => {
      dragRef.current.dragging = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, []);

  // Ref al textarea — ya no se usa (fórmula principal eliminada)
  // const formulaRef = useRef(null);

  useEffect(() => {
    fetch(`${API}/articulos/rubros`).then(r => r.json()).then(setRubros).catch(() => {});
    fetch(`${API}/articulos/familias-todas`).then(r => r.json()).then(setFamilias).catch(() => {});
    fetch(`${API}/formulas`).then(r => r.json()).then(setFormulas).catch(() => {});
  }, []);

  useEffect(() => {
    if (!rubroPadre && !familiaPadre) { setArtsPadre([]); return; }
    let url = `${API}/articulos/por-rubro?`;
    if (rubroPadre)   url += `rubro=${encodeURIComponent(rubroPadre)}`;
    if (familiaPadre) url += `${rubroPadre ? "&" : ""}familia=${encodeURIComponent(familiaPadre)}`;
    fetch(url)
      .then(r => r.json())
      .then(data => setArtsPadre(Array.isArray(data) ? data : []))
      .catch(() => setArtsPadre([]));
  }, [rubroPadre, familiaPadre]);

  const openAdd = () => {
    setForm(EMPTY()); setEditId(null);
    setRubroPadre(""); setFamiliaPadre("");
    setRubroSlots(Object.fromEntries(SLOTS.map(n => [n, ""])));
    setModalPos({ x: null, y: null });
    setModalOpen(true); onOpenModal?.("form");
  };

  const openEdit = (row) => {
    setForm({ ...row }); setEditId(row.id);
    setRubroPadre(""); setFamiliaPadre("");
    setRubroSlots(Object.fromEntries(SLOTS.map(n => [n, ""])));
    setModalPos({ x: null, y: null });
    setModalOpen(true); onOpenModal?.("form");
  };

  const openDuplicate = (row) => {
    const { id, ...rest } = row;
    setForm({ ...rest, codart: "", articulo: "" });
    setEditId(null);
    setRubroPadre(""); setFamiliaPadre("");
    setRubroSlots(Object.fromEntries(SLOTS.map(n => [n, ""])));
    setModalPos({ x: null, y: null });
    setModalOpen(true); onOpenModal?.("form");
  };

  const closeModal = () => { setModalOpen(false); onCloseModal?.(); };

  // Guardar asociación
  const handleSave = async () => {
    if (!form.codart && !form.articulo) return;

    // Incluir todos los campos del form en el payload (articulo, rubro y familia
    // son columnas reales de la tabla asociaciones_form y deben enviarse al PUT)
    const payload = editId !== null
      ? { id: editId, ...form }   // makeCRUD detecta edición por !!item.id
      : { ...form };              // creación: sin id → MySQL lo autogenera
    onSave?.(payload);
    closeModal();
  };

  const handlePadreChange = (value) => {
    const found = artsPadre.find(a => a.articulo === value || a.codart === value);
    setForm(f => ({
      ...f,
      articulo: found ? found.articulo : value,
      codart:   found ? found.codart   : f.codart,
    }));
  };

  const handleSlotForm = (slot, codform) => {
    const found = formulas.find(f => f.codform === codform);
    setForm(f => ({
      ...f,
      [`codf${slot}`]: codform,
      [`form${slot}`]: found ? (found.formula ?? "") : "",
    }));
  };

  // Insertar "FORM_XXX" en el textarea del slot activo (ya no hay fórmula principal)
  const insertarSlot = (codform) => {
    if (!codform) return;
    // Sin textarea de fórmula principal, esta función queda como placeholder
  };

  const filtered = useMemo(() =>
    asociacionesForm.filter(a =>
      !search ||
      (a.articulo ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (a.codart   ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (a.codf     ?? "").toLowerCase().includes(search.toLowerCase())
    ),
    [asociacionesForm, search]
  );

  const showModal = modal === "form" || modalOpen;

  return (
    <>
      <style>{styles}</style>
      <div className="aform-root">

        <div className="aform-header">
          <div className="aform-header-left">
            <span className="aform-eyebrow">Gestión de fórmulas</span>
            <div className="aform-title">
              <div className="aform-title-icon">🧮</div>
              Asociaciones de Fórmulas
            </div>
          </div>
        </div>

        <div className="aform-toolbar">
          <div className="aform-search-wrap">
            <span className="aform-search-icon">🔍</span>
            <input
              className="aform-search"
              placeholder="Buscar por artículo, código o fórmula…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="aform-btn-add" onClick={openAdd}>
            <span>＋</span> Agregar
          </button>
          <span className="aform-count">
            {filtered.length} {filtered.length === 1 ? "registro" : "registros"}
          </span>
        </div>

        <div className="aform-card">
          <div className="aform-table-wrap">
            <table className="aform-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Cód. Art.</th>
                  <th>Artículo</th>
                  <th>Rubro</th>
                  {SLOTS.map(n => <th key={n}>Form {n}</th>)}
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4 + SLOTS.length + 1}>
                      <div className="aform-empty">
                        <div className="aform-empty-icon">🧮</div>
                        <div className="aform-empty-text">Sin registros de fórmulas asociadas</div>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map(row => (
                  <tr
                    key={row.id}
                    className={selected?.id === row.id ? "row-selected" : ""}
                    onClick={() => onSelect?.(row)}
                  >
                    <td><span className="aform-id-badge">{row.id}</span></td>
                    <td><span className="aform-cod-badge">{row.codart}</span></td>
                    <td><span className="aform-padre-name">{row.articulo}</span></td>
                    <td><span style={{ fontSize: 12, color: "#64748b" }}>{row.rubro || "—"}</span></td>
                    {SLOTS.map(n => (
                      <td key={n}>
                        {row[`codf${n}`]
                          ? <div className="aform-slot-cell"><span className="aform-slot-form">{row[`codf${n}`]}</span></div>
                          : <span className="aform-slot-empty">—</span>
                        }
                      </td>
                    ))}
                    <td>
                      <div className="aform-actions">
                        <button className="aform-btn-icon aform-btn-edit" title="Editar"
                          onClick={e => { e.stopPropagation(); openEdit(row); }}>✏️</button>
                        <button className="aform-btn-icon aform-btn-dup" title="Duplicar"
                          onClick={e => { e.stopPropagation(); openDuplicate(row); }}>📋</button>
                        <button className="aform-btn-icon aform-btn-del" title="Eliminar"
                          onClick={e => {
                            e.stopPropagation();
                            if (window.confirm("¿Eliminar esta asociación de fórmula?")) onDelete?.(row);
                          }}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Modal ── */}
        {showModal && (
          <>
            <div className="aform-modal-overlay" onClick={closeModal} style={{ pointerEvents: "all" }} />
            <div
              className="aform-modal-box"
              style={modalPos.x !== null ? { left: modalPos.x, top: modalPos.y, transform: "none" } : {
                left: "50%", top: "50%", transform: "translate(-50%, -50%)"
              }}
              onClick={e => e.stopPropagation()}
            >
              <div className="aform-modal-header" onMouseDown={onDragStart}>
                <div className="aform-modal-title">
                  🧮 {editId !== null ? "Editar Asociación de Fórmula" : "Nueva Asociación de Fórmula"}
                  <span style={{fontSize:11, fontWeight:400, color:"#94a3b8", marginLeft:6}}>⠿ arrastrar</span>
                </div>
                <button className="aform-modal-close" onClick={closeModal}>✕</button>
              </div>

              {/* ── Artículo Padre ── */}
              <div className="aform-section-label">Artículo padre</div>
              <div className="aform-padre-row">
                <div className="aform-field-group">
                  <label className="aform-field-label">Rubro</label>
                  <select className="aform-field-select" value={rubroPadre}
                    onChange={e => { setRubroPadre(e.target.value); setForm(f => ({ ...f, articulo: "", codart: "", rubro: e.target.value })); }}>
                    <option value="">— Todos —</option>
                    {rubros.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="aform-field-group">
                  <label className="aform-field-label">Familia</label>
                  <select className="aform-field-select" value={familiaPadre}
                    onChange={e => { setFamiliaPadre(e.target.value); setForm(f => ({ ...f, articulo: "", codart: "", familia: e.target.value })); }}>
                    <option value="">— Todas —</option>
                    {familias.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div className="aform-field-group">
                  <label className="aform-field-label">Artículo</label>
                  <select className="aform-field-select" value={form.articulo}
                    onChange={e => handlePadreChange(e.target.value)}>
                    <option value="">— Elegir artículo —</option>
                    {artsPadre.map(a => <option key={a.codart} value={a.articulo}>{a.articulo}</option>)}
                  </select>
                </div>
                <div className="aform-field-group">
                  <label className="aform-field-label">Código</label>
                  <input className="aform-field-input readonly" value={form.codart} readOnly placeholder="(auto)" />
                </div>
              </div>

              {/* ── Slots ── */}
              <div className="aform-section-label">Fórmulas asociadas (hasta 10)</div>
              <div className="aform-slots-grid">
                {SLOTS.map(n => {
                  const codformSlot = form[`codf${n}`];
                  return (
                    <div key={n} className="aform-slot-card">
                      <div className="aform-slot-card-header">
                        <div className="aform-slot-number">Form {n}</div>
                      </div>
                      {/* Filtro rubro (solo organización visual) */}
                      <select className="aform-slot-select" value={rubroSlots[n]}
                        onChange={e => setRubroSlots(prev => ({ ...prev, [n]: e.target.value }))}>
                        <option value="">— Filtrar por rubro —</option>
                        {rubros.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                      {/* Selector fórmula */}
                      <select
                        className="aform-slot-select"
                        value={codformSlot}
                        data-filled={!!codformSlot}
                        onChange={e => handleSlotForm(n, e.target.value)}
                      >
                        <option value="">— Ninguna —</option>
                        {formulas.map(f => (
                          <option key={f.id} value={f.codform}>{f.codform}</option>
                        ))}
                      </select>
                      {/* Preview expresión */}
                      <input
                        className="aform-slot-input readonly"
                        value={form[`form${n}`] ?? ""}
                        readOnly
                        placeholder="preview"
                      />
                    </div>
                  );
                })}
              </div>

              <div className="aform-modal-actions">
                <button className="aform-btn-cancel" onClick={closeModal}>Cancelar</button>
                <button className="aform-btn-save" onClick={handleSave}>
                  {editId !== null ? "Guardar cambios" : "Agregar"}
                </button>
              </div>

            </div>
          </>
        )}

      </div>
    </>
  );
}
