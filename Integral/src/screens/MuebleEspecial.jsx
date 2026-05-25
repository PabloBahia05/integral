import { useState, useEffect, useRef } from "react";

const API = "http://localhost:3001";

const EMPTY = {
  ancho: "", alto: "", profundidad: "",
  // Placa color: nombre + precio (igual que form.material en Vanitory)
  material:       "",   // nombre de la placa COLOR elegida
  materialPrecio: 0,
  // Placa blanco: nombre + precio (igual que form.materialBlanco en Vanitory)
  materialBlanco:       "",
  materialBlancoPrecio: 0,
  // Tipo por parte: "COLOR" | "BLANCO" | "SIN"
  lat_izq: "COLOR",
  lat_der: "COLOR",
  techo:   "COLOR",
  piso:    "COLOR",
  // Herrajes
  bisagra_id: null, guia_id: null, intermedios: "",
  // Cajones
  cajon1_ancho: "", cajon1_alto: "", cajon1_cantidad: "",
  cajon2_ancho: "", cajon2_alto: "", cajon2_cantidad: "",
  cajon3_ancho: "", cajon3_alto: "", cajon3_cantidad: "",
  // Puertas
  puerta1_ancho: "", puerta1_alto: "", puerta1_cantidad: "",
  puerta2_ancho: "", puerta2_alto: "", puerta2_cantidad: "",
  puerta3_ancho: "", puerta3_alto: "", puerta3_cantidad: "",
};

