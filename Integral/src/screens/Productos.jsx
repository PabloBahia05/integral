import { useState, useRef, useEffect, useCallback } from "react";
import DataTable from "../Component/DataTable";
import Modal from "../Component/Modal";
import ActionBar from "../Component/ActionBar";
import ScreenHeader from "../Component/ScreenHeader";
import ConfirmDelete from "../Component/ConfirmDelete";
import FormField from "../Component/FormField";

const COLUMNS = [
  { key: "codart",    label: "Código" },
  { key: "articulo",  label: "Artículo" },
  { key: "rubro",     label: "Rubro" },
  { key: "unidad",    label: "Unidad" },
  { key: "precio",    label: "Precio", render: (v) => v != null ? `$${parseFloat(v).toLocaleString("es-AR")}` : "-" },
  { key: "proveedor", label: "Proveedor" },
  { key: "cantidad",  label: "Cantidad" },
  { key: "ancho",     label: "Ancho" },
  { key: "alto",      label: "Alto" },
  { key: "linea",  label: "Línea" },
  { key: "color",     label: "Color" },
  { key: "familia",   label: "Familia" },
  { key: "area",      label: "Área" },
];

const EMPTY = {
  codart: "", articulo: "", area: "", unidad: "", artfoto: "",
  precio: "", proveedor: "", cantidad: "", ancho: "", alto: "",
  linea: "", color: "", familia: "", rubro: "",
  costosi: "", costosicf: "", costo_placa: "",
};

const FIELDS_LEFT_TOP = [
  { field: "codart",    label: "Código Artículo", placeholder: "Ej: ADR00015" },
  { field: "articulo",  label: "Artículo *",       placeholder: "Ej: Mampara corrediza" },
];

const FIELDS_LEFT_BOTTOM = [
  { field: "unidad",    label: "Unidad",                placeholder: "Ej: UN, M2, KG" },
  { field: "costosi",   label: "Costo sin impuestos",   placeholder: "Ej: 45000" },
  { field: "costosicf", label: "Costo con flete",       placeholder: "Ej: 52000" },
  { field: "precio",    label: "Precio ($)",            placeholder: "Ej: 58000" },
  { field: "proveedor", label: "Proveedor",             placeholder: "Ej: Legho" },
  { field: "cantidad",  label: "Cantidad",              placeholder: "Ej: 1" },
];

const FIELDS_RIGHT = [
  { field: "ancho",    label: "Ancho (cm)",  placeholder: "Ej: 80" },
  { field: "alto",     label: "Alto (cm)",   placeholder: "Ej: 200" },
  { field: "linea", label: "Línea",    placeholder: "Ej: Living" },
  { field: "color",    label: "Color",       placeholder: "Ej: 1" },
  { field: "area",     label: "Área",        placeholder: "Ej: 01" },
];

const toDecimal = (v) => (v !== "" && v !== null && v !== undefined ? parseFloat(v) || null : null);
const toInt     = (v) => (v !== "" && v !== null && v !== undefined ? parseInt(v)   || null : null);
const fmt       = (v) => (v != null ? `$${parseFloat(v).toLocaleString("es-AR")}` : "-");

async function uploadImageToCloud(file) {
  const formData = new FormData();
  formData.append("imagen", file);
  const res = await fetch("http://localhost:3001/api/upload-imagen", { method: "POST", body: formData });
  if (!res.ok) throw new Error("Error al subir imagen");
  return (await res.json()).url;
}

