import { useState, useRef, useEffect, useCallback } from "react";
import DataTable from "../Component/DataTable";
import Modal from "../Component/Modal";
import ActionBar from "../Component/ActionBar";
import ScreenHeader from "../Component/ScreenHeader";
import ConfirmDelete from "../Component/ConfirmDelete";
import FormField from "../Component/FormField";

const makeColumns = (onVer) => [
  {
    key: "__ver__",
    label: "",
    render: (_, row) => (
      <button
        title="Ver detalle"
        onClick={(e) => { e.stopPropagation(); onVer(row); }}
        style={{
          background: "none", border: "1px solid #b8cfe0", borderRadius: 4,
          cursor: "pointer", fontSize: 14, padding: "2px 7px", color: "#3a7abf",
          lineHeight: 1,
        }}
      >Ver</button>
    ),
  },
  { key: "codartint",  label: "Código Interno" },
  { key: "articulo",  label: "Artículo" },
  { key: "proveedor", label: "Proveedor" },
  {
    key: "codartprov",
    label: "Cód. Prov.",
    render: (v) => v ? <span style={{ color: "#5580a0", fontFamily: "monospace", fontSize: 12 }}>{v}</span> : <span style={{ color: "#bbb" }}>—</span>,
  },
  {
    key: "prod_prov",
    label: "Prod. Proveedor",
    render: (v) => v
      ? <span style={{ color: "#0a3a5c", fontSize: 12 }}>{v}</span>
      : <span style={{ color: "#bbb" }}>—</span>,
  },
  { key: "rubro",     label: "Rubro" },
  { key: "familia",   label: "Familia" },
  { key: "unidad",    label: "Unidad" },
  { key: "valorlista", label: "Val. Lista",  render: (v) => v != null ? `$${parseFloat(v).toLocaleString("es-AR")}` : "-" },
  { key: "costosi",   label: "Costo s/imp.",    render: (v) => v != null ? `$${parseFloat(v).toLocaleString("es-AR")}` : "-" },
  { key: "costosicf", label: "Costo s/imp. c/flete", render: (v) => v != null ? `$${parseFloat(v).toLocaleString("es-AR")}` : "-" },
  { key: "costocicf", label: "Costo c/imp. c/flete", render: (v) => v != null ? `$${parseFloat(v).toLocaleString("es-AR")}` : "-" },
  { key: "precio",    label: "Precio",    render: (v) => v != null ? `${parseFloat(v).toLocaleString("es-AR")}` : "-" },
  { key: "precio_un",  label: "Precio UN", render: (v) => v != null ? `${parseFloat(v).toLocaleString("es-AR")}` : "-" },
  { key: "descuento", label: "Descuento %", render: (v) => v != null ? `${parseFloat(v)}%` : "-" },
  { key: "flete",     label: "Flete",  render: (v) => v != null ? `$${parseFloat(v).toLocaleString("es-AR")}` : "-" },
  { key: "cantidad",  label: "Cantidad" },
  { key: "ancho",     label: "Ancho" },
  { key: "alto",      label: "Alto" },
  { key: "linea",     label: "Línea" },
  { key: "color",     label: "Color" },
  { key: "area",      label: "Área" },
  { key: "codfam",    label: "Cód. Familia" },
  { key: "codrub",    label: "Cód. Rubro" },
];

const EMPTY = {
  codartint: "", articulo: "", area: "", unidad: "", artfoto: "",
  precio: "", proveedor: "", cantidad: "", ancho: "", alto: "",
  linea: "", color: "", familia: "", rubro: "",
  precio_un: "", costosi: "", costosicf: "", costocicf: "", costo_placa: "",
  descuento: "", flete: "", valorlista: "", margen: "",
  codfam: "", codrub: "", codartprov: "", prod_prov: "",
};

const FIELDS_LEFT_TOP = [
  { field: "codartint",  label: "Código Interno",   placeholder: "Ej: ADR00015" },
  { field: "codartprov", label: "Código Proveedor",  placeholder: "Ej: PROV-001" },
  { field: "prod_prov",  label: "Prod. Proveedor",   placeholder: "Descripción según factura del proveedor" },
  { field: "articulo",   label: "Artículo *",        placeholder: "Ej: Mampara corrediza" },
];