// ── Dropdown autocomplete — idéntico al de material/materialBlanco en Vanitory
function PlacaDropdown({ label, emoji, nombreKey, precioKey, form, setForm, opciones, cargando }) {
  const [search, setSearch] = useState("");
  const [open, setOpen]     = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const nombre = form[nombreKey];
  const precio = form[precioKey];

  const filtradas = opciones.filter(p =>
    !search ||
    (p.articulo ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (p.codartint ?? p.codart ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const formatPrecio = (n) => n > 0 ? `$${Number(n).toLocaleString("es-AR")}` : "";

  return (
    <div style={{ position: "relative" }} ref={ref}>
      <label style={{ fontSize: 11, fontWeight: 700, color: "#6699bb", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
        {emoji} {label}
        {nombre && (
          <span style={{ marginLeft: 8, fontSize: 10, color: "#2563eb", fontWeight: 600 }}>
            {formatPrecio(precio)}
          </span>
        )}
      </label>

      {cargando ? (
        <div style={{ fontSize: 12, color: "#4a8ab5", fontStyle: "italic", padding: "10px 0" }}>⏳ Cargando...</div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input
              style={{
                flex: 1, padding: "9px 12px", borderRadius: 6,
                border: "1.5px solid #b8cfe0", fontSize: 13, outline: "none",
                background: "#fff", color: "#0a3a5c", fontFamily: "inherit",
                transition: "border-color 0.2s",
              }}
              placeholder="Escribí para buscar placa..."
              value={search !== "" || open ? search : nombre}
              onFocus={() => { setSearch(""); setOpen(true); }}
              onChange={e => { setSearch(e.target.value); setOpen(true); }}
              onBlur={() => setTimeout(() => setOpen(false), 150)}
            />
            {nombre && (
              <button
                type="button"
                onClick={() => { setForm(f => ({ ...f, [nombreKey]: "", [precioKey]: 0 })); setSearch(""); }}
                style={{
                  padding: "0 10px", height: 38, borderRadius: 6,
                  border: "1.5px solid #d0dde8", background: "#f5f8fa",
                  color: "#c0392b", cursor: "pointer", fontSize: 14, fontWeight: 700,
                }}
                title="Quitar placa"
              >✕</button>
            )}
          </div>

          {open && (
            <div style={{
              position: "absolute", top: "100%", left: 0, right: 0, zIndex: 999,
              background: "#fff", border: "1px solid #b8d6ef", borderRadius: 6,
              boxShadow: "0 4px 18px rgba(0,40,80,0.13)", maxHeight: 220, overflowY: "auto",
              marginTop: 2,
            }}>
              <div
                style={{ padding: "9px 14px", fontSize: 12, color: "#6a8aa0", cursor: "pointer", borderBottom: "1px solid #e8f0f7" }}
                onMouseDown={() => { setForm(f => ({ ...f, [nombreKey]: "", [precioKey]: 0 })); setSearch(""); setOpen(false); }}
              >
                — Sin placa —
              </div>
              {filtradas.slice(0, 60).map((p, i) => {
                const pu = parseFloat(p.precio_un ?? p.precio ?? 0);
                const codart = p.codartint ?? p.codart ?? "";
                return (
                  <div
                    key={p.id ?? codart ?? i}
                    style={{
                      padding: "9px 14px", fontSize: 13, cursor: "pointer",
                      background: nombre === p.articulo ? "#e8f4fb" : "transparent",
                      borderBottom: "1px solid #f0f5fa",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}
                    onMouseDown={() => {
                      setForm(f => ({ ...f, [nombreKey]: p.articulo, [precioKey]: pu }));
                      setSearch(""); setOpen(false);
                    }}
                    onMouseEnter={e => { if (nombre !== p.articulo) e.currentTarget.style.background = "#f8fafc"; }}
                    onMouseLeave={e => { if (nombre !== p.articulo) e.currentTarget.style.background = "transparent"; }}
                  >
                    <span>
                      {codart && (
                        <span style={{ color: "#4a8ab5", fontFamily: "monospace", marginRight: 6, fontSize: 11 }}>
                          [{codart}]
                        </span>
                      )}
                      {p.articulo}
                    </span>
                    {pu > 0 && (
                      <span style={{ color: "#2563eb", fontWeight: 700, fontSize: 12, marginLeft: 8, flexShrink: 0 }}>
                        ${pu.toLocaleString("es-AR")}
                      </span>
                    )}
                  </div>
                );
              })}
              {filtradas.length === 0 && (
                <div style={{ padding: "12px 14px", fontSize: 12, color: "#b0c0d0", fontStyle: "italic" }}>Sin resultados</div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Selector autocomplete para herrajes (bisagra / guía) ─────────────────────
function ArticuloSelect({ label, endpoint, value, onChange }) {
  const [opciones, setOpciones] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [abierto, setAbierto]   = useState(false);
  const [cargando, setCargando] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    setCargando(true);
    fetch(`${API}${endpoint}`)
      .then(r => r.json())
      .then(data => setOpciones(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setCargando(false));
  }, [endpoint]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setAbierto(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const seleccionado = opciones.find(o => o.id === value);
  const filtradas = busqueda.trim()
    ? opciones.filter(o => o.articulo?.toLowerCase().includes(busqueda.toLowerCase()))
    : opciones;

  return (
    <div ref={ref} style={{ display: "flex", flexDirection: "column", gap: 4, position: "relative" }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: "#6699bb", letterSpacing: "0.08em", textTransform: "uppercase" }}>
        {label}
      </label>
      <div
        onClick={() => setAbierto(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "9px 12px", borderRadius: 6,
          border: `1.5px solid ${abierto ? "#2563eb" : "#b8cfe0"}`,
          background: "#fff", cursor: "pointer", fontSize: 13,
          color: seleccionado ? "#0a3a5c" : "#94a3b8", minHeight: 38,
          userSelect: "none",
        }}
      >
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {cargando ? "Cargando…" : seleccionado ? seleccionado.articulo : "Seleccionar…"}
        </span>
        {seleccionado && (
          <span onClick={e => { e.stopPropagation(); onChange(null); }}
            style={{ fontSize: 14, color: "#94a3b8", cursor: "pointer", flexShrink: 0 }} title="Limpiar">×</span>
        )}
        <span style={{ fontSize: 10, color: "#94a3b8", flexShrink: 0 }}>▾</span>
      </div>

      {abierto && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
          background: "#fff", border: "1.5px solid #b8cfe0", borderRadius: 8,
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)", maxHeight: 240, display: "flex", flexDirection: "column",
          marginTop: 4,
        }}>
          <div style={{ padding: "8px 10px", borderBottom: "1px solid #e2e8f0" }}>
            <input autoFocus type="text" placeholder="Buscar…" value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              onClick={e => e.stopPropagation()}
              style={{ width: "100%", border: "none", outline: "none", fontSize: 13, color: "#0a3a5c", background: "transparent" }}
            />
          </div>
          <div style={{ overflowY: "auto", flex: 1 }}>
            {filtradas.length === 0 && <div style={{ padding: "10px 12px", fontSize: 12, color: "#94a3b8" }}>Sin resultados</div>}
            {filtradas.map(op => (
              <div key={op.id}
                onClick={() => { onChange(op.id); setAbierto(false); setBusqueda(""); }}
                style={{
                  padding: "9px 12px", fontSize: 12, cursor: "pointer",
                  background: op.id === value ? "#eff6ff" : "transparent",
                  color: op.id === value ? "#2563eb" : "#0a3a5c",
                  borderBottom: "1px solid #f1f5f9",
                }}
                onMouseEnter={e => { if (op.id !== value) e.currentTarget.style.background = "#f8fafc"; }}
                onMouseLeave={e => { if (op.id !== value) e.currentTarget.style.background = "transparent"; }}
              >
                {op.articulo}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, unit = "cm", integer = false }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: "#6699bb", letterSpacing: "0.08em", textTransform: "uppercase" }}>
        {label}
      </label>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <input type="number" min="0" step={integer ? "1" : "0.1"} value={value}
          onChange={e => onChange(integer ? String(parseInt(e.target.value) || "") : e.target.value)}
          style={{
            width: "100%", padding: "9px 12px", borderRadius: 6,
            border: "1.5px solid #b8cfe0", fontSize: 14, fontFamily: "inherit",
            outline: "none", background: "#fff", color: "#0a3a5c",
          }}
          onFocus={e => e.target.style.borderColor = "#2563eb"}
          onBlur={e => e.target.style.borderColor = "#b8cfe0"}
        />
        <span style={{ fontSize: 12, color: "#94a3b8", minWidth: 20 }}>{unit}</span>
      </div>
    </div>
  );
}

function CajonSection({ num, form, setForm }) {
  const set = (key) => (val) => setForm(f => ({ ...f, [`cajon${num}_${key}`]: val }));
  const filled = form[`cajon${num}_ancho`] || form[`cajon${num}_alto`] || form[`cajon${num}_cantidad`];
  return (
    <div style={{
      background: filled ? "#f0f7ff" : "#f8fafc",
      border: `1.5px solid ${filled ? "#93c5fd" : "#e2e8f0"}`,
      borderRadius: 10, padding: "18px 20px", transition: "all 0.2s",
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#0a3a5c", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{
          background: filled ? "#2563eb" : "#94a3b8", color: "#fff",
          borderRadius: "50%", width: 22, height: 22,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 800, flexShrink: 0,
        }}>{num}</span>
        CAJÓN {num}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <Field label="Ancho"    value={form[`cajon${num}_ancho`]}    onChange={set("ancho")} />
        <Field label="Alto"     value={form[`cajon${num}_alto`]}     onChange={set("alto")} />
        <Field label="Cantidad" value={form[`cajon${num}_cantidad`]} onChange={set("cantidad")} unit="u." />
      </div>
    </div>
  );
}

export default function MuebleEspecial() {
  const [form, setForm]         = useState(EMPTY);
  const [guardado, setGuardado] = useState(false);
  const [error, setError]       = useState(null);
  const [cargando, setCargando] = useState(false);

  const [placas, setPlacas]               = useState([]);
  const [cargandoPlacas, setCargandoPlacas] = useState(false);

  // Cargar placas — mismo endpoint, igual que insumosMuebles en Vanitory
  useEffect(() => {
    setCargandoPlacas(true);
    fetch(`${API}/productos/placas-muebles-esp`)
      .then(r => r.json())
      .then(data => {
        const norm = p => ({
          ...p,
          articulo:  p.articulo  ?? p.ARTICULO  ?? "",
          codartint: p.codartint ?? p.CODARTINT ?? p.codart ?? "",
          precio:    parseFloat(p.precio_un ?? p.precio ?? 0) || 0,
          precio_un: parseFloat(p.precio_un ?? p.precio ?? 0) || 0,
        });
        setPlacas(Array.isArray(data) ? data.map(norm) : []);
      })
      .catch(() => {})
      .finally(() => setCargandoPlacas(false));
  }, []);

  const set   = (key) => (val) => { setForm(f => ({ ...f, [key]: val })); setGuardado(false); setError(null); };
  const setId = (key) => (val) => { setForm(f => ({ ...f, [key]: val })); setGuardado(false); setError(null); };

  const handleLimpiar = () => { setForm(EMPTY); setGuardado(false); setError(null); };

  const handleGuardar = async () => {
    setCargando(true); setError(null);
    try {
      const res = await fetch(`${API}/muebles-esp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || `Error ${res.status}`); }
      const data = await res.json();
      console.log("[MuebleEspecial] guardado:", data);
      setGuardado(true);
      setTimeout(() => setGuardado(false), 2500);
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  };

  const tieneAlgo = Object.entries(form).some(([k, v]) =>
    ["bisagra_id","guia_id"].includes(k) ? v !== null : v !== "" && v !== 0
  );

  const PARTES = [
    { label: "LATERAL IZQUIERDO", key: "lat_izq" },
    { label: "LATERAL DERECHO",   key: "lat_der" },
    { label: "TECHO",             key: "techo"   },
    { label: "PISO",              key: "piso"    },
  ];

  return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: "#0a3a5c", fontFamily: "Syne, sans-serif", display: "flex", alignItems: "center", gap: 10 }}>
          🪚 Mueble Especial
        </div>
        <div style={{ fontSize: 11, color: "#6699bb", letterSpacing: 3, textTransform: "uppercase", marginTop: 4 }}>
          Ingresá las medidas del mueble y sus cajones
        </div>
      </div>

      {/* Medidas */}
      <div style={{ background: "#fff", border: "1.5px solid #b8cfe0", borderRadius: 12, padding: "22px 24px", marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#0a3a5c", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>
          📐 Medidas del mueble
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          <Field label="Ancho"       value={form.ancho}       onChange={set("ancho")} />
          <Field label="Alto"        value={form.alto}        onChange={set("alto")} />
          <Field label="Profundidad" value={form.profundidad} onChange={set("profundidad")} />
        </div>
      </div>

      {/* Placas + Laterales y base */}
      <div style={{ background: "#fff", border: "1.5px solid #b8cfe0", borderRadius: 12, padding: "22px 24px", marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#0a3a5c", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>
          🎨 Placas y partes
        </div>

        {/* Placa COLOR — idéntico al dropdown de MATERIAL en Vanitory */}
        <div style={{ marginBottom: 16 }}>
          <PlacaDropdown
            label="Placa Color"
            emoji="🪵"
            nombreKey="material"
            precioKey="materialPrecio"
            form={form} setForm={setForm}
            opciones={placas}
            cargando={cargandoPlacas}
          />
        </div>

        {/* Placa BLANCO — idéntico al dropdown de MATERIAL BLANCO en Vanitory */}
        <div style={{ marginBottom: 20 }}>
          <PlacaDropdown
            label="Placa Blanco"
            emoji="🪵"
            nombreKey="materialBlanco"
            precioKey="materialBlancoPrecio"
            form={form} setForm={setForm}
            opciones={placas}
            cargando={cargandoPlacas}
          />
        </div>

        {/* Selector COLOR / BLANCO / SIN por parte — idéntico a Laterales y Base de Vanitory */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {PARTES.map(({ label, key }) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 11, color: "#6a8aa0", width: 148, flexShrink: 0 }}>{label}</span>
              <select
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                style={{
                  flex: 1, padding: "8px 12px", borderRadius: 6, cursor: "pointer",
                  border: "1.5px solid #b8cfe0", fontSize: 13, fontFamily: "inherit",
                  background: "#fff", color: "#0a3a5c", outline: "none",
                }}
              >
                <option value="COLOR">COLOR</option>
                <option value="BLANCO">BLANCO</option>
                <option value="SIN">SIN</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Herrajes */}
      <div style={{ background: "#fff", border: "1.5px solid #b8cfe0", borderRadius: 12, padding: "22px 24px", marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#0a3a5c", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>
          🔩 Herrajes
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          <ArticuloSelect label="Bisagra" endpoint="/productos/bisagras-muebles-esp" value={form.bisagra_id} onChange={setId("bisagra_id")} />
          <ArticuloSelect label="Guía telescópica" endpoint="/productos/guias-muebles-esp" value={form.guia_id} onChange={setId("guia_id")} />
          <Field label="Intermedios" value={form.intermedios} onChange={set("intermedios")} unit="u." integer />
        </div>
      </div>

      {/* Cajones */}
      <div style={{ background: "#fff", border: "1.5px solid #b8cfe0", borderRadius: 12, padding: "22px 24px", marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#0a3a5c", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>
          🗂 Cajones
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <CajonSection num={1} form={form} setForm={setForm} />
          <CajonSection num={2} form={form} setForm={setForm} />
          <CajonSection num={3} form={form} setForm={setForm} />
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: 14, padding: "10px 16px", borderRadius: 8, background: "#fef2f2", border: "1.5px solid #fca5a5", color: "#b91c1c", fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        {tieneAlgo && (
          <button onClick={handleLimpiar} disabled={cargando}
            style={{ padding: "10px 22px", borderRadius: 8, border: "1.5px solid #b8cfe0", background: "#fff", color: "#6699bb", fontSize: 13, fontFamily: "inherit", cursor: "pointer", fontWeight: 600 }}
            onMouseEnter={e => { e.target.style.background = "#f1f5f9"; }}
            onMouseLeave={e => { e.target.style.background = "#fff"; }}
          >Limpiar</button>
        )}
        <button onClick={handleGuardar} disabled={cargando}
          style={{
            padding: "10px 28px", borderRadius: 8, border: "none",
            background: guardado ? "#22c55e" : cargando ? "#93c5fd" : "#2563eb",
            color: "#fff", fontSize: 13, fontFamily: "inherit",
            cursor: cargando ? "not-allowed" : "pointer", fontWeight: 700, transition: "background 0.3s",
          }}
        >
          {cargando ? "Guardando…" : guardado ? "✓ Guardado" : "Guardar"}
        </button>
      </div>
    </div>
  );
}