function FotoUpload({ value, onChange }) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const inputRef = useRef(null);

  const processFile = async (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setLoading(true); setError("");
    try { onChange(await uploadImageToCloud(file)); }
    catch { setError("No se pudo subir la imagen."); }
    finally { setLoading(false); }
  };

  return (
    <div className="form-field">
      <label className="form-label">Foto del artículo</label>
      <div
        className={`foto-dropzone${dragging ? " foto-dropzone--active" : ""}`}
        onDrop={(e) => { e.preventDefault(); setDragging(false); processFile(e.dataTransfer.files[0]); }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onClick={() => !loading && inputRef.current.click()}
      >
        {loading ? <div className="foto-placeholder"><span className="foto-hint">⏳ Subiendo...</span></div>
          : value ? <img src={value} alt="Preview" className="foto-preview" />
          : <div className="foto-placeholder">
              <span className="foto-icon">🖼️</span>
              <span className="foto-hint">{dragging ? "Soltá aquí" : "Arrastrá o hacé clic"}</span>
            </div>}
        <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }}
          onChange={(e) => processFile(e.target.files[0])} />
      </div>
      {error && <p style={{ color: "red", fontSize: "0.8rem", marginTop: 4 }}>{error}</p>}
      <input type="text" className="form-input" style={{ marginTop: "6px" }}
        placeholder="O pegá una URL: https://..."
        value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
      {value && (
        <button type="button" className="btn-cancel"
          style={{ marginTop: "6px", fontSize: "0.8rem", padding: "4px 10px" }}
          onClick={() => onChange("")}>Quitar imagen</button>
      )}
    </div>
  );
}

function DetalleArticulo({ producto }) {
  if (!producto) return (
    <div className="detalle-panel detalle-panel--vacio">
      <span className="detalle-hint">Seleccioná un artículo para ver el detalle</span>
    </div>
  );
  return (
    <div className="detalle-panel">
      <div className="detalle-foto">
        {producto.artfoto && producto.artfoto !== "null"
          ? <img src={producto.artfoto} alt={producto.articulo} className="detalle-img" />
          : <div className="detalle-sin-foto"><span>🖼️</span><small>Sin imagen</small></div>}
      </div>
      <h3 className="detalle-nombre">{producto.articulo}</h3>
      {producto.codart    && <p className="detalle-codigo">Código: <strong>{producto.codart}</strong></p>}
      {producto.rubro     && <p className="detalle-codigo">Rubro: <strong>{producto.rubro}</strong></p>}
      {producto.area      && <p className="detalle-codigo">Área: <strong>{producto.area}</strong></p>}
      {producto.unidad    && <p className="detalle-codigo">Unidad: <strong>{producto.unidad}</strong></p>}
      {producto.proveedor && <p className="detalle-codigo">Proveedor: <strong>{producto.proveedor}</strong></p>}
      {producto.color     && <p className="detalle-codigo">Color: <strong>{producto.color}</strong></p>}
      {producto.linea     && <p className="detalle-codigo">Línea: <strong>{producto.linea}</strong></p>}
      {producto.familia   && <p className="detalle-codigo">Familia: <strong>{producto.familia}</strong></p>}
      <div className="detalle-precios">
        <div className="detalle-precio-row"><span>Precio</span><strong>{fmt(producto.precio)}</strong></div>
        <div className="detalle-precio-row"><span>Cantidad</span><strong>{producto.cantidad ?? "-"}</strong></div>
        {(producto.ancho || producto.alto) && (
          <div className="detalle-precio-row">
            <span>Medidas</span><strong>{producto.ancho ?? "?"} × {producto.alto ?? "?"} cm</strong>
          </div>
        )}
      </div>
    </div>
  );
}

const API = "http://localhost:3001";
const PAGE = 80;

