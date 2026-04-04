import { useState, useEffect, useMemo } from "react";

const API   = "http://localhost:3001";
const SLOTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const EMPTY = () => ({
  codart: "", articulo: "",
  cod1:  "", art1:  "", margen1:  "", form1:  "",
  cod2:  "", art2:  "", margen2:  "", form2:  "",
  cod3:  "", art3:  "", margen3:  "", form3:  "",
  cod4:  "", art4:  "", margen4:  "", form4:  "",
  cod5:  "", art5:  "", margen5:  "", form5:  "",
  cod6:  "", art6:  "", margen6:  "", form6:  "",
  cod7:  "", art7:  "", margen7:  "", form7:  "",
  cod8:  "", art8:  "", margen8:  "", form8:  "",
  cod9:  "", art9:  "", margen9:  "", form9:  "",
  cod10: "", art10: "", margen10: "", form10: "",
});

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

  .ar { font-family:'DM Sans',sans-serif; background:#f0f4f8; min-height:100vh; padding:32px 28px; color:#1a2332; }

  .ar-hdr { display:flex; align-items:flex-end; justify-content:space-between; margin-bottom:28px; }
  .ar-eyebrow { font-size:11px; font-weight:500; letter-spacing:.14em; text-transform:uppercase; color:#7a92b0; }
  .ar-title { font-family:'Syne',sans-serif; font-size:32px; font-weight:800; color:#0f1f35; line-height:1; display:flex; align-items:center; gap:10px; }
  .ar-icon { width:38px; height:38px; background:linear-gradient(135deg,#2563eb,#1e40af); border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:18px; }

  .ar-bar { display:flex; gap:12px; margin-bottom:20px; align-items:center; }
  .ar-sw { position:relative; flex:1; max-width:340px; }
  .ar-si { position:absolute; left:13px; top:50%; transform:translateY(-50%); color:#94a3b8; font-size:15px; pointer-events:none; }
  .ar-s { width:100%; padding:10px 14px 10px 38px; border:1.5px solid #dde4ef; border-radius:10px; background:#fff; font-family:'DM Sans',sans-serif; font-size:14px; color:#1a2332; outline:none; box-sizing:border-box; }
  .ar-s:focus { border-color:#2563eb; box-shadow:0 0 0 3px rgba(37,99,235,.1); }
  .ar-s::placeholder { color:#aab5c8; }
  .ar-count { margin-left:auto; font-size:13px; color:#7a92b0; }

  .btn-add { padding:10px 20px; background:linear-gradient(135deg,#2563eb,#1d4ed8); color:#fff; border:none; border-radius:10px; font-family:'Syne',sans-serif; font-size:14px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:6px; box-shadow:0 4px 12px rgba(37,99,235,.3); white-space:nowrap; transition:transform .15s,box-shadow .15s; }
  .btn-add:hover { transform:translateY(-1px); }

  .ar-card { background:#fff; border-radius:16px; box-shadow:0 2px 16px rgba(15,31,53,.07); overflow:hidden; border:1px solid #e8edf5; }
  .ar-wrap { overflow-x:auto; }
  .ar-tbl { width:100%; border-collapse:collapse; font-size:13px; }
  .ar-tbl thead tr { background:#f7f9fc; border-bottom:2px solid #e8edf5; }
  .ar-tbl th { padding:11px 14px; text-align:left; font-family:'Syne',sans-serif; font-size:11px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:#7a92b0; white-space:nowrap; }
  .ar-tbl th:first-child { padding-left:18px; }
  .ar-tbl th:last-child  { padding-right:18px; text-align:right; }
  .ar-tbl td { padding:10px 14px; vertical-align:top; color:#334155; }
  .ar-tbl td:first-child { padding-left:18px; }
  .ar-tbl td:last-child  { padding-right:18px; text-align:right; }

  .row-normal { border-bottom:1px solid #f0f4f8; cursor:pointer; transition:background .12s; }
  .row-normal:hover { background:#f7f9ff; }
  .row-sel { background:#eff4ff; border-bottom:1px solid #dbeafe; cursor:pointer; }
  .row-edit-hdr { background:#f0f6ff; border-top:2px solid #2563eb; }
  .row-edit-body { background:#f7faff; border-bottom:2px solid #2563eb; }

  .b-id   { display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px; background:#eff4ff; color:#2563eb; border-radius:7px; font-family:'Syne',sans-serif; font-size:12px; font-weight:700; }
  .b-cod  { display:inline-block; padding:2px 7px; background:#f1f5f9; color:#475569; border-radius:5px; font-size:12px; font-family:monospace; }
  .b-form { display:inline-block; padding:2px 6px; background:#fef3c7; color:#92400e; border-radius:4px; font-size:11px; font-weight:700; font-family:monospace; margin-top:2px; }
  .b-mg   { display:inline-flex; align-items:center; padding:1px 6px; background:#ecfdf5; color:#059669; border-radius:4px; font-size:11px; font-weight:600; margin-top:2px; }
  .sv  { display:flex; flex-direction:column; gap:2px; min-width:90px; }
  .sv-art { font-size:12px; font-weight:500; color:#1a2332; }
  .sv-sub { font-size:11px; color:#94a3b8; font-family:monospace; }
  .sv-mt  { color:#cbd5e1; }

  .ar-acts { display:flex; gap:5px; justify-content:flex-end; }
  .bic { width:30px; height:30px; border:none; border-radius:7px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:13px; transition:background .15s,transform .1s; }
  .bic:hover { transform:scale(1.08); }
  .bic-ed { background:#eff4ff; } .bic-ed:hover { background:#dbeafe; }
  .bic-dl { background:#fff1f0; } .bic-dl:hover { background:#fee2e2; }
  .bic-ok { background:#dcfce7; } .bic-ok:hover { background:#bbf7d0; }
  .bic-cx { background:#f1f5f9; } .bic-cx:hover { background:#e2e8f0; }

  .ar-empty { display:flex; flex-direction:column; align-items:center; padding:60px 20px; gap:10px; color:#94a3b8; }

  /* panel edición inline */
  .ep { padding:16px 18px 20px; }
  .ep-sec { font-size:10px; font-weight:700; color:#7a92b0; text-transform:uppercase; letter-spacing:.1em; margin-bottom:8px; padding-bottom:6px; border-bottom:1px solid #e0eaf5; }
  .ep-padre { display:grid; grid-template-columns:160px 1fr 130px; gap:10px; margin-bottom:16px; }
  .ep-lbl { font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:.06em; margin-bottom:3px; }
  .ep-sel, .ep-inp { width:100%; padding:7px 10px; border:1.5px solid #dde4ef; border-radius:8px; background:#fff; font-family:'DM Sans',sans-serif; font-size:13px; color:#1a2332; outline:none; box-sizing:border-box; transition:border-color .2s; }
  .ep-sel:focus, .ep-inp:focus { border-color:#2563eb; }
  .ep-inp.ro { background:#f7f9fc; color:#64748b; font-family:monospace; font-size:11px; cursor:default; }

  .slots-wrap { display:grid; grid-template-columns:repeat(5,1fr); gap:8px; margin-bottom:16px; }
  @media(max-width:700px) { .slots-wrap{ grid-template-columns:repeat(2,1fr); } .ep-padre{ grid-template-columns:1fr; } }

  .sc { background:#f7f9fc; border:1.5px solid #e8edf5; border-radius:10px; padding:10px; display:flex; flex-direction:column; gap:6px; transition:border-color .2s; }
  .sc:has(select[data-on="true"]) { border-color:#bfdbfe; background:#f0f6ff; }
  .sc-num { font-family:'Syne',sans-serif; font-size:10px; font-weight:700; color:#2563eb; text-transform:uppercase; letter-spacing:.08em; }
  .sc-sel, .sc-inp { width:100%; padding:6px 8px; border:1.5px solid #dde4ef; border-radius:6px; background:#fff; font-family:'DM Sans',sans-serif; font-size:11px; color:#1a2332; outline:none; box-sizing:border-box; transition:border-color .2s; }
  .sc-sel:focus, .sc-inp:focus { border-color:#2563eb; }
  .sc-inp.ro { background:#f7f9fc; color:#64748b; font-family:monospace; font-size:10px; cursor:default; }
  .sc-mg { width:100%; padding:6px 8px; border:1.5px solid #dde4ef; border-radius:6px; background:#fff; font-family:'DM Sans',sans-serif; font-size:11px; color:#059669; font-weight:600; outline:none; box-sizing:border-box; }
  .sc-mg::placeholder { color:#94a3b8; font-weight:400; }
  .sc-mg:focus { border-color:#059669; }
  .sc-fl { font-size:9px; font-weight:700; color:#92400e; text-transform:uppercase; letter-spacing:.06em; }
  .sc-fs { width:100%; padding:6px 8px; border:1.5px solid #fde68a; border-radius:6px; background:#fffbeb; font-family:monospace; font-size:10px; color:#92400e; font-weight:700; outline:none; box-sizing:border-box; cursor:pointer; }
  .sc-fs:focus { border-color:#f59e0b; }

  .ep-acts { display:flex; gap:8px; justify-content:flex-end; padding-top:12px; border-top:1px solid #e0eaf5; }
  .ep-save   { padding:8px 20px; background:linear-gradient(135deg,#2563eb,#1d4ed8); border:none; border-radius:8px; font-family:'Syne',sans-serif; font-size:13px; font-weight:700; color:#fff; cursor:pointer; }
  .ep-save:hover { transform:translateY(-1px); }
  .ep-cancel { padding:8px 16px; border:1.5px solid #dde4ef; background:#fff; border-radius:8px; font-family:'DM Sans',sans-serif; font-size:13px; color:#64748b; cursor:pointer; }
  .ep-cancel:hover { background:#f7f9fc; }

  /* modal nuevo */
  .mo { position:fixed; inset:0; background:rgba(10,20,40,.45); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; z-index:1000; padding:20px; }
  .mo-box { background:#fff; border-radius:20px; box-shadow:0 24px 64px rgba(15,31,53,.22); width:100%; max-width:920px; max-height:92vh; overflow-y:auto; padding:32px; box-sizing:border-box; }
  .mo-hdr { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
  .mo-title { font-family:'Syne',sans-serif; font-size:20px; font-weight:800; color:#0f1f35; }
  .mo-close { width:32px; height:32px; border:none; background:#f1f5f9; border-radius:8px; cursor:pointer; font-size:14px; color:#64748b; display:flex; align-items:center; justify-content:center; }
  .mo-close:hover { background:#e2e8f0; }
  .mo-acts { display:flex; gap:10px; justify-content:flex-end; margin-top:20px; padding-top:16px; border-top:1.5px solid #f0f4f8; }
  .mo-save   { padding:10px 26px; background:linear-gradient(135deg,#2563eb,#1d4ed8); border:none; border-radius:10px; font-family:'Syne',sans-serif; font-size:14px; font-weight:700; color:#fff; cursor:pointer; box-shadow:0 4px 12px rgba(37,99,235,.3); }
  .mo-cancel { padding:10px 22px; border:1.5px solid #dde4ef; background:#fff; border-radius:10px; font-family:'DM Sans',sans-serif; font-size:14px; color:#64748b; cursor:pointer; }
`;

// ── Slot en modo edición ──────────────────────────────────────────────────────
function SlotEdit({ n, form, setForm, listaSlot, rubroSlots, setRubroSlots, rubros, formulasList }) {
  return (
    <div className="sc">
      <div className="sc-num">Art {n}</div>
      <select className="sc-sel" value={rubroSlots[n] ?? ""}
        onChange={e => {
          setRubroSlots(p => ({ ...p, [n]: e.target.value }));
          setForm(f => ({ ...f, [`art${n}`]: "", [`cod${n}`]: "" }));
        }}>
        <option value="">— Rubro —</option>
        {rubros.map(r => <option key={r} value={r}>{r}</option>)}
      </select>
      <select className="sc-sel" value={form[`art${n}`] ?? ""} data-on={!!form[`art${n}`]}
        onChange={e => {
          const found = listaSlot[n].find(a => a.articulo === e.target.value);
          setForm(f => ({ ...f, [`art${n}`]: e.target.value, [`cod${n}`]: found?.codart ?? "" }));
        }}>
        <option value="">— Ninguno —</option>
        {listaSlot[n].map(a => <option key={a.id} value={a.articulo}>{a.articulo}</option>)}
      </select>
      <input className="sc-inp ro" value={form[`cod${n}`] ?? ""} readOnly placeholder="Código" />
      <input className="sc-mg" value={form[`margen${n}`] ?? ""}
        onChange={e => setForm(f => ({ ...f, [`margen${n}`]: e.target.value }))}
        placeholder="Margen %" />
      <div className="sc-fl">🧮 Fórmula</div>
      <select className="sc-fs" value={form[`form${n}`] ?? ""}
        onChange={e => setForm(f => ({ ...f, [`form${n}`]: e.target.value }))}>
        <option value="">— Sin fórmula —</option>
        {formulasList.map(f => (
          <option key={f.codform} value={f.codform}>
            {f.codform}{f.codart ? ` (${f.codart})` : ""}
          </option>
        ))}
      </select>
    </div>
  );
}

// ── Slot en modo vista ────────────────────────────────────────────────────────
function SlotView({ row, n }) {
  const art    = row[`art${n}`];
  const cod    = row[`cod${n}`];
  const margen = row[`margen${n}`];
  const form   = row[`form${n}`];
  if (!art) return <span className="sv-mt">—</span>;
  return (
    <div className="sv">
      <span className="sv-art">{art}</span>
      {cod    && <span className="sv-sub">{cod}</span>}
      {margen && <span className="b-mg">↑ {margen}%</span>}
      {form   && <span className="b-form">🧮 {form}</span>}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function Asociaciones({
  asociaciones = [],
  selected,
  modal,
  onSave,
  onDelete,
  onSelect,
  onOpenModal,
  onCloseModal,
}) {
  const [search,        setSearch]        = useState("");
  const [articulosList, setArticulosList] = useState([]);
  const [formulasList,  setFormulasList]  = useState([]);
  const [rubros,        setRubros]        = useState([]);

  // edición inline
  const [editId,         setEditId]         = useState(null);
  const [editForm,       setEditForm]       = useState(null);
  const [editRubroPadre, setEditRubroPadre] = useState("");
  const [editRubroSlots, setEditRubroSlots] = useState(() => Object.fromEntries(SLOTS.map(n => [n, ""])));

  // modal nuevo
  const [modalOpen,     setModalOpen]     = useState(false);
  const [newForm,       setNewForm]       = useState(EMPTY());
  const [newRubroPadre, setNewRubroPadre] = useState("");
  const [newRubroSlots, setNewRubroSlots] = useState(() => Object.fromEntries(SLOTS.map(n => [n, ""])));

  useEffect(() => {
    fetch(`${API}/productos?limit=99999`)
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) return;
        setArticulosList(data);
        setRubros([...new Set(data.map(a => a.rubro).filter(Boolean))].sort());
      }).catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`${API}/formulas`)
      .then(r => r.json())
      .then(data => setFormulasList(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const listaPadreEdit = useMemo(() =>
    editRubroPadre ? articulosList.filter(a => a.rubro === editRubroPadre) : articulosList,
    [articulosList, editRubroPadre]);

  const listaPadreNew = useMemo(() =>
    newRubroPadre ? articulosList.filter(a => a.rubro === newRubroPadre) : articulosList,
    [articulosList, newRubroPadre]);

  const listaSlotEdit = useMemo(() =>
    Object.fromEntries(SLOTS.map(n => [n,
      editRubroSlots[n] ? articulosList.filter(a => a.rubro === editRubroSlots[n]) : articulosList
    ])), [articulosList, editRubroSlots]);

  const listaSlotNew = useMemo(() =>
    Object.fromEntries(SLOTS.map(n => [n,
      newRubroSlots[n] ? articulosList.filter(a => a.rubro === newRubroSlots[n]) : articulosList
    ])), [articulosList, newRubroSlots]);

  // iniciar edición inline
  const startEdit = (row) => {
    setEditId(row.id);
    setEditForm({ ...EMPTY(), ...row });
    const pf = articulosList.find(a => a.articulo === row.articulo);
    setEditRubroPadre(pf?.rubro ?? "");
    setEditRubroSlots(Object.fromEntries(
      SLOTS.map(n => {
        const f = articulosList.find(a => a.articulo === row[`art${n}`]);
        return [n, f?.rubro ?? ""];
      })
    ));
  };
  const cancelEdit = () => { setEditId(null); setEditForm(null); };
  const saveEdit   = () => { if (!editForm) return; onSave?.({ id: editId, ...editForm }); cancelEdit(); };

  // modal nuevo
  const openNew  = () => { setNewForm(EMPTY()); setNewRubroPadre(""); setNewRubroSlots(Object.fromEntries(SLOTS.map(n=>[n,""]))); setModalOpen(true); onOpenModal?.("form"); };
  const closeNew = () => { setModalOpen(false); onCloseModal?.(); };
  const saveNew  = () => { if (!newForm.codart && !newForm.articulo) return; onSave?.({ ...newForm }); closeNew(); };

  const filtered = asociaciones.filter(a =>
    !search ||
    (a.articulo ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (a.codart   ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const sharedSlotProps = (isEdit) => ({
    rubros,
    formulasList,
    form:          isEdit ? editForm       : newForm,
    setForm:       isEdit ? setEditForm    : setNewForm,
    listaSlot:     isEdit ? listaSlotEdit  : listaSlotNew,
    rubroSlots:    isEdit ? editRubroSlots : newRubroSlots,
    setRubroSlots: isEdit ? setEditRubroSlots : setNewRubroSlots,
  });

  return (
    <>
      <style>{CSS}</style>
      <div className="ar">

        <div className="ar-hdr">
          <div>
            <div className="ar-eyebrow">Gestión de productos</div>
            <div className="ar-title"><div className="ar-icon">🔗</div>Asociaciones</div>
          </div>
        </div>

        <div className="ar-bar">
          <div className="ar-sw">
            <span className="ar-si">🔍</span>
            <input className="ar-s" placeholder="Buscar…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn-add" onClick={openNew}><span>＋</span> Agregar</button>
          <span className="ar-count">{filtered.length} {filtered.length === 1 ? "registro" : "registros"}</span>
        </div>

        <div className="ar-card">
          <div className="ar-wrap">
            <table className="ar-tbl">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Código</th>
                  <th>Artículo Padre</th>
                  {SLOTS.map(n => <th key={n}>Art {n}</th>)}
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={3 + SLOTS.length + 1}>
                    <div className="ar-empty"><div style={{fontSize:36,opacity:.4}}>🔗</div><div>Sin registros</div></div>
                  </td></tr>
                ) : filtered.flatMap(row => {
                  const isEditing = editId === row.id;
                  const rows = [];

                  // fila de datos
                  rows.push(
                    <tr key={`r-${row.id}`}
                      className={isEditing ? "row-edit-hdr" : (selected?.id === row.id ? "row-sel" : "row-normal")}
                      onClick={() => !isEditing && onSelect?.(row)}
                    >
                      <td><span className="b-id">{row.id}</span></td>
                      <td><span className="b-cod">{row.codart}</span></td>
                      <td style={{fontWeight:500}}>{row.articulo}</td>
                      {SLOTS.map(n => (
                        <td key={n}>
                          {isEditing
                            ? <span style={{fontSize:10,color:"#2563eb",fontStyle:"italic"}}>↓ editando</span>
                            : <SlotView row={row} n={n} />
                          }
                        </td>
                      ))}
                      <td>
                        <div className="ar-acts">
                          {isEditing ? (
                            <>
                              <button className="bic bic-ok" title="Guardar" onClick={e=>{e.stopPropagation();saveEdit();}}>💾</button>
                              <button className="bic bic-cx" title="Cancelar" onClick={e=>{e.stopPropagation();cancelEdit();}}>✕</button>
                            </>
                          ) : (
                            <>
                              <button className="bic bic-ed" title="Editar" onClick={e=>{e.stopPropagation();startEdit(row);}}>✏️</button>
                              <button className="bic bic-dl" title="Eliminar" onClick={e=>{e.stopPropagation();if(window.confirm("¿Eliminar?"))onDelete?.(row);}}>🗑️</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );

                  // fila de edición expandida
                  if (isEditing && editForm) {
                    rows.push(
                      <tr key={`e-${row.id}`} className="row-edit-body">
                        <td colSpan={3 + SLOTS.length + 1} style={{padding:0}}>
                          <div className="ep">

                            {/* padre */}
                            <div className="ep-sec">Artículo Padre</div>
                            <div className="ep-padre">
                              <div>
                                <div className="ep-lbl">Rubro</div>
                                <select className="ep-sel" value={editRubroPadre}
                                  onChange={e => { setEditRubroPadre(e.target.value); setEditForm(f=>({...f,articulo:"",codart:""})); }}>
                                  <option value="">— Todos —</option>
                                  {rubros.map(r=><option key={r} value={r}>{r}</option>)}
                                </select>
                              </div>
                              <div>
                                <div className="ep-lbl">Artículo</div>
                                <select className="ep-sel" value={editForm.articulo}
                                  onChange={e => {
                                    const found = listaPadreEdit.find(a=>a.articulo===e.target.value);
                                    setEditForm(f=>({...f,articulo:e.target.value,codart:found?.codart??""}));
                                  }}>
                                  <option value="">— Elegir —</option>
                                  {listaPadreEdit.map(a=><option key={a.id} value={a.articulo}>{a.articulo}</option>)}
                                </select>
                              </div>
                              <div>
                                <div className="ep-lbl">Código</div>
                                <input className="ep-inp ro" value={editForm.codart} readOnly />
                              </div>
                            </div>

                            {/* slots */}
                            <div className="ep-sec">Artículos Asociados</div>
                            <div className="slots-wrap">
                              {SLOTS.map(n => <SlotEdit key={n} n={n} {...sharedSlotProps(true)} />)}
                            </div>

                            <div className="ep-acts">
                              <button className="ep-cancel" onClick={cancelEdit}>Cancelar</button>
                              <button className="ep-save"   onClick={saveEdit}>💾 Guardar cambios</button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return rows;
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Nuevo */}
        {(modal === "form" || modalOpen) && (
          <div className="mo" onClick={closeNew}>
            <div className="mo-box" onClick={e=>e.stopPropagation()}>
              <div className="mo-hdr">
                <div className="mo-title">🔗 Nueva Asociación</div>
                <button className="mo-close" onClick={closeNew}>✕</button>
              </div>

              <div className="ep-sec">Artículo Padre</div>
              <div className="ep-padre">
                <div>
                  <div className="ep-lbl">Rubro</div>
                  <select className="ep-sel" value={newRubroPadre}
                    onChange={e=>{setNewRubroPadre(e.target.value);setNewForm(f=>({...f,articulo:"",codart:""}));}}>
                    <option value="">— Todos —</option>
                    {rubros.map(r=><option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <div className="ep-lbl">Artículo</div>
                  <select className="ep-sel" value={newForm.articulo}
                    onChange={e=>{
                      const found=listaPadreNew.find(a=>a.articulo===e.target.value);
                      setNewForm(f=>({...f,articulo:e.target.value,codart:found?.codart??""}));
                    }}>
                    <option value="">— Elegir —</option>
                    {listaPadreNew.map(a=><option key={a.id} value={a.articulo}>{a.articulo}</option>)}
                  </select>
                </div>
                <div>
                  <div className="ep-lbl">Código</div>
                  <input className="ep-inp ro" value={newForm.codart} readOnly />
                </div>
              </div>

              <div className="ep-sec">Artículos Asociados</div>
              <div className="slots-wrap">
                {SLOTS.map(n => <SlotEdit key={n} n={n} {...sharedSlotProps(false)} />)}
              </div>

              <div className="mo-acts">
                <button className="mo-cancel" onClick={closeNew}>Cancelar</button>
                <button className="mo-save"   onClick={saveNew}>Agregar</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