const FIELDS_LEFT_BOTTOM = [
  { field: "cantidad",  label: "Cantidad",    placeholder: "Ej: 1" },
  { field: "flete",     label: "Flete ($)",   placeholder: "Ej: 500" },
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
      {producto.codartint && <p className="detalle-codigo">Código Interno: <strong>{producto.codartint}</strong></p>}
      {producto.codartprov && <p className="detalle-codigo">Código Proveedor: <strong>{producto.codartprov}</strong></p>}
      {producto.rubro     && <p className="detalle-codigo">Rubro: <strong>{producto.rubro}</strong></p>}
      {producto.area      && <p className="detalle-codigo">Área: <strong>{producto.area}</strong></p>}
      {producto.unidad    && <p className="detalle-codigo">Unidad: <strong>{producto.unidad}</strong></p>}
      {producto.proveedor && <p className="detalle-codigo">Proveedor: <strong>{producto.proveedor}</strong></p>}
      {producto.color     && <p className="detalle-codigo">Color: <strong>{producto.color}</strong></p>}
      {producto.linea     && <p className="detalle-codigo">Línea: <strong>{producto.linea}</strong></p>}
      {producto.familia   && <p className="detalle-codigo">Familia: <strong>{producto.familia}</strong></p>}
      {producto.codfam    && <p className="detalle-codigo">Cód. Familia: <strong>{producto.codfam}</strong></p>}
      {producto.codrub    && <p className="detalle-codigo">Cód. Rubro: <strong>{producto.codrub}</strong></p>}
      <div className="detalle-precios">
        <div className="detalle-precio-row"><span>Val. lista proveedor</span><strong>{fmt(producto.valorlista)}</strong></div>
        <div className="detalle-precio-row"><span>Costo s/imp.</span><strong>{fmt(producto.costosi)}</strong></div>
        <div className="detalle-precio-row"><span>Costo s/imp. c/flete</span><strong>{fmt(producto.costosicf)}</strong></div>
        <div className="detalle-precio-row"><span>Costo c/imp. c/flete</span><strong>{fmt(producto.costocicf)}</strong></div>
        <div className="detalle-precio-row"><span>Precio</span><strong>{fmt(producto.precio)}</strong></div>
        {producto.descuento != null && <div className="detalle-precio-row"><span>Descuento</span><strong>{producto.descuento}%</strong></div>}
        {producto.flete     != null && <div className="detalle-precio-row"><span>Flete</span><strong>{fmt(producto.flete)}</strong></div>}
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
  const [detalleModal, setDetalleModal] = useState(null);
  const [familias, setFamilias] = useState([]);
  const [rubros, setRubros]     = useState([]);
  const [filtroFamilia, setFiltroFamilia] = useState("");
  const [filtroRubro, setFiltroRubro]     = useState("");
  const [rubrosDelFiltro, setRubrosDelFiltro] = useState([]);
  const [familiaEsNueva, setFamiliaEsNueva] = useState(false);
  const [rubroEsNuevo, setRubroEsNuevo]     = useState(false);
  const [nuevoRubro, setNuevoRubro]         = useState("");

  // Proveedores
  const [proveedores, setProveedores] = useState([]);
  const [provSearch, setProvSearch]   = useState("");
  const [provFocus, setProvFocus]     = useState(false);

  useEffect(() => {
    fetch(`${API}/proveedores`)
      .then(r => r.json())
      .then(data => setProveedores(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const proveedoresFiltrados = provSearch.trim().length > 0
    ? proveedores.filter(p =>
        (p.provnombre ?? "").toLowerCase().includes(provSearch.toLowerCase()) ||
        (p.fantasia   ?? "").toLowerCase().includes(provSearch.toLowerCase())
      ).slice(0, 8)
    : proveedores.slice(0, 8);

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
    setProvSearch(""); setProvFocus(false);
    onOpenModal("nuevo");
  };

  const openEdit = () => {
    if (!selected) return;
    const s = (v) => (v != null && v !== "null") ? String(v) : "";
    setForm({
      codartint: s(selected.codartint),
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
      costocicf:   s(selected.costocicf),
      costo_placa: s(selected.costo_placa),
      descuento:   s(selected.descuento),
      flete:       s(selected.flete),
      valorlista:  s(selected.valorlista),
      margen:      s(selected.margen),
      codartprov:  s(selected.codartprov),
      prod_prov:   s(selected.prod_prov),
    });
    setError("");
    setFamiliaEsNueva(false); setRubroEsNuevo(false); setNuevoRubro("");
    setProvSearch(s(selected.proveedor)); setProvFocus(false);
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
      codartint: form.codartint || null,
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
      costocicf:   toDecimal(form.costocicf),
      costo_placa: toDecimal(form.costo_placa),
      descuento:   toDecimal(form.descuento),
      valorlista:  toDecimal(form.valorlista),
      margen:      toDecimal(form.margen),
      codartprov:  form.codartprov || null,
      prod_prov:   form.prod_prov  || null,
    };
    const payload = modal === "nuevo" ? data : { ...data, id: selected.id };
    onSave(payload);
    onCloseModal();
    setForm(EMPTY);
    setTimeout(() => { fetchRows(); cargarRubros(); }, 500);
  };

  const columns = makeColumns((row) => setDetalleModal(row));

  return (
    <>
      <ScreenHeader icon="🛒" title="Productos" subtitle={loading ? "Cargando..." : `${total} artículos encontrados`} />

      <ActionBar
        selected={selected} onNew={openNew} onEdit={openEdit}
        onDelete={() => selected && onOpenModal("eliminar")}
        search={search} onSearch={setSearch}
      />

      {/* Filtros Rubro / Familia + Buscador */}
      <div style={{ display: "flex", gap: 10, margin: "8px 0", alignItems: "center", flexWrap: "wrap" }}>
        <input
          className="form-input"
          style={{ maxWidth: 260, marginBottom: 0, paddingLeft: 32, backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%236699bb' stroke-width='2'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cpath d='m21 21-4.35-4.35'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "10px center" }}
          placeholder="Buscar artículo, código..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
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
          <DataTable columns={columns} rows={filtered} selectedId={selected?.id} onSelect={onSelect} />
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

              {/* Proveedor — ligado a tabla proveedor */}
              <div className="form-group" style={{ position: "relative" }}>
                <label className="form-label">Proveedor</label>
                <input
                  className="form-input"
                  placeholder="Buscar proveedor..."
                  value={provSearch}
                  autoComplete="off"
                  onChange={e => {
                    setProvSearch(e.target.value);
                    setForm(p => ({ ...p, proveedor: e.target.value }));
                    setProvFocus(true);
                  }}
                  onFocus={() => setProvFocus(true)}
                  onBlur={() => setTimeout(() => setProvFocus(false), 180)}
                />
                {provFocus && proveedoresFiltrados.length > 0 && (
                  <div style={{
                    position: "absolute", zIndex: 999, background: "#fff",
                    border: "1px solid #b8cfe0", borderRadius: 3, width: "100%",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.12)", maxHeight: 220, overflowY: "auto",
                  }}>
                    {proveedoresFiltrados.map(p => (
                      <div
                        key={p.id}
                        style={{ padding: "8px 12px", cursor: "pointer", fontSize: 13, borderBottom: "1px solid #f0f4f8" }}
                        onMouseDown={() => {
                          const nombre = p.fantasia || p.provnombre;
                          setForm(f => ({ ...f, proveedor: nombre }));
                          setProvSearch(nombre);
                          setProvFocus(false);
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "#ddeefa"}
                        onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                      >
                        <strong>{p.provnombre}</strong>
                        {p.fantasia && p.fantasia !== p.provnombre && (
                          <span style={{ color: "#6699bb", marginLeft: 6, fontSize: 11 }}>({p.fantasia})</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Unidad de medida ── */}
              <div className="form-field" style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontWeight: 600, marginBottom: 4, fontSize: 13 }}>Unidad</label>
                <select
                  value={form.unidad || ""}
                  onChange={e => setForm(f => ({ ...f, unidad: e.target.value }))}
                  style={{
                    width: "100%", padding: "8px 12px", borderRadius: 6,
                    border: "1px solid #ccc", fontSize: 14, background: "#fff"
                  }}
                >
                  <option value="">-- Seleccionar --</option>
                  <option value="UN">UN — Unidad</option>
                  <option value="M2">M2 — Metro cuadrado</option>
                </select>
              </div>
              {FIELDS_LEFT_BOTTOM.map((f) => <FormField key={f.field} {...f} form={form} setForm={setForm} />)}

              {/* ── Costos con auto-cálculo ── */}
              {(() => {
                const r2 = (v) => Math.round(v * 100) / 100;

                const recalcular = (valorlista, descuento, margen) => {
                  const vl  = parseFloat(valorlista) || 0;
                  const dto = parseFloat(descuento)  || 0;
                  const mg  = parseFloat(margen)     || 0;
                  if (!vl) return { costosi: "", costosicf: "", costocicf: "", precio: "" };
                  const costosi   = r2(vl * (1 - dto / 100));
                  const costosicf = r2(costosi * 1.10);
                  const costocicf = r2(costosicf * 1.21);
                  const precio    = r2(costocicf * (1 + mg / 100));
                  return {
                    costosi:   String(costosi),
                    costosicf: String(costosicf),
                    costocicf: String(costocicf),
                    precio:    String(precio),
                  };
                };

                // Descuento del proveedor seleccionado
                const provSeleccionado = proveedores.find(p =>
                  (p.fantasia || p.provnombre) === form.proveedor ||
                  p.provnombre === form.proveedor
                );
                const descuentoProv = provSeleccionado?.descuento ?? "";

                const inputStyle = { width: "100%", boxSizing: "border-box" };
                const readonlyStyle = { ...inputStyle, background: "#f0f6fb", color: "#4a6a80", cursor: "not-allowed" };

                return (
                  <>
                    {/* Descuento — muestra el del proveedor, editable si se quiere */}
                    <div className="form-group">
                      <label className="form-label">Descuento proveedor (%)</label>
                      <input
                        className="form-input"
                        style={inputStyle}
                        type="number"
                        placeholder="Ej: 30"
                        value={form.descuento !== "" ? form.descuento : descuentoProv}
                        onChange={e => {
                          const d = e.target.value;
                          const calc = recalcular(form.valorlista, d, form.margen);
                          setForm(p => ({ ...p, descuento: d, ...calc }));
                        }}
                      />
                      {descuentoProv !== "" && form.descuento === "" && (
                        <small style={{ color: "#6699bb", fontSize: 11 }}>
                          Tomado del proveedor: {descuentoProv}%
                        </small>
                      )}
                    </div>

                    {/* Valor lista proveedor */}
                    <div className="form-group">
                      <label className="form-label">Valor lista proveedor ($)</label>
                      <input
                        className="form-input"
                        style={inputStyle}
                        type="number"
                        placeholder="Ej: 48000"
                        value={form.valorlista}
                        onChange={e => {
                          const vl = e.target.value;
                          const dto = form.descuento !== "" ? form.descuento : descuentoProv;
                          const calc = recalcular(vl, dto, form.margen);
                          setForm(p => ({ ...p, valorlista: vl, ...calc }));
                        }}
                      />
                    </div>

                    {/* Costo sin impuestos — calculado */}
                    <div className="form-group">
                      <label className="form-label">Costo sin imp. <small style={{color:"#6699bb"}}>(lista × (1 - dto%))</small></label>
                      <input className="form-input" style={readonlyStyle} readOnly value={form.costosi} placeholder="—" />
                    </div>

                    {/* Costo sin imp. con flete — calculado */}
                    <div className="form-group">
                      <label className="form-label">Costo sin imp. con flete <small style={{color:"#6699bb"}}>(× 1.10)</small></label>
                      <input className="form-input" style={readonlyStyle} readOnly value={form.costosicf} placeholder="—" />
                    </div>

                    {/* Costo con imp. con flete — calculado */}
                    <div className="form-group">
                      <label className="form-label">Costo con imp. con flete <small style={{color:"#6699bb"}}>(× 1.21)</small></label>
                      <input className="form-input" style={readonlyStyle} readOnly value={form.costocicf} placeholder="—" />
                    </div>

                    {/* Margen — editable */}
                    <div className="form-group">
                      <label className="form-label">Margen (%)</label>
                      <input
                        className="form-input"
                        style={inputStyle}
                        type="number"
                        placeholder="Ej: 40"
                        value={form.margen}
                        onChange={e => {
                          const mg = e.target.value;
                          const dto = form.descuento !== "" ? form.descuento : descuentoProv;
                          const calc = recalcular(form.valorlista, dto, mg);
                          setForm(p => ({ ...p, margen: mg, ...calc }));
                        }}
                      />
                    </div>

                    {/* Precio — calculado */}
                    <div className="form-group">
                      <label className="form-label">Precio ($) <small style={{color:"#6699bb"}}>(c/imp. c/flete × (1 + margen%))</small></label>
                      <input className="form-input" style={readonlyStyle} readOnly value={form.precio} placeholder="—" />
                    </div>

                    {/* Precio UN — columna generada, solo lectura */}
                    <div className="form-group">
                      <label className="form-label">Precio UN ($)</label>
                      <input className="form-input" style={readonlyStyle} readOnly value={form.precio_un ?? ""} placeholder="—" />
                    </div>
                  </>
                );
              })()}

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

      {detalleModal && (
        <Modal title="Detalle del artículo" onClose={() => setDetalleModal(null)}>
          <DetalleArticulo producto={detalleModal} />
        </Modal>
      )}
    </>
  );
}