export default function Productos({ onSave, onDelete, selected, onSelect, modal, onOpenModal, onCloseModal }) {
  const [form, setForm]       = useState(EMPTY);
  const [error, setError]     = useState("");
  const [search, setSearch]   = useState("");
  const [rows, setRows]       = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [familias, setFamilias] = useState([]);
  const [rubros, setRubros]     = useState([]);
  const [filtroFamilia, setFiltroFamilia] = useState("");
  const [filtroRubro, setFiltroRubro]     = useState("");
  const [rubrosDelFiltro, setRubrosDelFiltro] = useState([]);
  const [familiaEsNueva, setFamiliaEsNueva] = useState(false);
  const [rubroEsNuevo, setRubroEsNuevo]     = useState(false);
  const [nuevoRubro, setNuevoRubro]         = useState("");

  // Cargar familias únicas
  useEffect(() => {
    fetch(`${API}/articulos/familias-todas`)
      .then(r => r.json())
      .then(data => setFamilias(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  // Cargar rubros únicos (para el filtro y el form)
  const cargarRubros = () => {
    fetch(`${API}/articulos/rubros`)
      .then(r => r.json())
      .then(data => setRubros(Array.isArray(data) ? data : []))
      .catch(() => {});
  };
  useEffect(() => { cargarRubros(); }, []);

  // Familias del filtro — se filtran por rubro si hay uno elegido
  useEffect(() => {
    if (filtroRubro) {
      fetch(`${API}/articulos/familias-por-rubro?rubro=${encodeURIComponent(filtroRubro)}`)
        .then(r => r.json())
        .then(data => { setRubrosDelFiltro(Array.isArray(data) ? data : []); setFiltroFamilia(""); setPage(1); })
        .catch(() => {});
    } else {
      fetch(`${API}/articulos/familias-todas`)
        .then(r => r.json())
        .then(data => { setRubrosDelFiltro(Array.isArray(data) ? data : []); })
        .catch(() => {});
    }
  }, [filtroRubro]);

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: PAGE });
      if (debouncedSearch) params.set("search",  debouncedSearch);
      if (filtroFamilia)   params.set("familia", filtroFamilia);
      if (filtroRubro)     params.set("rubro",   filtroRubro);
      const countParams = new URLSearchParams();
      if (debouncedSearch) countParams.set("search",  debouncedSearch);
      if (filtroFamilia)   countParams.set("familia", filtroFamilia);
      if (filtroRubro)     countParams.set("rubro",   filtroRubro);
      const countQ = countParams.toString() ? `?${countParams}` : "";
      const [dataRes, countRes] = await Promise.all([
        fetch(`${API}/productos?${params}`),
        fetch(`${API}/productos/count${countQ}`),
      ]);
      const data  = await dataRes.json();
      const count = await countRes.json();
      setRows(Array.isArray(data) ? data : []);
      setTotal(count.total ?? 0);
    } catch (e) {
      console.error("Error cargando productos:", e);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, filtroFamilia, filtroRubro]);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  const totalPages = Math.ceil(total / PAGE);
  // Filtrado client-side como fallback por si el backend no soporta familia/rubro aún
  const filtered = rows.filter(r => {
    if (filtroFamilia && (r.familia ?? "").toLowerCase() !== filtroFamilia.toLowerCase()) return false;
    if (filtroRubro   && (r.rubro   ?? "").toLowerCase() !== filtroRubro.toLowerCase())   return false;
    return true;
  });

  const openNew = () => {
    setForm(EMPTY); setError("");
    setFamiliaEsNueva(false); setRubroEsNuevo(false); setNuevoRubro("");
    onOpenModal("nuevo");
  };

  const openEdit = () => {
    if (!selected) return;
    const s = (v) => (v != null && v !== "null") ? String(v) : "";
    setForm({
      codart:    s(selected.codart),
      articulo:  s(selected.articulo),
      area:      s(selected.area),
      unidad:    s(selected.unidad),
      artfoto:   selected.artfoto && selected.artfoto !== "null" ? selected.artfoto : "",
      precio:    s(selected.precio),
      proveedor: s(selected.proveedor),
      cantidad:  s(selected.cantidad),
      ancho:     s(selected.ancho),
      alto:      s(selected.alto),
      linea:     s(selected.linea),
      color:     s(selected.color),
      familia:   s(selected.familia),
      rubro:     s(selected.rubro),
      costosi:     s(selected.costosi),
      costosicf:   s(selected.costosicf),
      costo_placa: s(selected.costo_placa),
    });
    setError("");
    setFamiliaEsNueva(false); setRubroEsNuevo(false); setNuevoRubro("");
    onOpenModal("editar");
  };

  const handleAgregarRubro = () => {
    const r = nuevoRubro.trim().toUpperCase();
    if (!r) return;
    if (!rubros.includes(r)) setRubros(prev => [...prev, r].sort());
    setForm(f => ({ ...f, rubro: r }));
    setNuevoRubro("");
    setRubroEsNuevo(false);
  };

  const handleSubmit = () => {
    if (!form.articulo.trim()) { setError("El artículo es obligatorio."); return; }
    const data = {
      codart:    form.codart    || null,
      articulo:  form.articulo,
      area:      form.area      || null,
      unidad:    form.unidad    || null,
      artfoto:   form.artfoto   || null,
      precio:    toDecimal(form.precio),
      proveedor: form.proveedor || null,
      cantidad:  toInt(form.cantidad),
      ancho:     toDecimal(form.ancho),
      alto:      toDecimal(form.alto),
      linea:     form.linea  || null,
      color:     form.color     || null,
      familia:   form.familia   || null,
      rubro:     form.rubro     || null,
      costosi:     toDecimal(form.costosi),
      costosicf:   toDecimal(form.costosicf),
      costo_placa: toDecimal(form.costo_placa),
    };
    const payload = modal === "nuevo" ? data : { ...data, id: selected.id };
    onSave(payload);
    onCloseModal();
    setForm(EMPTY);
    setTimeout(() => { fetchRows(); cargarRubros(); }, 500);
  };

  return (
    <>
      <ScreenHeader icon="🛒" title="Productos" subtitle={loading ? "Cargando..." : `${total} artículos encontrados`} />

      <ActionBar
        selected={selected} onNew={openNew} onEdit={openEdit}
        onDelete={() => selected && onOpenModal("eliminar")}
        search={search} onSearch={setSearch}
      />

      {/* Filtros Rubro / Familia */}
      <div style={{ display: "flex", gap: 10, margin: "8px 0", alignItems: "center" }}>
        <select
          className="form-input"
          style={{ maxWidth: 220, marginBottom: 0, cursor: "pointer" }}
          value={filtroRubro}
          onChange={e => { setFiltroRubro(e.target.value); setFiltroFamilia(""); setPage(1); }}
        >
          <option value="">— Todos los rubros —</option>
          {rubros.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select
          className="form-input"
          style={{ maxWidth: 220, marginBottom: 0, cursor: "pointer" }}
          value={filtroFamilia}
          onChange={e => { setFiltroFamilia(e.target.value); setPage(1); }}
          disabled={!filtroRubro && rubrosDelFiltro.length === 0}
        >
          <option value="">— Todas las familias —</option>
          {(filtroRubro ? rubrosDelFiltro : familias).map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        {(filtroRubro || filtroFamilia) && (
          <button
            className="btn-cancel"
            style={{ padding: "6px 14px", fontSize: 12, whiteSpace: "nowrap" }}
            onClick={() => { setFiltroRubro(""); setFiltroFamilia(""); setPage(1); }}
          >
            ✕ Limpiar filtros
          </button>
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display:"flex", alignItems:"center", gap:8, margin:"8px 0", fontSize:12, fontFamily:"monospace", color:"#4a6a80" }}>
          <button className="btn-action" style={{padding:"3px 10px"}} disabled={page===1} onClick={()=>setPage(1)}>«</button>
          <button className="btn-action" style={{padding:"3px 10px"}} disabled={page===1} onClick={()=>setPage(p=>p-1)}>‹</button>
          <span>Página <strong>{page}</strong> de <strong>{totalPages}</strong></span>
          <button className="btn-action" style={{padding:"3px 10px"}} disabled={page===totalPages} onClick={()=>setPage(p=>p+1)}>›</button>
          <button className="btn-action" style={{padding:"3px 10px"}} disabled={page===totalPages} onClick={()=>setPage(totalPages)}>»</button>
        </div>
      )}

      <div className="tabla-detalle-layout">
        <div className="tabla-detalle-tabla">
          <DataTable columns={COLUMNS} rows={filtered} selectedId={selected?.id} onSelect={onSelect} />
        </div>
        <div className="tabla-detalle-panel">
          <DetalleArticulo producto={selected} />
        </div>
      </div>

      {(modal === "nuevo" || modal === "editar") && (
        <Modal title={modal === "nuevo" ? "Nuevo producto" : "Editar producto"} onClose={onCloseModal}>
          {error && <p className="form-error">{error}</p>}
          <div className="form-grid">
            <div>
              {FIELDS_LEFT_TOP.map((f) => <FormField key={f.field} {...f} form={form} setForm={setForm} />)}

              {/* Rubro — debajo de Artículo */}
              <div className="form-group">
                <label className="form-label">Rubro</label>
                {!rubroEsNuevo ? (
                  <select
                    className="form-input"
                    value={form.rubro ?? ""}
                    onChange={(e) => {
                      if (e.target.value === "__nuevo__") {
                        setRubroEsNuevo(true);
                        setForm(p => ({ ...p, rubro: "" }));
                      } else {
                        setForm(p => ({ ...p, rubro: e.target.value }));
                      }
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <option value="">— Sin rubro —</option>
                    {rubros.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                    <option value="__nuevo__">✏️ Escribir nuevo rubro...</option>
                  </select>
                ) : (
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      className="form-input"
                      style={{ flex: 1, marginBottom: 0 }}
                      placeholder="Nombre del nuevo rubro"
                      value={nuevoRubro}
                      onChange={(e) => setNuevoRubro(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAgregarRubro()}
                      autoFocus
                    />
                    <button type="button" className="btn-save"
                      style={{ padding: "8px 12px" }}
                      onClick={handleAgregarRubro}>✓</button>
                    <button type="button" className="btn-cancel"
                      style={{ padding: "8px 12px" }}
                      onClick={() => { setRubroEsNuevo(false); setNuevoRubro(""); }}>← Volver</button>
                  </div>
                )}
              </div>

              {/* Familia — debajo de Rubro */}
              <div className="form-group">
                <label className="form-label">Familia</label>
                {!familiaEsNueva ? (
                  <select
                    className="form-input"
                    value={form.familia ?? ""}
                    onChange={(e) => {
                      if (e.target.value === "__nueva__") {
                        setFamiliaEsNueva(true);
                        setForm(p => ({ ...p, familia: "" }));
                      } else {
                        setForm(p => ({ ...p, familia: e.target.value }));
                      }
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <option value="">— Sin familia —</option>
                    {familias.map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                    <option value="__nueva__">✏️ Escribir nueva familia...</option>
                  </select>
                ) : (
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      className="form-input"
                      style={{ flex: 1, marginBottom: 0 }}
                      placeholder="Nombre de la nueva familia"
                      value={form.familia}
                      onChange={(e) => setForm(p => ({ ...p, familia: e.target.value }))}
                      autoFocus
                    />
                    <button type="button" className="btn-cancel"
                      style={{ padding: "8px 12px", whiteSpace: "nowrap" }}
                      onClick={() => { setFamiliaEsNueva(false); setForm(p => ({ ...p, familia: "" })); }}>
                      ← Volver
                    </button>
                  </div>
                )}
              </div>

              {FIELDS_LEFT_BOTTOM.map((f) => <FormField key={f.field} {...f} form={form} setForm={setForm} />)}

              {form.area === "2" && (
                <FormField field="costo_placa" label="Costo placa" placeholder="Ej: 38000" form={form} setForm={setForm} />
              )}

              <FotoUpload value={form.artfoto} onChange={(val) => setForm((p) => ({ ...p, artfoto: val }))} />
            </div>
            <div>
              {FIELDS_RIGHT.map((f) => <FormField key={f.field} {...f} form={form} setForm={setForm} />)}
            </div>
          </div>
          <div className="form-actions">
            <button className="btn-cancel" onClick={onCloseModal}>Cancelar</button>
            <button className="btn-save" onClick={handleSubmit}>
              {modal === "nuevo" ? "Guardar" : "Actualizar"}
            </button>
          </div>
        </Modal>
      )}

      {modal === "eliminar" && (
        <ConfirmDelete item={selected} onConfirm={onDelete} onClose={onCloseModal} />
      )}
    </>
  );
}
