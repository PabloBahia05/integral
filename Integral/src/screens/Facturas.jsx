import { useState, useEffect, useRef } from "react";

const API = "http://localhost:3001";

const MONEDAS = ["ARS", "USD", "EUR"];
const TIPOS_FACTURA = ["A", "B", "C", "M", "E"];
const CONDICIONES_PAGO = ["Contado", "30 días", "60 días", "90 días", "Cuenta Corriente"];

const fmt = (n) =>
  n != null ? Number(n).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—";

// factura cabecera — campos alineados a tabla `facturas`
const EMPTY_FACTURA = {
  proveedor_id: "", numero: "", fecha: "", tipo_factura: "",
  condicion_pago: "", subtotal: "", iva_pct: "21", iva: "", total: "", moneda: "ARS",
};

// ítem — campos alineados a tabla `facturas_items`
const EMPTY_ITEM = { codigo: "", descripcion: "", cantidad: "", precio_unit: "", subtotalprod: "" };

// ── Estilos ──────────────────────────────────────────────────────────────────
const S = {
  wrap: { fontFamily: "'Space Mono', monospace", color: "#0a3a5c", minHeight: "100vh" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 },
  title: { fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, color: "#0a3a5c" },
  subtitle: { fontSize: 11, color: "#6699bb", letterSpacing: 3, textTransform: "uppercase", marginTop: 4 },
  btnPrimary: {
    background: "#0a3a5c", color: "#fff", border: "none", borderRadius: 3,
    padding: "10px 20px", fontFamily: "'Space Mono', monospace", fontSize: 12,
    cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
  },
  btnSecondary: {
    background: "#fff", color: "#0a3a5c", border: "1px solid #a0cce8", borderRadius: 3,
    padding: "9px 18px", fontFamily: "'Space Mono', monospace", fontSize: 12, cursor: "pointer",
  },
  btnDanger: {
    background: "#fff", color: "#cc3333", border: "1px solid #ffaaaa", borderRadius: 3,
    padding: "7px 14px", fontFamily: "'Space Mono', monospace", fontSize: 11, cursor: "pointer",
  },
  btnSmall: {
    background: "#e8f5fd", color: "#0a3a5c", border: "1px solid #a0cce8", borderRadius: 3,
    padding: "5px 11px", fontFamily: "'Space Mono', monospace", fontSize: 11, cursor: "pointer",
  },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 12 },
  th: { background: "#e8f5fd", padding: "8px 12px", textAlign: "left", borderBottom: "2px solid #a0cce8", whiteSpace: "nowrap" },
  td: { padding: "8px 12px", borderBottom: "1px solid #e0eef7", verticalAlign: "middle" },
  badge: (color) => ({
    display: "inline-block", padding: "2px 10px", borderRadius: 20,
    fontSize: 10, fontWeight: 700, background: color + "22", color: color, letterSpacing: 1,
  }),
  input: {
    width: "100%", padding: "8px 10px", border: "1px solid #a0cce8", borderRadius: 3,
    fontFamily: "'Space Mono', monospace", fontSize: 12, color: "#0a3a5c", background: "#fff",
    boxSizing: "border-box",
  },
  select: {
    width: "100%", padding: "8px 10px", border: "1px solid #a0cce8", borderRadius: 3,
    fontFamily: "'Space Mono', monospace", fontSize: 12, color: "#0a3a5c", background: "#fff",
  },
  label: { fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#6699bb", marginBottom: 5, display: "block" },
  field: { marginBottom: 16 },
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  row3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 },
  row4: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16 },
  overlay: {
    position: "fixed", inset: 0, background: "#00000066", zIndex: 200,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  modal: {
    background: "#fff", border: "1px solid #a0cce8", borderRadius: 6,
    width: "min(900px, 96vw)", maxHeight: "90vh", overflowY: "auto",
    padding: "32px 36px", position: "relative",
  },
  modalTitle: { fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, marginBottom: 24, color: "#0a3a5c" },
  dropzone: {
    border: "2px dashed #a0cce8", borderRadius: 6, padding: "36px 24px",
    textAlign: "center", cursor: "pointer", color: "#6699bb", fontSize: 13,
    transition: "all .2s", marginBottom: 20,
  },
  dropzoneActive: { borderColor: "#0a3a5c", background: "#e8f5fd", color: "#0a3a5c" },
  progressBar: { height: 4, background: "#e0eef7", borderRadius: 2, overflow: "hidden", marginBottom: 16 },
  progressFill: (pct) => ({ height: "100%", width: pct + "%", background: "#0a3a5c", transition: "width .3s" }),
  // ítem: código | descripción | cantidad | precio_unit | subtotalprod | ✕
  itemRow: { display: "grid", gridTemplateColumns: "100px 3fr 80px 110px 110px auto", gap: 8, marginBottom: 8, alignItems: "center" },
  sectionTitle: {
    fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#6699bb",
    borderBottom: "1px solid #e0eef7", paddingBottom: 6, marginBottom: 14,
  },
  ivaPctWrap: { display: "flex", gap: 8 },
};

// ── SelectConFiltro — dropdown con búsqueda ──────────────────────────────────
function SelectConFiltro({ label, value, onChange, opciones = [], placeholder = "Buscar o escribir...", allowCustom = true }) {
  const [open, setOpen]   = useState(false);
  const [q, setQ]         = useState("");
  const ref               = useRef();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtradas = opciones.filter((o) => o.toLowerCase().includes(q.toLowerCase()));

  const seleccionar = (op) => {
    onChange(op);
    setQ("");
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {label && <label style={S.label}>{label}</label>}
      <div
        style={{ ...S.input, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", userSelect: "none" }}
        onClick={() => setOpen((p) => !p)}
      >
        <span style={{ color: value ? "#0a3a5c" : "#99bbcc" }}>{value || placeholder}</span>
        <span style={{ fontSize: 10, color: "#6699bb" }}>{open ? "▲" : "▼"}</span>
      </div>

      {open && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 999,
          background: "#fff", border: "1px solid #a0cce8", borderRadius: 3,
          boxShadow: "0 4px 16px #0a3a5c22", maxHeight: 220, display: "flex", flexDirection: "column",
        }}>
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (filtradas.length === 1) seleccionar(filtradas[0]);
                else if (allowCustom && q.trim()) seleccionar(q.trim());
              }
              if (e.key === "Escape") setOpen(false);
            }}
            placeholder="Filtrar..."
            style={{ ...S.input, borderRadius: 0, borderLeft: "none", borderRight: "none", borderTop: "none", borderBottom: "1px solid #e0eef7" }}
          />
          <div style={{ overflowY: "auto", flex: 1 }}>
            {filtradas.length === 0 && !allowCustom && (
              <div style={{ padding: "8px 12px", color: "#99bbcc", fontSize: 12 }}>Sin resultados</div>
            )}
            {filtradas.length === 0 && allowCustom && q.trim() && (
              <div
                style={{ padding: "8px 12px", color: "#0a7c4a", fontSize: 12, cursor: "pointer", background: "#f0fff8" }}
                onClick={() => seleccionar(q.trim())}
              >
                ＋ Usar "{q.trim()}"
              </div>
            )}
            {filtradas.map((op) => (
              <div
                key={op}
                onClick={() => seleccionar(op)}
                style={{
                  padding: "8px 12px", fontSize: 12, cursor: "pointer",
                  background: op === value ? "#e8f5fd" : "#fff",
                  color: op === value ? "#0a3a5c" : "#336688",
                  fontWeight: op === value ? 700 : 400,
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#f0f8ff"}
                onMouseLeave={(e) => e.currentTarget.style.background = op === value ? "#e8f5fd" : "#fff"}
              >
                {op}
              </div>
            ))}
          </div>
          {value && (
            <div
              style={{ padding: "6px 12px", fontSize: 11, color: "#cc3333", cursor: "pointer", borderTop: "1px solid #e0eef7" }}
              onClick={() => seleccionar("")}
            >
              ✕ Limpiar
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function Facturas({ proveedores = [] }) {
  const [facturas, setFacturas]     = useState([]);
  const [selected, setSelected]     = useState(null);
  const [detalle, setDetalle]       = useState(null);
  const [modal, setModal]           = useState(null); // "nueva"|"editar"|"detalle"|"ocr"
  const [loading, setLoading]       = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrResult, setOcrResult]   = useState(null);
  const [form, setForm]             = useState(EMPTY_FACTURA);
  const [itemsForm, setItemsForm]   = useState([]);
  const [dragOver, setDragOver]     = useState(false);
  const [imgPreview, setImgPreview] = useState(null);
  const [imgFile, setImgFile]       = useState(null);
  const [filtro, setFiltro]         = useState("");
  const [provId, setProvId]         = useState("");
  // ── Sync articulos ─────────────────────────────────────────────────────────
  const [articulosPendientes, setArticulosPendientes] = useState([]);
  const [modalArticulo, setModalArticulo] = useState(null);
  const [articulosCola, setArticulosCola] = useState([]);
  // Listas para SelectConFiltro en modal nuevo artículo
  const [listaRubros,   setListaRubros]   = useState([]);
  const [listaFamilias, setListaFamilias] = useState([]);
  const [listaUnidades, setListaUnidades] = useState([]);
  const fileRef = useRef();
  const sinResolverRef = useRef([]); // ítems sin resolver guardados hasta que se pase a modal "nueva"

  useEffect(() => {
    fetch(`${API}/articulos/listas-campos`)
      .then((r) => r.json())
      .then((d) => {
        setListaRubros(d.rubros   || []);
        setListaFamilias(d.familias || []);
        setListaUnidades(d.unidades || []);
      })
      .catch(() => {});
  }, []);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchFacturas = () => {
    setLoading(true);
    fetch(`${API}/facturas`)
      .then((r) => r.json())
      .then((data) => { setFacturas(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchFacturas(); }, []);

  const fetchDetalle = (id) => {
    fetch(`${API}/facturas/${id}`)
      .then((r) => r.json())
      .then((d) => { setDetalle(d); setModal("detalle"); })
      .catch(console.error);
  };

  // ── Filtro ─────────────────────────────────────────────────────────────────
  const facturasFiltradas = facturas.filter((f) => {
    const txt = filtro.toLowerCase();
    return (
      !txt ||
      (f.numero ?? "").toLowerCase().includes(txt) ||
      (f.proveedor_nombre ?? "").toLowerCase().includes(txt) ||
      (f.fecha ?? "").includes(txt)
    );
  });

  // ── Cálculos automáticos de totales ────────────────────────────────────────
  // Recalcula iva$ y total cuando cambia subtotal o iva_pct
  const recalcTotales = (f) => {
    const sub = parseFloat(f.subtotal) || 0;
    const pct = parseFloat(f.iva_pct) || 0;
    const ivaImporte = +(sub * pct / 100).toFixed(2);
    const total = +(sub + ivaImporte).toFixed(2);
    return { ...f, iva: ivaImporte || "", total: total || "" };
  };

  const setFormField = (key, val) => {
    setForm((prev) => {
      const next = { ...prev, [key]: val };
      if (key === "subtotal" || key === "iva_pct") return recalcTotales(next);
      return next;
    });
  };

  // ── OCR ────────────────────────────────────────────────────────────────────
  const handleFile = (file) => {
    if (!file) return;
    setImgFile(file);
    setImgPreview(URL.createObjectURL(file));
  };

  const lanzarOcr = async () => {
    if (!imgFile) return;
    setOcrProgress(10);
    const fd = new FormData();
    fd.append("imagen", imgFile);
    if (provId) fd.append("proveedor_id", provId);

    try {
      setOcrProgress(40);
      const res = await fetch(`${API}/facturas/ocr-preview`, { method: "POST", body: fd });
      setOcrProgress(80);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setOcrProgress(100);
      setOcrResult(data);

      const f = data.factura ?? {};
      // Derivar iva_pct a partir de subtotal e iva si están disponibles
      let ivaPct = "21";
      if (f.subtotal && f.iva) {
        const derived = Math.round((parseFloat(f.iva) / parseFloat(f.subtotal)) * 100);
        if ([10.5, 21, 27].includes(derived)) ivaPct = String(derived);
      }

      setForm(recalcTotales({
        proveedor_id:   f.proveedor_id  ?? provId ?? "",
        numero:         f.numero        ?? "",
        fecha:          f.fecha         ?? "",
        tipo_factura:   f.tipo_factura  ?? "",
        condicion_pago: f.condicion_pago ?? "",
        subtotal:       f.subtotal      ?? "",
        iva_pct:        ivaPct,
        iva:            f.iva           ?? "",
        total:          f.total         ?? "",
        moneda:         f.moneda        ?? "ARS",
      }));

      const itemsEnriquecidos = await enriquecerItemsOcr(
        (data.items ?? []).map((it) => ({
          codigo:       it.codigo       ?? "",
          descripcion:  it.descripcion  ?? "",
          cantidad:     it.cantidad     ?? "",
          precio_unit:  it.precio_unit  ?? "",
          subtotalprod: it.subtotalprod ?? it.subtotal ?? "",
          _resuelto:    it._resuelto,   // flag del backend: true=resuelto, false=encolar
        }))
      );
      setItemsForm(itemsEnriquecidos);

      // Ítems sin código tras todo el proceso → encolar para editar/agregar
      const provNombre = proveedores.find(p => String(p.id) === String(f.proveedor_id ?? provId))?.provnombre ?? "";
      const sinResolver = itemsEnriquecidos.filter(
        it => !(it.codigo && it.codigo.trim()) || it._coincidencias
      ).map(it => ({ ...it, proveedorNombre: provNombre }));
      // Guardar en ref — se dispara cuando el usuario hace click en "Revisar y guardar"
      sinResolverRef.current = sinResolver;

      setTimeout(() => setOcrProgress(0), 800);
    } catch (e) {
      alert("Error OCR: " + e.message);
      setOcrProgress(0);
    }
  };

  // ── Guardar (manual o post-OCR) ────────────────────────────────────────────
  const guardarFactura = async () => {
    try {
      // Verificar número de factura duplicado (solo en modo nueva)
      if (modal !== "editar" && form.numero && form.numero.trim() !== "") {
        const existe = facturas.find(
          (f) => (f.numero ?? "").trim().toLowerCase() === form.numero.trim().toLowerCase()
        );
        if (existe) {
          alert(`⚠️ La factura N° ${form.numero} ya está cargada (ID #${existe.id} — ${existe.proveedor_nombre ?? "sin proveedor"}).`);
          return;
        }
      }

      let imagenUrl = null;
      if (imgFile && !ocrResult) {
        const fd = new FormData();
        fd.append("imagen", imgFile);
        const up = await fetch(`${API}/api/upload-imagen-factura`, { method: "POST", body: fd });
        const upData = await up.json();
        imagenUrl = upData.url;
      }

      const { iva_pct, ...formSinPct } = form;
      const body = {
        ...formSinPct,
        proveedor_id: form.proveedor_id ? Number(form.proveedor_id) : null,
        subtotal:     form.subtotal  ? Number(form.subtotal)  : null,
        iva:          form.iva       ? Number(form.iva)       : null,
        total:        form.total     ? Number(form.total)     : null,
        ...(imagenUrl ? { imagen_path: imagenUrl } : {}),
        ...(ocrResult?.imagenUrl ? { imagen_path: ocrResult.imagenUrl } : {}),
        items: itemsForm.map((it) => ({
          codigo:       it.codigo      || null,
          descripcion:  it.descripcion || null,
          cantidad:     it.cantidad    ? Number(it.cantidad)    : null,
          precio_unit:  it.precio_unit ? Number(it.precio_unit) : null,
          subtotalprod: it.subtotalprod ? Number(it.subtotalprod) : null,
        })),
      };

      const url    = modal === "editar" ? `${API}/facturas/${selected.id}` : `${API}/facturas`;
      const method = modal === "editar" ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());

      // ── Sync con tabla articulos ──────────────────────────────────────────
      // Nombre del proveedor para pre-rellenar el modal
      const provNombre = proveedores.find((p) => String(p.id) === String(form.proveedor_id))?.provnombre ?? "";
      await sincronizarArticulos(itemsForm, provNombre);

      fetchFacturas();
      cerrarModal();
    } catch (e) {
      alert("Error al guardar: " + e.message);
    }
  };

  // ── Lógica de sincronización con articulos ──────────────────────────────────
  // Flujo por ítem (con o sin código):
  //   A) Tiene código:
  //      1. Buscar en articulos por codartint/codartprov
  //         → Encontrado: sumar cantidad (PATCH)
  //         → No encontrado (404): buscar por descripción:
  //            · 1 coincidencia única → sumar cantidad a ese artículo
  //            · Varias              → encolar con coincidencias para que el usuario elija
  //            · Ninguna             → encolar para agregar nuevo artículo
  //   B) Sin código pero con descripción:
  //      1. Buscar directamente por descripción
  //         → 1 coincidencia única → sumar cantidad
  //         → Varias              → encolar con coincidencias
  //         → Ninguna             → encolar para agregar nuevo (no habrá código, el usuario lo asignará)
  // ── Sincronizar ítems de la factura con tabla articulos ───────────────────
  // Flujo por ítem:
  //   1. Buscar por código (codartint o codartprov) → encontrado: sumar cantidad
  //   2. No encontrado → buscar por prod_prov (descripción exacta de la factura)
  //      → 1 coincidencia: sumar cantidad
  //      → Varias: encolar con coincidencias para que el usuario elija
  //      → Ninguna: encolar → modal pregunta si quiere Editar existente o Agregar nuevo
  const sincronizarArticulos = async (items, provNombre) => {
    const itemsValidos = items.filter(
      (it) => (it.codigo && it.codigo.trim()) || (it.descripcion && it.descripcion.trim())
    );
    if (itemsValidos.length === 0) return;

    const noExisten = [];

    for (const item of itemsValidos) {
      const codigoTrim = (item.codigo || "").trim();
      const descTrim   = (item.descripcion || "").trim();

      try {
        // ── Paso 1: buscar por prod_prov (PRIORIDAD MÁXIMA) ──
        if (descTrim) {
          const resPP = await fetch(`${API}/articulos/buscar-prod-prov?q=${encodeURIComponent(descTrim)}`);
          if (resPP.ok) {
            const hits = await resPP.json();
            if (hits.length === 1) {
              await fetch(`${API}/articulos/${encodeURIComponent(hits[0].codartint)}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cantidad: (Number(hits[0].cantidad) || 0) + (Number(item.cantidad) || 0) }),
              });
              continue;
            }
            if (hits.length > 1) {
              noExisten.push({ ...item, proveedorNombre: provNombre, coincidencias: hits });
              continue;
            }
          }
        }

        // ── Paso 2: buscar por código ──
        if (codigoTrim) {
          const resCod = await fetch(`${API}/articulos/${encodeURIComponent(codigoTrim)}`);
          if (resCod.ok) {
            const art = await resCod.json();
            // Guardar prod_prov si estaba vacío
            if (descTrim && !(art.prod_prov || "").trim()) {
              fetch(`${API}/articulos/${encodeURIComponent(art.codartint)}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prod_prov: descTrim }),
              }).catch(() => {});
            }
            await fetch(`${API}/articulos/${encodeURIComponent(art.codartint)}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ cantidad: (Number(art.cantidad) || 0) + (Number(item.cantidad) || 0) }),
            });
            continue;
          }
        }

        // ── Paso 3: fallback — buscar por columna articulo ──
        if (descTrim) {
          const resDesc = await fetch(`${API}/articulos/buscar-descripcion?q=${encodeURIComponent(descTrim)}`);
          if (resDesc.ok) {
            const hits = await resDesc.json();
            if (hits.length === 1) {
              await fetch(`${API}/articulos/${encodeURIComponent(hits[0].codartint)}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cantidad: (Number(hits[0].cantidad) || 0) + (Number(item.cantidad) || 0) }),
              });
              continue;
            }
            if (hits.length > 1) {
              noExisten.push({ ...item, proveedorNombre: provNombre, coincidencias: hits });
              continue;
            }
          }
        }

        // ── Sin coincidencias: encolar para editar/agregar ──
        noExisten.push({ ...item, proveedorNombre: provNombre });

      } catch { /* ignorar error individual */ }
    }

    if (noExisten.length > 0) {
      setArticulosCola(noExisten);
      setModalArticulo(noExisten[0]);
    }
  };

  // Confirmar: agregar artículo nuevo y actualizar el código en itemsForm
  const confirmarAgregarArticulo = async (item, datosExtra) => {
    const descFactura     = (item.descripcion || "").trim();
    const codartprovFinal = datosExtra.codartprov
      ? datosExtra.codartprov.trim()
      : (item.codigo ? item.codigo.trim() : null);

    try {
      await fetch(`${API}/articulos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codartint:  datosExtra.codartint ? datosExtra.codartint.trim() : null,
          codartprov: codartprovFinal,
          articulo:   datosExtra.articulo && datosExtra.articulo.trim()
                        ? datosExtra.articulo.trim()
                        : descFactura,
          prod_prov:  descFactura || null,
          proveedor:  datosExtra.proveedor || item.proveedorNombre || "",
          cantidad:   Number(item.cantidad) || 0,
          rubro:      datosExtra.rubro   || null,
          familia:    datosExtra.familia || null,
          unidad:     datosExtra.unidad  || null,
        }),
      });

      // Actualizar el código en itemsForm para que aparezca al guardar la factura
      // Busca por descripción (el código puede ser vacío o el original del OCR sin resolver)
      if (codartprovFinal) {
        setItemsForm((prev) =>
          prev.map((it) =>
            (it.descripcion || "").trim() === descFactura
              ? { ...it, codigo: codartprovFinal, _resuelto: true }
              : it
          )
        );
      }
    } catch (e) {
      alert("Error al agregar artículo: " + e.message);
    }
    avanzarCola();
  };

  // Omitir: no agregar este artículo
  const omitirArticulo = () => avanzarCola();

  // Procesar el siguiente item de la cola — resetear estados del modal
  const avanzarCola = () => {
    setModoModal("elegir");
    setBusqEditar("");
    setResEditar([]);
    setNuevoArtForm({ codartint: "", codartprov: "", articulo: "", proveedor: "", rubro: "", familia: "", unidad: "" });
    setArticulosCola((prev) => {
      const resto = prev.slice(1);
      setModalArticulo(resto.length > 0 ? resto[0] : null);
      return resto;
    });
  };

  // ── Modal confirmar nuevo artículo ──────────────────────────────────────────
  // modoModal: "elegir" → muestra botones Editar/Agregar
  //            "agregar" → form de nuevo artículo
  //            "editar"  → buscador para vincular artículo existente
  const [nuevoArtForm, setNuevoArtForm] = useState({ codartint: "", codartprov: "", articulo: "", proveedor: "", rubro: "", familia: "", unidad: "" });
  const [modoModal, setModoModal]       = useState("elegir"); // "elegir"|"agregar"|"editar"
  const [busqEditar, setBusqEditar]     = useState("");       // texto del buscador en modo editar
  const [resEditar, setResEditar]       = useState([]);       // resultados del buscador

  const renderModalArticulo = () => {
    if (!modalArticulo) return null;
    const item = modalArticulo;
    const total = articulosCola.length;
    const tieneCoincidencias = item.coincidencias && item.coincidencias.length > 0;

    // Sumar cantidad a un artículo existente y avanzar
    const usarCoincidencia = async (art) => {
      await fetch(`${API}/articulos/${encodeURIComponent(art.codartint)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cantidad: (Number(art.cantidad) || 0) + (Number(item.cantidad) || 0) }),
      });
      avanzarCola();
    };

    // Buscar artículos existentes para vincular (modo editar)
    const buscarParaEditar = async (q) => {
      setBusqEditar(q);
      if (!q.trim()) { setResEditar([]); return; }
      try {
        const r = await fetch(`${API}/articulos/buscar-descripcion?q=${encodeURIComponent(q)}`);
        if (r.ok) setResEditar(await r.json());
      } catch { /* silencioso */ }
    };

    // Vincular artículo existente: guardar prod_prov con la desc de la factura y sumar cantidad
    const vincularExistente = async (art) => {
      await fetch(`${API}/articulos/${encodeURIComponent(art.codartint)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prod_prov: (item.descripcion || "").trim() || art.prod_prov,
          ...(art.codartprov ? {} : { codartprov: item.codigo || null }),
          cantidad: (Number(art.cantidad) || 0) + (Number(item.cantidad) || 0),
        }),
      });
      avanzarCola();
    };

    const BG = { background: "#f5faff", border: "1px solid #a0cce8", borderRadius: 4, padding: "12px 16px", marginBottom: 20 };

    return (
      <div style={{ ...S.overlay, zIndex: 300 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ ...S.modal, width: "min(600px, 96vw)" }} onClick={(e) => e.stopPropagation()}>

          {/* Encabezado */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
            <div>
              <h2 style={{ ...S.modalTitle, marginBottom: 4, fontSize: 17 }}>
                {tieneCoincidencias ? "Posibles coincidencias" : "Artículo no encontrado en stock"}
              </h2>
              <p style={{ fontSize: 11, color: "#6699bb", letterSpacing: 1, margin: 0 }}>
                {tieneCoincidencias
                  ? "ELEGÍ EL ARTÍCULO CORRECTO O DECIDÍ QUÉ HACER"
                  : "NO SE ENCONTRÓ POR CÓDIGO NI POR PROD_PROV — ¿QUÉ QUERÉS HACER?"}
              </p>
            </div>
            {total > 1 && (
              <span style={{ fontSize: 11, color: "#6699bb", background: "#e8f5fd", padding: "4px 10px", borderRadius: 12, border: "1px solid #a0cce8" }}>
                {total} pendientes
              </span>
            )}
          </div>

          {/* Info del ítem de la factura */}
          <div style={BG}>
            <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "6px 12px", fontSize: 12 }}>
              <span style={{ color: "#6699bb", fontSize: 10, letterSpacing: 1, textTransform: "uppercase" }}>Código factura</span>
              <strong style={{ color: "#0a3a5c", fontFamily: "monospace" }}>{item.codigo || "—"}</strong>
              <span style={{ color: "#6699bb", fontSize: 10, letterSpacing: 1, textTransform: "uppercase" }}>Descripción</span>
              <span style={{ color: "#0a3a5c" }}>{item.descripcion || "—"}</span>
              <span style={{ color: "#6699bb", fontSize: 10, letterSpacing: 1, textTransform: "uppercase" }}>Cantidad</span>
              <span style={{ color: "#0a3a5c" }}>{item.cantidad}</span>
              <span style={{ color: "#6699bb", fontSize: 10, letterSpacing: 1, textTransform: "uppercase" }}>Proveedor</span>
              <span style={{ color: "#0a3a5c" }}>{item.proveedorNombre || "—"}</span>
            </div>
          </div>

          {/* ── Múltiples coincidencias por prod_prov ── */}
          {tieneCoincidencias && modoModal === "elegir" && (
            <>
              <div style={{ ...S.sectionTitle, marginBottom: 10 }}>Artículos similares en stock</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
                {item.coincidencias.map((art) => (
                  <div key={art.codartint} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    background: "#fff", border: "1px solid #a0cce8", borderRadius: 4,
                    padding: "10px 14px", fontSize: 12, gap: 12,
                  }}>
                    <div style={{ flex: 1 }}>
                      <strong style={{ color: "#0a3a5c", fontFamily: "monospace" }}>{art.codartint}</strong>
                      <span style={{ color: "#6699bb", margin: "0 8px" }}>·</span>
                      <span>{art.articulo}</span>
                      {art.prod_prov && <span style={{ color: "#99bbcc", marginLeft: 8, fontSize: 11 }}>[{art.prod_prov}]</span>}
                    </div>
                    <button style={{ ...S.btnSmall, background: "#0a7c4a", color: "#fff", border: "none" }}
                      onClick={() => usarCoincidencia(art)}>✔ Usar</button>
                  </div>
                ))}
              </div>
              <div style={{ ...S.sectionTitle, marginBottom: 12 }}>O elegí otra acción</div>
            </>
          )}

          {/* ── Modo ELEGIR: sin coincidencias → dos opciones ── */}
          {modoModal === "elegir" && (
            <div style={{ display: "flex", gap: 12, marginBottom: 4 }}>
              <button
                style={{ ...S.btnPrimary, flex: 1, justifyContent: "center", background: "#1a5fa8" }}
                onClick={() => setModoModal("editar")}
              >
                🔗 Vincular con existente
              </button>
              <button
                style={{ ...S.btnPrimary, flex: 1, justifyContent: "center", background: "#0a7c4a" }}
                onClick={() => setModoModal("agregar")}
              >
                ＋ Agregar como nuevo
              </button>
            </div>
          )}

          {/* ── Modo EDITAR: buscador para vincular con artículo existente ── */}
          {modoModal === "editar" && (
            <>
              <div style={{ ...S.sectionTitle, marginBottom: 10 }}>Buscar artículo existente para vincular</div>
              <div style={{ ...S.field }}>
                <input
                  style={S.input}
                  placeholder="Escribí código o nombre del artículo…"
                  value={busqEditar}
                  autoFocus
                  onChange={(e) => buscarParaEditar(e.target.value)}
                />
              </div>
              {resEditar.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16, maxHeight: 220, overflowY: "auto" }}>
                  {resEditar.map((art) => (
                    <div key={art.codartint} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      background: "#fff", border: "1px solid #a0cce8", borderRadius: 4,
                      padding: "9px 14px", fontSize: 12, gap: 12,
                    }}>
                      <div style={{ flex: 1 }}>
                        <strong style={{ color: "#0a3a5c", fontFamily: "monospace" }}>{art.codartint}</strong>
                        <span style={{ color: "#6699bb", margin: "0 8px" }}>·</span>
                        <span>{art.articulo}</span>
                        {art.prod_prov && <span style={{ color: "#99bbcc", marginLeft: 8, fontSize: 11 }}>[{art.prod_prov}]</span>}
                      </div>
                      <button style={{ ...S.btnSmall, background: "#1a5fa8", color: "#fff", border: "none" }}
                        onClick={() => vincularExistente(art)}>
                        🔗 Vincular
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {busqEditar.trim() && resEditar.length === 0 && (
                <p style={{ color: "#99bbcc", fontSize: 12, marginBottom: 12 }}>Sin resultados para "{busqEditar}"</p>
              )}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button style={S.btnSecondary} onClick={() => { setModoModal("elegir"); setBusqEditar(""); setResEditar([]); }}>← Volver</button>
                <button style={S.btnSecondary} onClick={omitirArticulo}>Omitir ítem</button>
              </div>
            </>
          )}

          {/* ── Modo AGREGAR: form de nuevo artículo ── */}
          {modoModal === "agregar" && (
            <>
              <div style={{ ...S.sectionTitle, marginBottom: 12 }}>Datos del nuevo artículo</div>

              {/* Códigos */}
              <div style={S.row2}>
                <div style={S.field}>
                  <label style={S.label}>Código interno <span style={{ color: "#99bbcc", fontWeight: 400 }}>(codartint)</span></label>
                  <input style={S.input} placeholder="Ej: SA78018"
                    value={nuevoArtForm.codartint}
                    onChange={(e) => setNuevoArtForm((p) => ({ ...p, codartint: e.target.value }))} />
                </div>
                <div style={S.field}>
                  <label style={S.label}>Código proveedor <span style={{ color: "#99bbcc", fontWeight: 400 }}>(codartprov)</span></label>
                  <input style={S.input}
                    placeholder="Ej: 78018"
                    value={nuevoArtForm.codartprov || item.codigo || ""}
                    onChange={(e) => setNuevoArtForm((p) => ({ ...p, codartprov: e.target.value }))} />
                </div>
              </div>

              <div style={S.field}>
                <label style={S.label}>
                  Artículo
                  <span style={{ color: "#99bbcc", fontWeight: 400, marginLeft: 6 }}>(desc. factura como base)</span>
                </label>
                <input style={S.input}
                  placeholder={item.descripcion || "Nombre del artículo"}
                  value={nuevoArtForm.articulo}
                  onChange={(e) => setNuevoArtForm((p) => ({ ...p, articulo: e.target.value }))} />
                {!nuevoArtForm.articulo && item.descripcion && (
                  <small style={{ color: "#6699bb", fontSize: 10, marginTop: 3, display: "block" }}>
                    Se usará: <em>{item.descripcion}</em>
                  </small>
                )}
              </div>
              <div style={S.field}>
                <SelectConFiltro
                  label="Proveedor"
                  value={nuevoArtForm.proveedor}
                  onChange={(v) => setNuevoArtForm((p) => ({ ...p, proveedor: v }))}
                  opciones={proveedores.map((p) => p.provnombre || p.nombre || p).filter(Boolean)}
                  placeholder={item.proveedorNombre || "Seleccionar proveedor..."}
                />
              </div>
              <div style={S.row2}>
                <div style={S.field}>
                  <SelectConFiltro
                    label="Rubro"
                    value={nuevoArtForm.rubro}
                    onChange={(v) => setNuevoArtForm((p) => ({ ...p, rubro: v }))}
                    opciones={listaRubros}
                    placeholder="Ej: MUEBLES"
                  />
                </div>
                <div style={S.field}>
                  <SelectConFiltro
                    label="Familia"
                    value={nuevoArtForm.familia}
                    onChange={(v) => setNuevoArtForm((p) => ({ ...p, familia: v }))}
                    opciones={listaFamilias}
                    placeholder="Ej: INSUMO AMOBLAMIENTOS"
                  />
                </div>
              </div>
              <div style={S.field}>
                <SelectConFiltro
                  label="Unidad"
                  value={nuevoArtForm.unidad}
                  onChange={(v) => setNuevoArtForm((p) => ({ ...p, unidad: v }))}
                  opciones={listaUnidades}
                  placeholder="Ej: m², kg, u"
                />
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
                <button style={S.btnSecondary} onClick={() => setModoModal("elegir")}>← Volver</button>
                <button style={S.btnSecondary} onClick={omitirArticulo}>Omitir ítem</button>
                <button style={{ ...S.btnPrimary, background: "#0a7c4a" }}
                  onClick={() => confirmarAgregarArticulo(item, {
                    codartint:  nuevoArtForm.codartint,
                    codartprov: nuevoArtForm.codartprov || item.codigo || null,
                    articulo:   nuevoArtForm.articulo,
                    proveedor:  nuevoArtForm.proveedor || item.proveedorNombre,
                    rubro:      nuevoArtForm.rubro,
                    familia:    nuevoArtForm.familia,
                    unidad:     nuevoArtForm.unidad,
                  })}>
                  ✔ Guardar nuevo artículo
                </button>
              </div>
            </>
          )}

          {/* Botón omitir global (solo en modo elegir) */}
          {modoModal === "elegir" && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
              <button style={S.btnSecondary} onClick={omitirArticulo}>Omitir ítem</button>
            </div>
          )}

        </div>
      </div>
    );
  };

  const eliminarFactura = async (id) => {
    if (!confirm("¿Eliminar esta factura y sus ítems?")) return;
    await fetch(`${API}/facturas/${id}`, { method: "DELETE" });
    setSelected(null);
    fetchFacturas();
  };

  // ── Helpers form ───────────────────────────────────────────────────────────
  const cerrarModal = () => {
    setModal(null); setForm(EMPTY_FACTURA); setItemsForm([]);
    setOcrResult(null); setImgFile(null); setImgPreview(null);
    setProvId(""); setOcrProgress(0);
  };

  const abrirEditar = (f) => {
    setSelected(f);
    // Derivar iva_pct desde iva e subtotal
    let ivaPct = "21";
    if (f.subtotal && f.iva) {
      const derived = Math.round((parseFloat(f.iva) / parseFloat(f.subtotal)) * 100);
      if ([10.5, 21, 27].includes(derived)) ivaPct = String(derived);
    }
    setForm({
      proveedor_id:   f.proveedor_id  ?? "",
      numero:         f.numero        ?? "",
      fecha:          f.fecha?.slice(0, 10) ?? "",
      tipo_factura:   f.tipo_factura  ?? "",
      condicion_pago: f.condicion_pago ?? "",
      subtotal:       f.subtotal      ?? "",
      iva_pct:        ivaPct,
      iva:            f.iva           ?? "",
      total:          f.total         ?? "",
      moneda:         f.moneda        ?? "ARS",
    });
    fetch(`${API}/facturas-items/${f.id}`)
      .then((r) => r.json())
      .then((items) => setItemsForm(items.map((it) => ({
        id:           it.id,
        codigo:       it.codigo       ?? "",
        descripcion:  it.descripcion  ?? "",
        cantidad:     it.cantidad     ?? "",
        precio_unit:  it.precio_unit  ?? "",
        subtotalprod: it.subtotalprod ?? "",
      }))));
    setModal("editar");
  };

  const addItem = () => setItemsForm((prev) => [...prev, { ...EMPTY_ITEM }]);
  const updateItem = (i, k, v) =>
    setItemsForm((prev) => prev.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)));
  const removeItem = (i) => setItemsForm((prev) => prev.filter((_, idx) => idx !== i));

  const calcSubtotalProd = (i) => {
    const it = itemsForm[i];
    const c = parseFloat(it.cantidad) || 0;
    const p = parseFloat(it.precio_unit) || 0;
    if (c && p) updateItem(i, "subtotalprod", (c * p).toFixed(2));
  };

  // ── Busca codartprov en articulos por descripción y lo completa en el ítem ───
  // Siempre devuelve codartprov, nunca codartint.
  // Flujo: buscar desc en prod_prov → buscar codigo en codartprov → sin resultado
  const resolverCodigoPorDescripcion = async (i) => {
    const it = itemsForm[i];
    const codigoActual = (it.codigo || "").trim();
    const desc         = (it.descripcion || "").trim();
    if (!desc) return;

    // Paso 1: buscar descripción en prod_prov → devuelve codartprov
    try {
      const resPP = await fetch(`${API}/articulos/buscar-prod-prov?q=${encodeURIComponent(desc)}`);
      if (resPP.ok) {
        const hits = await resPP.json();
        if (hits.length === 1) {
          setItemsForm((prev) => prev.map((item, idx) =>
            idx === i ? { ...item, codigo: hits[0].codartprov, _resolvedFrom: "prod_prov" } : item
          ));
          return;
        }
        if (hits.length > 1) {
          setItemsForm((prev) => prev.map((item, idx) =>
            idx === i ? { ...item, _coincidencias: hits } : item
          ));
          return;
        }
      }
    } catch { /* silencioso */ }

    // Paso 2: buscar código actual en codartprov → confirmar y guardar prod_prov si faltaba
    if (codigoActual) {
      try {
        const resCod = await fetch(`${API}/articulos/buscar-codartprov?codartprov=${encodeURIComponent(codigoActual)}`);
        if (resCod.ok) {
          const art = await resCod.json();
          if (art) {
            if (!(art.prod_prov || "").trim()) {
              fetch(`${API}/articulos/${encodeURIComponent(art.codartint)}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prod_prov: desc }),
              }).catch(() => {});
            }
            // Mantener el codartprov que ya tenía, no pisar
            return;
          }
        }
      } catch { /* silencioso */ }
    }
  };

  // ── Enriquecer ítems OCR ─────────────────────────────────────────────────────
  // El backend ya resolvió por codartprov y prod_prov.
  // A) Con código: guardar prod_prov si faltaba, devolver tal cual.
  // B) Sin código: buscar por descripción en prod_prov
  //    → 1 resultado → completar con codartprov
  //    → varios      → marcar _coincidencias para selector inline
  //    → ninguno     → dejar vacío → se encolará al "Revisar y guardar"
  const enriquecerItemsOcr = async (items) => {
    return Promise.all(items.map(async (it) => {
      const codigo = (it.codigo || "").trim();
      const desc   = (it.descripcion || "").trim();

      // ── A) Ya tiene código — guardar prod_prov si faltaba y devolver ─────────
      if (codigo) {
        try {
          const r = await fetch(`${API}/articulos/buscar-codartprov?codartprov=${encodeURIComponent(codigo)}`);
          if (r.ok) {
            const art = await r.json();
            if (art && desc && !(art.prod_prov || "").trim()) {
              fetch(`${API}/articulos/${encodeURIComponent(art.codartint)}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prod_prov: desc }),
              }).catch(() => {});
            }
          }
        } catch { /* silencioso */ }
        return it;
      }

      // ── B) Sin código — buscar por descripción en prod_prov ─────────────────
      if (desc) {
        try {
          const r = await fetch(`${API}/articulos/buscar-prod-prov?q=${encodeURIComponent(desc)}`);
          if (r.ok) {
            const hits = await r.json();
            if (hits.length === 1) {
              return { ...it, codigo: hits[0].codartprov || hits[0].codartint };
            }
            if (hits.length > 1) {
              return { ...it, _coincidencias: hits };
            }
          }
        } catch { /* silencioso */ }
      }

      // Sin coincidencia → código vacío → se encolará
      return it;
    }));
  };

  // ── Render lista ──────────────────────────────────────────────────────────
  const renderLista = () => (
    <>
      <div style={S.header}>
        <div>
          <h1 style={S.title}>Facturas</h1>
          <p style={S.subtitle}>Gestión de comprobantes</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={S.btnSecondary} onClick={() => setModal("ocr")}>🔍 Cargar con OCR</button>
          <button style={S.btnPrimary} onClick={() => setModal("nueva")}>＋ Nueva factura</button>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <input
          style={{ ...S.input, maxWidth: 360 }}
          placeholder="Buscar por número, proveedor o fecha…"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
      </div>

      {loading ? (
        <p style={{ color: "#6699bb", fontSize: 13 }}>Cargando…</p>
      ) : facturasFiltradas.length === 0 ? (
        <p style={{ color: "#6699bb", fontSize: 13 }}>No hay facturas registradas.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={S.table}>
            <thead>
              <tr>
                {["#", "Proveedor", "Tipo", "Número", "Fecha", "Subtotal", "IVA $", "Total", "Moneda", ""].map((h) => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {facturasFiltradas.map((f) => (
                <tr
                  key={f.id}
                  style={{ cursor: "pointer", background: selected?.id === f.id ? "#e8f5fd" : undefined }}
                  onClick={() => setSelected(selected?.id === f.id ? null : f)}
                  onDoubleClick={() => fetchDetalle(f.id)}
                >
                  <td style={S.td}>{f.id}</td>
                  <td style={S.td}>{f.proveedor_nombre ?? <span style={{ color: "#aaa" }}>—</span>}</td>
                  <td style={S.td}>
                    {f.tipo_factura
                      ? <span style={S.badge("#0a3a5c")}>F.{f.tipo_factura}</span>
                      : <span style={{ color: "#aaa" }}>—</span>}
                  </td>
                  <td style={S.td}><strong>{f.numero ?? "—"}</strong></td>
                  <td style={S.td}>{f.fecha?.slice(0, 10) ?? "—"}</td>
                  <td style={{ ...S.td, textAlign: "right" }}>{fmt(f.subtotal)}</td>
                  <td style={{ ...S.td, textAlign: "right" }}>{fmt(f.iva)}</td>
                  <td style={{ ...S.td, textAlign: "right", fontWeight: 700 }}>{fmt(f.total)}</td>
                  <td style={S.td}>
                    <span style={S.badge(f.moneda === "USD" ? "#2255aa" : "#00885a")}>{f.moneda ?? "ARS"}</span>
                  </td>
                  <td style={S.td}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button style={S.btnSmall} onClick={(e) => { e.stopPropagation(); fetchDetalle(f.id); }}>Ver</button>
                      <button style={S.btnSmall} onClick={(e) => { e.stopPropagation(); abrirEditar(f); }}>✏️</button>
                      <button style={S.btnDanger} onClick={(e) => { e.stopPropagation(); eliminarFactura(f.id); }}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );

  // ── Modal OCR ─────────────────────────────────────────────────────────────
  const renderModalOcr = () => (
    <div style={S.overlay} onClick={cerrarModal}>
      <div style={S.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={S.modalTitle}>🔍 Cargar factura con OCR</h2>

        <div
          style={{ ...S.dropzone, ...(dragOver ? S.dropzoneActive : {}) }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
          onClick={() => fileRef.current.click()}
        >
          {imgPreview ? (
            <img src={imgPreview} alt="preview" style={{ maxHeight: 180, maxWidth: "100%", borderRadius: 4 }} />
          ) : (
            <>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📄</div>
              <div>Arrastrá la imagen de la factura aquí<br />o hacé clic para seleccionar</div>
              <div style={{ fontSize: 11, marginTop: 8, color: "#99bbcc" }}>JPG · PNG · TIFF · BMP</div>
            </>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
          onChange={(e) => handleFile(e.target.files[0])} />

        <div style={S.field}>
          <label style={S.label}>Proveedor (opcional)</label>
          <select style={S.select} value={provId} onChange={(e) => setProvId(e.target.value)}>
            <option value="">— Sin asignar —</option>
            {proveedores.map((p) => <option key={p.id} value={p.id}>{p.provnombre}</option>)}
          </select>
        </div>

        {ocrProgress > 0 && (
          <div style={S.progressBar}>
            <div style={S.progressFill(ocrProgress)} />
          </div>
        )}

        {ocrResult && (
          <div style={{ background: "#e8f5fd", border: "1px solid #a0cce8", borderRadius: 4, padding: 14, marginBottom: 16, fontSize: 12 }}>
            <strong>✔ OCR completado</strong> — Revisá los datos en el formulario a continuación antes de guardar.
          </div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button style={S.btnSecondary} onClick={cerrarModal}>Cancelar</button>
          {!ocrResult ? (
            <button style={S.btnPrimary} onClick={lanzarOcr} disabled={!imgFile}>
              {ocrProgress > 0 ? "Procesando…" : "Extraer datos"}
            </button>
          ) : (
            <button style={S.btnPrimary} onClick={() => {
              setModal("nueva");
              // Disparar cola de artículos sin resolver ahora que el modal de form está activo
              if (sinResolverRef.current.length > 0) {
                setArticulosCola(sinResolverRef.current);
                setModalArticulo(sinResolverRef.current[0]);
                sinResolverRef.current = [];
              }
            }}>
              Revisar y guardar →
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // ── Modal form (nueva / editar) ────────────────────────────────────────────
  const renderModalForm = () => (
    <div style={S.overlay} onClick={cerrarModal}>
      <div style={{ ...S.modal, width: "min(960px, 96vw)" }} onClick={(e) => e.stopPropagation()}>
        <h2 style={S.modalTitle}>{modal === "editar" ? "✏️ Editar factura" : "Nueva factura"}</h2>

        {/* ── Cabecera ── */}
        <div style={{ ...S.sectionTitle }}>Datos de la factura</div>

        <div style={S.row3}>
          <div style={S.field}>
            <label style={S.label}>Proveedor</label>
            <select style={S.select} value={form.proveedor_id}
              onChange={(e) => setFormField("proveedor_id", e.target.value)}>
              <option value="">— Sin asignar —</option>
              {proveedores.map((p) => <option key={p.id} value={p.id}>{p.provnombre}</option>)}
            </select>
          </div>
          <div style={S.field}>
            <label style={S.label}>Tipo de factura</label>
            <select style={S.select} value={form.tipo_factura}
              onChange={(e) => setFormField("tipo_factura", e.target.value)}>
              <option value="">—</option>
              {TIPOS_FACTURA.map((t) => <option key={t} value={t}>Factura {t}</option>)}
            </select>
          </div>
          <div style={S.field}>
            <label style={S.label}>Número de factura</label>
            <input style={S.input} value={form.numero}
              placeholder="0001-00001234"
              onChange={(e) => setFormField("numero", e.target.value)} />
          </div>
        </div>

        <div style={S.row3}>
          <div style={S.field}>
            <label style={S.label}>Fecha</label>
            <input type="date" style={S.input} value={form.fecha}
              onChange={(e) => setFormField("fecha", e.target.value)} />
          </div>
          <div style={S.field}>
            <label style={S.label}>Condición de pago</label>
            <select style={S.select} value={form.condicion_pago}
              onChange={(e) => setFormField("condicion_pago", e.target.value)}>
              <option value="">—</option>
              {CONDICIONES_PAGO.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ ...S.field, maxWidth: "100%" }}>
            <label style={S.label}>Moneda</label>
            <select style={S.select} value={form.moneda}
              onChange={(e) => setFormField("moneda", e.target.value)}>
              {MONEDAS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        {/* ── Totales ── */}
        <div style={{ ...S.sectionTitle, marginTop: 8 }}>Importes</div>

        <div style={S.row4}>
          <div style={S.field}>
            <label style={S.label}>Subtotal $</label>
            <input type="number" style={S.input} value={form.subtotal} placeholder="0.00"
              onChange={(e) => setFormField("subtotal", e.target.value)} />
          </div>
          <div style={S.field}>
            <label style={S.label}>IVA %</label>
            <select style={S.select} value={form.iva_pct}
              onChange={(e) => setFormField("iva_pct", e.target.value)}>
              <option value="0">0 %</option>
              <option value="10.5">10,5 %</option>
              <option value="21">21 %</option>
              <option value="27">27 %</option>
            </select>
          </div>
          <div style={S.field}>
            <label style={S.label}>IVA $</label>
            <input type="number" style={S.input} value={form.iva} placeholder="0.00"
              onChange={(e) => setFormField("iva", e.target.value)} />
          </div>
          <div style={S.field}>
            <label style={S.label}>Total $</label>
            <input type="number" style={{ ...S.input, fontWeight: 700 }} value={form.total} placeholder="0.00"
              onChange={(e) => setFormField("total", e.target.value)} />
          </div>
        </div>

        {/* ── Ítems ── */}
        <div style={{ ...S.sectionTitle, marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Ítems del comprobante</span>
          <button style={S.btnSmall} onClick={addItem}>＋ Agregar ítem</button>
        </div>

        {itemsForm.length === 0 ? (
          <p style={{ color: "#aaa", fontSize: 12, marginBottom: 12 }}>Sin ítems cargados.</p>
        ) : (
          <>
            {/* Cabeceras items */}
            <div style={{ ...S.itemRow, marginBottom: 4 }}>
              {["Código", "Descripción", "Cant.", "Precio unit.", "Subtotal", ""].map((h) => (
                <div key={h} style={{ fontSize: 10, color: "#6699bb", letterSpacing: 1 }}>{h}</div>
              ))}
            </div>
            {itemsForm.map((it, i) => (
              <div key={i}>
                <div style={S.itemRow}>
                  <input
                    style={{ ...S.input, background: it._resolvedFrom === "desc" ? "#edfdf5" : undefined }}
                    value={it.codigo} placeholder="SKU/Cód."
                    onChange={(e) => updateItem(i, "codigo", e.target.value)}
                    title={it._resolvedFrom === "desc" ? "Código completado por descripción" : undefined}
                  />
                  <input style={S.input} value={it.descripcion} placeholder="Descripción"
                    onChange={(e) => updateItem(i, "descripcion", e.target.value)}
                    onBlur={() => resolverCodigoPorDescripcion(i)} />
                  <input type="number" style={S.input} value={it.cantidad} placeholder="0"
                    onChange={(e) => updateItem(i, "cantidad", e.target.value)}
                    onBlur={() => calcSubtotalProd(i)} />
                  <input type="number" style={S.input} value={it.precio_unit} placeholder="0.00"
                    onChange={(e) => updateItem(i, "precio_unit", e.target.value)}
                    onBlur={() => calcSubtotalProd(i)} />
                  <input type="number" style={S.input} value={it.subtotalprod} placeholder="0.00"
                    onChange={(e) => updateItem(i, "subtotalprod", e.target.value)} />
                  <button style={S.btnDanger} onClick={() => removeItem(i)}>✕</button>
                </div>
                {/* Selector inline cuando hay varias coincidencias por descripción */}
                {it._coincidencias && it._coincidencias.length > 0 && (
                  <div style={{ gridColumn: "1 / -1", background: "#fffbea", border: "1px solid #f0c040", borderRadius: 4, padding: "8px 12px", marginBottom: 8, fontSize: 11 }}>
                    <span style={{ color: "#7a5c00", fontWeight: 700, marginRight: 8 }}>⚠ Varias coincidencias — elegí el artículo:</span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                      {it._coincidencias.map((art) => (
                        <button key={art.codartint} style={{ ...S.btnSmall, fontSize: 11 }}
                          onClick={() => setItemsForm((prev) => prev.map((item, idx) =>
                            idx === i ? { ...item, codigo: art.codartint, _coincidencias: null, _resolvedFrom: "desc" } : item
                          ))}>
                          {art.codartint} · {art.articulo?.slice(0, 40)}
                        </button>
                      ))}
                      <button style={{ ...S.btnSmall, fontSize: 11, color: "#999" }}
                        onClick={() => setItemsForm((prev) => prev.map((item, idx) =>
                          idx === i ? { ...item, _coincidencias: null } : item
                        ))}>
                        Ninguno
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
          <button style={S.btnSecondary} onClick={cerrarModal}>Cancelar</button>
          <button style={S.btnPrimary} onClick={guardarFactura}>
            {modal === "editar" ? "Guardar cambios" : "Guardar factura"}
          </button>
        </div>
      </div>
    </div>
  );

  // ── Modal detalle ─────────────────────────────────────────────────────────
  const renderModalDetalle = () => {
    if (!detalle) return null;
    const f = detalle;
    return (
      <div style={S.overlay} onClick={() => { setModal(null); setDetalle(null); }}>
        <div style={{ ...S.modal, width: "min(860px, 95vw)" }} onClick={(e) => e.stopPropagation()}>
          <h2 style={S.modalTitle}>
            {f.tipo_factura ? `Factura ${f.tipo_factura} ` : "Factura "}#{f.numero ?? f.id}
          </h2>

          <div style={S.row3}>
            <div><label style={S.label}>Proveedor</label><p style={{ fontSize: 13 }}>{f.proveedor_nombre ?? "—"}</p></div>
            <div><label style={S.label}>Fecha</label><p style={{ fontSize: 13 }}>{f.fecha?.slice(0, 10) ?? "—"}</p></div>
            <div><label style={S.label}>Moneda</label><p style={{ fontSize: 13 }}>{f.moneda ?? "ARS"}</p></div>
          </div>
          <div style={{ ...S.row3, marginTop: 12 }}>
            <div><label style={S.label}>Tipo de factura</label><p style={{ fontSize: 13 }}>{f.tipo_factura ? `Factura ${f.tipo_factura}` : "—"}</p></div>
            <div><label style={S.label}>Cond. de pago</label><p style={{ fontSize: 13 }}>{f.condicion_pago ?? "—"}</p></div>
            <div>
              <label style={S.label}>Totales</label>
              <p style={{ fontSize: 13 }}>
                Sub: <strong>{fmt(f.subtotal)}</strong> · IVA: <strong>{fmt(f.iva)}</strong> · Total: <strong>{fmt(f.total)}</strong>
              </p>
            </div>
          </div>

          {f.imagen_path && (
            <div style={{ margin: "16px 0" }}>
              <label style={S.label}>Imagen original</label>
              <a href={f.imagen_path} target="_blank" rel="noreferrer">
                <img src={f.imagen_path} alt="factura" style={{ maxHeight: 200, border: "1px solid #a0cce8", borderRadius: 4 }} />
              </a>
            </div>
          )}

          <label style={{ ...S.label, marginTop: 16 }}>Ítems ({(f.items ?? []).length})</label>
          {(f.items ?? []).length === 0 ? (
            <p style={{ color: "#aaa", fontSize: 12 }}>Sin ítems registrados.</p>
          ) : (
            <table style={{ ...S.table, marginTop: 8 }}>
              <thead>
                <tr>
                  {["Código", "Descripción", "Cantidad", "Precio unit.", "Subtotal prod."].map((h) => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {f.items.map((it) => (
                  <tr key={it.id}>
                    <td style={S.td}>{it.codigo ?? "—"}</td>
                    <td style={S.td}>{it.descripcion ?? "—"}</td>
                    <td style={{ ...S.td, textAlign: "right" }}>{it.cantidad ?? "—"}</td>
                    <td style={{ ...S.td, textAlign: "right" }}>{fmt(it.precio_unit)}</td>
                    <td style={{ ...S.td, textAlign: "right", fontWeight: 700 }}>{fmt(it.subtotalprod)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
            <button style={S.btnSecondary} onClick={() => { setModal(null); setDetalle(null); }}>Cerrar</button>
          </div>
        </div>
      </div>
    );
  };

  // ── Render principal ───────────────────────────────────────────────────────
  return (
    <div style={S.wrap}>
      {renderLista()}
      {modal === "ocr"     && renderModalOcr()}
      {(modal === "nueva" || modal === "editar") && renderModalForm()}
      {modal === "detalle" && renderModalDetalle()}
      {modalArticulo && renderModalArticulo()}
    </div>
  );
}
