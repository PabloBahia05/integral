import { useState, useEffect, useRef } from "react";
import PresupuestoMamparas from "./PresupuestoMamparas";
import TiposVanitory from "./TiposVanitory";
import ArmarVanitory from "./ArmarVanitory";
import BreakdownFormulasVanitory from "./BreakdownFormulasVanitory";

const API = "http://localhost:3001";

const LOCALIDADES = ["Bahía Blanca", "Punta Alta", "Monte Hermoso", "Coronel Rosales", "Otra"];

const formatFechaLarga = (fecha) => {
  const d = fecha ? new Date(fecha + "T12:00:00") : new Date();
  return d.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
};

export default function PresupuestoNuevo({
  onVolver,
  onGuardado,
  onVerTabla,
  presupuestoInicial = null,
  tiposVanitory = [],
  tiposVanitoryRUD = {},
}) {
  const listaPendienteRef = useRef(null);

  const [numero, setNumero]         = useState("Nuevo");
  const [numeroPres, setNumeroPres] = useState(null); // número real asignado tras primer guardado
  const [revision, setRevision]     = useState(1);
  const [cliente, setCliente]       = useState("Consumidor final");
  const [clientesSugeridos, setClientesSugeridos] = useState([]);
  const [lineasBD, setLineasBD] = useState([]); // valores distintos de columna 'linea' en articulos
  const [telefonoSearch, setTelefonoSearch] = useState("");
  const [telefonosSugeridos, setTelefonosSugeridos] = useState([]);
  const [telefono1, setTelefono1]   = useState("");
  const [telefono2, setTelefono2]   = useState("");
  const [wapp, setWapp]             = useState("");
  const [localidad, setLocalidad]   = useState("Bahía Blanca");
  const [fecha, setFecha]           = useState(new Date().toISOString().slice(0, 10));
  const [leyenda, setLeyenda]       = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [guardando, setGuardando]   = useState(false);
  const [guardadoOk, setGuardadoOk] = useState(false);
  const [error, setError]           = useState("");

  // Lista de precios
  const [listasDB, setListasDB] = useState([]); // listas traídas de BD
  const [listaPrecio, setListaPrecio] = useState("");

  // Porcentaje de la lista activa (0 si no hay porcentaje)
  const listaActiva = listasDB.find(l => l.lista === listaPrecio);
  const listaPorcentaje = parseFloat(listaActiva?.porcentaje ?? listaActiva?.PORCENTAJE ?? 0) || 0;

  // Aplica el porcentaje de la lista al precio base
  const aplicarPorcentaje = (precioBase) => {
    if (!precioBase && precioBase !== 0) return "";
    const base = parseFloat(precioBase) || 0;
    if (listaPorcentaje === 0) return String(base);
    return String(Math.round(base * (1 + listaPorcentaje / 100) * 100) / 100);
  };
  const [mostrarCosto, setMostrarCosto]   = useState(false);
  const [incluirPrecio, setIncluirPrecio] = useState(false);
  const [incluirTotal, setIncluirTotal]   = useState(false);
  const [color, setColor]                 = useState("");
  const [incluirTextoColoc, setIncluirTextoColoc] = useState(false);
  const [agregarIVA, setAgregarIVA]               = useState(true);

  // Líneas (3 slots)
  const [lineas, setLineas] = useState([
    { linea: "[Sin líneas]", col2: "", col3: "" },
    { linea: "[Sin líneas]", col2: "", col3: "" },
    { linea: "[Sin líneas]", col2: "", col3: "" },
  ]);

  // Pestañas
  const [tab, setTab] = useState("encabezado"); // "encabezado" | "cocina" | "placard" | "mampara" | "especiales" | "presupuesto"

  // Sub-navegación Especiales
  const [especialesVista, setEspecialesVista] = useState("selector"); // "selector" | "vanitory" | "escritorio" | "despensero"
  const [vanitoryVista, setVanitoryVista] = useState("tipos"); // "tipos" | "armar" | "breakdown"
  const [vanitoryModelo, setVanitoryModelo] = useState(null);

  // ── Cocina ───────────────────────────────────────────────
  // familiaActiva: null | "bajomesadas" | "alacenas"
  const [cocinaFamilia, setCocinaFamilia] = useState(null);
  // líneas cargadas por familia: { bajomesadas: [...], alacenas: [...] }
  const [cocinaItems, setCocinaItems] = useState({ bajomesadas: [], alacenas: [] });

  // ── Placard ──────────────────────────────────────────────
  const [placardFamilia, setPlacardFamilia] = useState(null);
  const [placardItems, setPlacardItems] = useState({ placard: [] });

  // ── Tabla resumen presupuesto (solapa Presupuesto) ───────
  // Cada ítem: { id, seccion, descripcion, cantidad, precio, subtotal }
  const [presupuestoItems, setPresupuestoItems] = useState([]);

  // ── Popover de ajuste inline por fila ───────────────────
  // { tipo: "cocina"|"placard", familia, idx, campo: "precio"|linea_idx, anchorRect }
  const [precioPopover, setPrecioPopover] = useState(null);
  const [popoverModo, setPopoverModo]     = useState("valor");   // "valor" | "porcentaje"
  const [popoverInput, setPopoverInput]   = useState("");

  const abrirPrecioPopover = (tipo, familia, idx, campo, precioActual, e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();

    // Recuperar el porcentaje ya guardado en esa columna (si existe)
    const items = tipo === "cocina"
      ? cocinaItems[familia] ?? []
      : placardItems[familia] ?? [];
    const fila = items[idx];
    const CAMPOS_POR_IDX = [
      { v: "valor1", p: "porcentaje1" },
      { v: "valor2", p: "porcentaje2" },
      { v: "valor3", p: "porcentaje3" },
    ];
    let porcentajeActual = null;
    if (fila) {
      if (campo === "precio") {
        porcentajeActual = fila.porcentaje1 ?? null;
      } else if (CAMPOS_POR_IDX[campo]) {
        porcentajeActual = fila[CAMPOS_POR_IDX[campo].p] ?? null;
      }
    }

    setPrecioPopover({ tipo, familia, idx, campo, precioActual, porcentajeActual, rect });
    setPopoverModo("valor");
    setPopoverInput(String(precioActual ?? ""));
  };

  const cerrarPopover = () => { setPrecioPopover(null); setPopoverInput(""); };

  const confirmarPopover = () => {
    if (!precioPopover) return;
    const val = parseFloat(popoverInput);
    if (isNaN(val)) { cerrarPopover(); return; }
    const { tipo, familia, idx, campo, precioActual } = precioPopover;

    const calcNuevo = (base) => {
      const b = parseFloat(base) || 0;
      if (popoverModo === "valor") return val < 0 ? Math.max(0, b + val) : val;
      return Math.round(b * (1 + val / 100) * 100) / 100;
    };

    // Devuelve { valor: "N", porcentaje: N|null } para guardar en valorN/porcentajeN
    const calcPersist = (base) => {
      const nuevo = calcNuevo(base);
      return {
        valor:      nuevo,
        porcentaje: popoverModo === "porcentaje" ? val : null,
      };
    };

    // Mapeo índice de columna (0,1,2) → campos valor/porcentaje en la fila
    const CAMPOS_POR_IDX = [
      { v: "valor1", p: "porcentaje1" },
      { v: "valor2", p: "porcentaje2" },
      { v: "valor3", p: "porcentaje3" },
    ];

    const actualizarItems = (prev) => prev.map((fila, i) => {
      if (i !== idx) return fila;

      if (campo === "precio") {
        // Sin líneas activas: precio único — guardamos en valor1/porcentaje1
        const { valor, porcentaje } = calcPersist(fila.precio);
        return {
          ...fila,
          precio:      String(valor),
          valor1:      valor,
          porcentaje1: porcentaje,
        };
      }

      // campo es índice de línea (número)
      const lineaIdx = campo; // 0-based
      const precios = (fila.precios ?? []).map((p, li) => {
        if (li !== lineaIdx) return p;
        const { valor } = calcPersist(p.precio);
        return { ...p, precio: String(valor) };
      });
      const nuevoPrecio = precios[0]?.precio ?? fila.precio;

      // Guardar valor y porcentaje en el slot correspondiente (valorN/porcentajeN)
      const slot = CAMPOS_POR_IDX[lineaIdx];
      const { valor, porcentaje } = calcPersist(
        (fila.precios?.[lineaIdx]?.precio ?? fila.precio) || 0
      );

      const extra = slot
        ? { [slot.v]: valor, [slot.p]: porcentaje }
        : {};

      return { ...fila, precios, precio: String(nuevoPrecio), ...extra };
    });

    if (tipo === "cocina") {
      setCocinaItems(prev => ({ ...prev, [familia]: actualizarItems(prev[familia] ?? []) }));
    } else {
      setPlacardItems(prev => ({ ...prev, [familia]: actualizarItems(prev[familia] ?? []) }));
    }
    cerrarPopover();
  };

  // ── Ajuste de precios ────────────────────────────────────
  const [ajusteModo, setAjusteModo]     = useState("porcentaje"); // "porcentaje" | "monto"
  const [ajusteValor, setAjusteValor]   = useState("");
  const [ajusteScope, setAjusteScope]   = useState("todos");      // "todos" | id de item
  const [preciosOriginales, setPreciosOriginales] = useState({}); // { [id]: precio }
  const [ajusteAplicado, setAjusteAplicado] = useState(false);

  const aplicarAjuste = () => {
    const val = parseFloat(ajusteValor);
    if (!val || isNaN(val)) return;

    setPresupuestoItems(prev => {
      // Guardar originales antes del primer ajuste
      if (!ajusteAplicado) {
        const orig = {};
        prev.forEach(it => { orig[it.id] = it.precio; });
        setPreciosOriginales(orig);
      }
      return prev.map(it => {
        if (ajusteScope !== "todos" && it.id !== ajusteScope) return it;
        // Usar precio ORIGINAL si ya hay ajuste aplicado (evita acumulación)
        const base = ajusteAplicado
          ? (preciosOriginales[it.id] ?? it.precio)
          : it.precio;
        const precioBase = parseFloat(base) || 0;
        let nuevoPrecio;
        if (ajusteModo === "porcentaje") {
          nuevoPrecio = Math.round(precioBase * (1 + val / 100) * 100) / 100;
        } else {
          nuevoPrecio = Math.round((precioBase + val) * 100) / 100;
        }
        if (nuevoPrecio < 0) nuevoPrecio = 0;
        const nuevaCantidad = parseFloat(it.cantidad) || 1;
        return { ...it, precio: nuevoPrecio, subtotal: nuevoPrecio * nuevaCantidad };
      });
    });
    setAjusteAplicado(true);
  };

  const revertirAjuste = () => {
    if (!ajusteAplicado) return;
    setPresupuestoItems(prev =>
      prev.map(it => {
        if (preciosOriginales[it.id] == null) return it;
        const p = parseFloat(preciosOriginales[it.id]) || 0;
        return { ...it, precio: p, subtotal: p * (parseFloat(it.cantidad) || 1) };
      })
    );
    setAjusteAplicado(false);
    setAjusteValor("");
    setPreciosOriginales({});
  };

  const agregarAPresupuesto = (item) => {
    setPresupuestoItems(prev => {
      // Evitar duplicados por id único
      const existe = prev.find(p => p.id === item.id);
      if (existe) return prev.map(p => p.id === item.id ? item : p);
      return [...prev, item];
    });
  };

  const quitarDePresupuesto = (id) =>
    setPresupuestoItems(prev => prev.filter(p => p.id !== id));

  // ── Estado compartido para el buscador de artículos ─────
  // productos traídos de la BD (para el autocomplete)
  const [productosDB, setProductosDB] = useState([]);
  // fila en edición dentro de cocina (índice o null)
  const [cocinaEditIdx, setCocinaEditIdx] = useState(null);
  // nueva fila en construcción
  const [cocinaFila, setCocinaFila] = useState({ articulo: "", nombreart: "", cantidad: 1, precio: "", precios: [], margen: null, valor1: null, porcentaje1: null, valor2: null, porcentaje2: null, valor3: null, porcentaje3: null });
  // búsqueda en el input de artículo
  const [cocinaSearch, setCocinaSearch] = useState("");
  // placard edit state
  const [placardEditIdx, setPlacardEditIdx] = useState(null);
  const [placardFila, setPlacardFila] = useState({ articulo: "", nombreart: "", cantidad: 1, precio: "", precios: [], margen: null, valor1: null, porcentaje1: null, valor2: null, porcentaje2: null, valor3: null, porcentaje3: null });
  const [placardSearch, setPlacardSearch] = useState("");
  const [cocinaSearchFocus, setCocinaSearchFocus] = useState(false);
  const [placardSearchFocus, setPlacardSearchFocus] = useState(false);
  // Artículos del endpoint agrupado (por familia activa)
  const [articulosFamilia, setArticulosFamilia] = useState([]);

  useEffect(() => {
    // Próximo número
    fetch(`${API}/tabla-presupuestos/proximo-numero`)
      .then(r => r.json())
      .then(d => { if (d?.proximo != null) setNumero(String(d.proximo).padStart(4, "0")); })
      .catch(() => {});
    // Líneas disponibles desde BD (columna linea de articulos)
    fetch(`${API}/articulos/lineas`)
      .then(r => r.json())
      .then(data => setLineasBD(Array.isArray(data) ? data : []))
      .catch(() => {});
    // Listas de precios desde BD
    fetch(`${API}/lista`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setListasDB(data);
          if (listaPendienteRef.current) {
            setListaPrecio(listaPendienteRef.current);
            listaPendienteRef.current = null;
          } else if (!presupuestoInicial) {
            setListaPrecio(data[0].lista);
          }
        }
      })
      .catch(() => {});
  }, []);

  // ── Cargar presupuesto existente desde BD ────────────────
  const cargarPresupuesto = async (pres) => {
    if (!pres) return;
    const num = pres.numeropres ?? pres.id;
    try {
      // 1. Traer items de tabla_presupuestos
      const rev = pres.revision ?? pres.REVISION ?? 0;
      const r = await fetch(`${API}/tabla-presupuestos?numeropres=${num}&revision=${rev}`);
      const items = await r.json();
      if (!Array.isArray(items)) return;

      // 2. Restaurar encabezado
      setNumeroPres(num);
      setNumero(String(num).padStart(4, "0"));
      setCliente(pres.nombre ?? pres.NOMBRE ?? "");
      setFecha((pres.fecha ?? pres.FECHA ?? "").slice(0, 10));
      setRevision(Number(pres.revision ?? pres.REVISION ?? 1));
      const listaGuardada = pres.lista ?? pres.LISTA ?? null;
      if (listaGuardada) { listaPendienteRef.current = listaGuardada; setListaPrecio(listaGuardada); }

      const itemConLinea = items.find(it => it.linea1 ?? it.LINEA1) ?? items[0];
      const l1 = itemConLinea?.linea1 ?? itemConLinea?.LINEA1 ?? pres.linea1 ?? null;
      const l2 = itemConLinea?.linea2 ?? itemConLinea?.LINEA2 ?? pres.linea2 ?? null;
      const l3 = itemConLinea?.linea3 ?? itemConLinea?.LINEA3 ?? pres.linea3 ?? null;
      setLineas([
        { linea: l1 ?? "[Sin líneas]", col2: "", col3: "" },
        { linea: l2 ?? "[Sin líneas]", col2: "", col3: "" },
        { linea: l3 ?? "[Sin líneas]", col2: "", col3: "" },
      ]);

      const nuevaCocina  = { bajomesadas: [], alacenas: [] };
      const nuevoPlacard = { placard: [] };
      const otrosItems   = [];

      items.forEach(it => {
        const tipo = (it.tipo ?? it.TIPO ?? "").toLowerCase();
        const articulo  = it.articulo  ?? it.ARTICULO  ?? "";
        const nombreart = it.nombreart ?? it.NOMBREART ?? "";
        const v1 = parseFloat(it.valor1 ?? it.VALOR1) || null;
        const v2 = parseFloat(it.valor2 ?? it.VALOR2) || null;
        const v3 = parseFloat(it.valor3 ?? it.VALOR3) || null;
        const precios = [
          ...(l1 && v1 != null ? [{ linea: l1, precioBase: String(v1), precio: String(v1) }] : []),
          ...(l2 && v2 != null ? [{ linea: l2, precioBase: String(v2), precio: String(v2) }] : []),
          ...(l3 && v3 != null ? [{ linea: l3, precioBase: String(v3), precio: String(v3) }] : []),
        ];
        const fila = {
          articulo, nombreart,
          cantidad: parseFloat(it.cantidad ?? it.CANTIDAD) || 1,
          precio: String(v1 ?? 0), precioBase: String(v1 ?? 0),
          precios, preciosBase: precios.map(p => ({ linea: p.linea, precioBase: p.precioBase })),
          margen: it.margen ?? null,
          valor1: v1, porcentaje1: parseFloat(it.margen1 ?? it.MARGEN1) || null,
          valor2: v2, porcentaje2: parseFloat(it.margen2 ?? it.MARGEN2) || null,
          valor3: v3, porcentaje3: parseFloat(it.margen3 ?? it.MARGEN3) || null,
        };
        if (tipo.includes("cocina") && tipo.includes("bajomesada")) nuevaCocina.bajomesadas.push(fila);
        else if (tipo.includes("cocina") && tipo.includes("alacena")) nuevaCocina.alacenas.push(fila);
        else if (tipo.includes("placard")) nuevoPlacard.placard.push(fila);
        else {
          const precio0 = v1 ?? 0;
          otrosItems.push({
            id: `otros-${it.id}`, seccion: it.tipo ?? it.TIPO ?? "Otros",
            descripcion: articulo, nombreart,
            cantidad: parseFloat(it.cantidad ?? it.CANTIDAD) || 1,
            precio: precio0, subtotal: precio0 * (parseFloat(it.cantidad ?? it.CANTIDAD) || 1),
            precios, margen: it.margen ?? null,
            valor1: v1, porcentaje1: parseFloat(it.margen1 ?? it.MARGEN1) || null,
            valor2: v2, porcentaje2: parseFloat(it.margen2 ?? it.MARGEN2) || null,
            valor3: v3, porcentaje3: parseFloat(it.margen3 ?? it.MARGEN3) || null,
          });
        }
      });

      setCocinaItems(nuevaCocina);
      setPlacardItems(nuevoPlacard);
      // Los otros se fusionarán en el useEffect de sincronización
      if (otrosItems.length > 0) {
        setPresupuestoItems(prev => {
          const sinOtros = prev.filter(p => p.id.startsWith("cocina-") || p.id.startsWith("placard-"));
          return [...sinOtros, ...otrosItems];
        });
      }
    } catch (e) {
      console.error("Error cargando presupuesto:", e);
    }
  };

  // Cargar si viene presupuestoInicial como prop (desde la tabla)
  useEffect(() => {
    if (presupuestoInicial) cargarPresupuesto(presupuestoInicial);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presupuestoInicial]);

  // Recargar artículos cuando cambia la familia activa (cocina o placard)
  const familiaActivaActual = tab === "cocina" ? cocinaFamilia : tab === "placard" ? placardFamilia : null;
  useEffect(() => {
    if (!familiaActivaActual) { setArticulosFamilia([]); return; }
    // Mapear nombre interno → nombre en BD
    const familiaMap = { bajomesadas: "Bajomesada", alacenas: "Alacena", placard: "Placard" };
    const familiaBD = familiaMap[familiaActivaActual] ?? familiaActivaActual;
    fetch(`${API}/articulos/por-familia?familia=${encodeURIComponent(familiaBD)}`)
      .then(r => r.json())
      .then(data => setArticulosFamilia(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [familiaActivaActual]);

  // Recalcula una fila aplicando el porcentaje de la lista activa
  const recalcFila = (fila) => {
    if (fila.preciosBase && fila.preciosBase.length > 0) {
      const nuevosPrecios = fila.preciosBase.map(pb => ({
        linea: pb.linea,
        precioBase: pb.precioBase,
        precio: aplicarPorcentaje(pb.precioBase),
      }));
      const nuevoPrecio = nuevosPrecios[0]?.precio ?? fila.precioBase ?? fila.precio;
      return { ...fila, precios: nuevosPrecios, precio: String(nuevoPrecio) };
    }
    if (fila.precioBase != null && fila.precioBase !== "") {
      return { ...fila, precio: aplicarPorcentaje(fila.precioBase) };
    }
    return fila;
  };

  // Actualiza todo el front con los parámetros actuales del encabezado — sin tocar el backend
  const handleActualizar = () => {
    setCocinaItems(prev => {
      const next = {};
      for (const [familia, filas] of Object.entries(prev)) {
        next[familia] = filas.map(recalcFila);
      }
      return next;
    });
    setPlacardItems(prev => {
      const next = {};
      for (const [familia, filas] of Object.entries(prev)) {
        next[familia] = filas.map(recalcFila);
      }
      return next;
    });
  };

  // Recalcular precios cuando cambia la lista de precios
  useEffect(() => {
    setCocinaItems(prev => {
      const next = {};
      for (const [familia, filas] of Object.entries(prev)) {
        next[familia] = filas.map(recalcFila);
      }
      return next;
    });
    setPlacardItems(prev => {
      const next = {};
      for (const [familia, filas] of Object.entries(prev)) {
        next[familia] = filas.map(recalcFila);
      }
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listaPrecio]);

  // Sincronizar cocina y placard con la tabla de presupuesto
  useEffect(() => {
    const toItems = (seccion, itemsObj) =>
      Object.entries(itemsObj).flatMap(([familia, filas]) =>
        filas.map((f, i) => ({
          id:          `${seccion}-${familia}-${i}`,
          seccion:     seccion === "cocina" ? `Cocina / ${familia.charAt(0).toUpperCase() + familia.slice(1)}` : `Placard / ${familia.charAt(0).toUpperCase() + familia.slice(1)}`,
          descripcion: f.articulo,
          nombreart:   f.nombreart ?? "",
          cantidad:    parseFloat(f.cantidad) || 1,
          precio:      parseFloat(f.precio)   || 0,
          subtotal:    (parseFloat(f.precio) || 0) * (parseFloat(f.cantidad) || 1),
          precios:     f.precios     ?? [],
          margen:      f.margen      ?? null,
          valor1:      f.valor1      ?? null,
          porcentaje1: f.porcentaje1 ?? null,
          valor2:      f.valor2      ?? null,
          porcentaje2: f.porcentaje2 ?? null,
          valor3:      f.valor3      ?? null,
          porcentaje3: f.porcentaje3 ?? null,
        }))
      );

    const cocinaRows  = toItems("cocina",  cocinaItems);
    const placardRows = toItems("placard", placardItems);

    setPresupuestoItems(prev => {
      // Mantener los ítems de mampara/especiales, reemplazar cocina/placard
      const otros = prev.filter(p => !p.id.startsWith("cocina-") && !p.id.startsWith("placard-"));
      return [...cocinaRows, ...placardRows, ...otros];
    });
  }, [cocinaItems, placardItems]);

  const setLinea = (idx, field, val) => {
    setLineas(prev => prev.map((l, i) => i === idx ? { ...l, [field]: val } : l));
  };

  // ── Helpers Cocina ───────────────────────────────────────
  const cocinaAgregarFila = () => {
    if (!cocinaFila.articulo.trim()) return;
    setCocinaItems(prev => ({
      ...prev,
      [cocinaFamilia]: [...prev[cocinaFamilia], { ...cocinaFila }],
    }));
    setCocinaFila({ articulo: "", nombreart: "", cantidad: 1, precio: "", precios: [], margen: null, valor1: null, porcentaje1: null, valor2: null, porcentaje2: null, valor3: null, porcentaje3: null });
    setCocinaSearch("");
  };

  const cocinaEliminarFila = (idx) => {
    setCocinaItems(prev => ({
      ...prev,
      [cocinaFamilia]: prev[cocinaFamilia].filter((_, i) => i !== idx),
    }));
  };

  const cocinaGuardarEdit = (idx) => {
    setCocinaItems(prev => ({
      ...prev,
      [cocinaFamilia]: prev[cocinaFamilia].map((r, i) => i === idx ? { ...cocinaFila } : r),
    }));
    setCocinaEditIdx(null);
    setCocinaFila({ articulo: "", nombreart: "", cantidad: 1, precio: "", precios: [], margen: null, valor1: null, porcentaje1: null, valor2: null, porcentaje2: null, valor3: null, porcentaje3: null });
    setCocinaSearch("");
  };

  const cocinaIniciarEdit = (idx) => {
    const fila = cocinaItems[cocinaFamilia][idx];
    setCocinaFila({ ...fila });
    setCocinaSearch(fila.articulo);
    setCocinaEditIdx(idx);
  };

  const cocina_total = (familia) =>
    cocinaItems[familia]?.reduce((s, r) => s + (parseFloat(r.precio) || 0) * (parseFloat(r.cantidad) || 0), 0) ?? 0;

  const placard_total = (familia) =>
    placardItems[familia]?.reduce((s, r) => s + (parseFloat(r.precio) || 0) * (parseFloat(r.cantidad) || 0), 0) ?? 0;

  // Normaliza un string: minúsculas y sin tildes
  const normalizar = (s) =>
    String(s ?? "").toLowerCase().trim()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Devuelve la familia del producto desde el campo 'familia'
  const getProductoFamilia = (p) => normalizar(p.familia ?? p.FAMILIA ?? "");

  // Quita el sufijo de número de línea al final
  // Ejemplos: "Bajomesada 100 2 Ptas Nº 14" → "Bajomesada 100 2 Ptas"
  const nombreBase = (nombre) => {
    const s = String(nombre ?? "").trim();
    const result = s.replace(/\s+N.{0,3}\s*\d+\s*$/i, "").trim();
    return result || s;
  };

  // Líneas activas elegidas en el encabezado (sin "[Sin líneas]")
  const lineasActivas = lineas.filter(l => l.linea && l.linea !== "[Sin líneas]");

  // Dado un nombre base, devuelve el precio para una línea específica (usa datos del nuevo endpoint)
  const getPrecioParaLinea = (base, lineaNombre) => {
    const art = articulosFamilia.find(a => a.articulo === base);
    return art?.precios?.[String(lineaNombre)] ?? null;
  };

  // Filtra artículos por texto de búsqueda (ya vienen agrupados y sin Nº del server)
  const searchActual = tab === "cocina" ? cocinaSearch : placardSearch;
  const productosFiltrados = articulosFamilia
    .filter(a => !searchActual.trim() || normalizar(a.articulo).includes(normalizar(searchActual)))
    .slice(0, 10);

  // ── Helpers Placard ──────────────────────────────────────
  const placardAgregarFila = () => {
    if (!placardFila.articulo.trim()) return;
    setPlacardItems(prev => ({
      ...prev,
      [placardFamilia]: [...(prev[placardFamilia] ?? []), { ...placardFila }],
    }));
    setPlacardFila({ articulo: "", nombreart: "", cantidad: 1, precio: "", precios: [], margen: null, valor1: null, porcentaje1: null, valor2: null, porcentaje2: null, valor3: null, porcentaje3: null });
    setPlacardSearch("");
  };

  const placardEliminarFila = (idx) => {
    setPlacardItems(prev => ({
      ...prev,
      [placardFamilia]: prev[placardFamilia].filter((_, i) => i !== idx),
    }));
  };

  const placardGuardarEdit = (idx) => {
    setPlacardItems(prev => ({
      ...prev,
      [placardFamilia]: prev[placardFamilia].map((r, i) => i === idx ? { ...placardFila } : r),
    }));
    setPlacardEditIdx(null);
    setPlacardFila({ articulo: "", nombreart: "", cantidad: 1, precio: "", precios: [], margen: null, valor1: null, porcentaje1: null, valor2: null, porcentaje2: null, valor3: null, porcentaje3: null });
    setPlacardSearch("");
  };

  const placardIniciarEdit = (idx) => {
    const fila = placardItems[placardFamilia][idx];
    setPlacardFila({ ...fila });
    setPlacardSearch(fila.articulo);
    setPlacardEditIdx(idx);
  };

  const handleGuardar = async (esNuevaRev = false) => {
    if (!cliente.trim()) { setError("El cliente es obligatorio."); return; }
    setError(""); setGuardando(true);

    // Si ya tiene número asignado (presupuesto existente), enviar NUMERO
    // para que el backend cree una nueva revisión en tabla_indice.
    // Si es nuevo, no enviar NUMERO y el backend genera el numeropres automáticamente.
    const esEdicion = numeroPres !== null;

    const lineasElegidas = lineas
      .filter(l => l.linea && l.linea !== "[Sin líneas]")
      .map(l => l.linea);
    const payload = {
      ...(esEdicion ? { numero: numeroPres } : {}),
      nombre: cliente, fecha, lista: listaPrecio,
      lineasElegidas,
      ...(esNuevaRev ? { nuevaRevision: true } : {}),
      items: presupuestoItems.map(it => {
        const v1 = parseFloat(it.precios?.[0]?.precio ?? it.valor1 ?? it.precio) || null;
        const v2 = parseFloat(it.precios?.[1]?.precio ?? it.valor2) || null;
        const v3 = parseFloat(it.precios?.[2]?.precio ?? it.valor3) || null;
        return {
          descripcion: it.descripcion, nombreart: it.nombreart ?? "",
          seccion: it.seccion, cantidad: it.cantidad,
          precio: it.precio, subtotal: it.subtotal, margen: it.margen ?? null,
          valor1: v1, porcentaje1: it.porcentaje1 ?? null,
          valor2: v2, porcentaje2: it.porcentaje2 ?? null,
          valor3: v3, porcentaje3: it.porcentaje3 ?? null,
          precios: it.precios ?? [],
        };
      }),
    };
    try {
      const res = await fetch(`${API}/tabla-presupuestos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al guardar");

      // El servidor devuelve numero (= numeropres de tabla_indice) y revision
      const numAsignado = data.numero ?? data.NUMERO ?? data.id;
      const revAsignada = data.revision ?? data.REVISION ?? revision;
      if (numAsignado != null) {
        setNumeroPres(numAsignado);
        setNumero(String(numAsignado).padStart(4, "0"));
      }
      setRevision(Number(revAsignada));

      setGuardadoOk(true);
      onGuardado?.();
      setTimeout(() => setGuardadoOk(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@700;800&display=swap');

        .pn-root {
          font-family: 'Space Mono', monospace;
          background: #f0f4f8;
          min-height: 100vh;
          color: #1a2332;
        }

        /* ── Barra superior ── */
        .pn-topbar {
          background: #e8f0f7;
          border-bottom: 1px solid #b8cfe0;
          padding: 0 16px;
          display: flex;
          align-items: center;
          gap: 0;
          height: 36px;
        }
        .pn-topbar-title {
          font-size: 12px;
          color: #0a3a5c;
          font-weight: 700;
          margin-right: 16px;
          letter-spacing: 0.04em;
        }
        .pn-menu-item {
          font-size: 12px;
          color: #0a3a5c;
          padding: 0 14px;
          height: 36px;
          display: flex;
          align-items: center;
          cursor: pointer;
          border-right: 1px solid #c8dae8;
          transition: background 0.12s;
        }
        .pn-menu-item:first-of-type { border-left: 1px solid #c8dae8; }
        .pn-menu-item:hover { background: #d0e4f0; }

        /* ── Toolbar ── */
        .pn-toolbar {
          background: #f5f8fb;
          border-bottom: 1px solid #c8dae8;
          padding: 6px 16px;
          display: flex;
          gap: 4px;
          align-items: center;
        }
        .pn-tool-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 5px 14px;
          background: #fff;
          border: 1px solid #b8cfe0;
          border-radius: 2px;
          font-family: 'Space Mono', monospace;
          font-size: 12px;
          color: #0a3a5c;
          cursor: pointer;
          transition: all 0.12s;
        }
        .pn-tool-btn:hover { background: #ddeefa; border-color: #7aaac8; }
        .pn-tool-btn:active { background: #c8e0f0; }
        .pn-tool-btn.save { background: #fff; }

        /* ── Tabs ── */
        .pn-tabs {
          background: #f0f4f8;
          border-bottom: 1px solid #c8dae8;
          padding: 0 16px;
          display: flex;
          gap: 2px;
          padding-top: 6px;
        }
        .pn-tab {
          padding: 6px 18px;
          font-family: 'Space Mono', monospace;
          font-size: 12px;
          cursor: pointer;
          border: 1px solid transparent;
          border-bottom: none;
          border-radius: 3px 3px 0 0;
          color: #6699bb;
          background: transparent;
          transition: all 0.12s;
        }
        .pn-tab:hover { background: #ddeefa; color: #0a3a5c; }
        .pn-tab.active {
          background: #fff;
          border-color: #b8cfe0;
          color: #0a3a5c;
          font-weight: 700;
          position: relative;
          bottom: -1px;
        }

        /* ── Cuerpo ── */
        .pn-body {
          background: #fff;
          border: 1px solid #c8dae8;
          margin: 0 16px 16px;
          padding: 24px 32px;
        }

        /* ── Encabezado del presupuesto ── */
        .pn-header-row {
          display: flex;
          align-items: center;
          gap: 24px;
          margin-bottom: 18px;
          flex-wrap: wrap;
        }
        .pn-numero-label {
          font-size: 16px;
          font-weight: 700;
          color: #0a3a5c;
          letter-spacing: 0.04em;
        }
        .pn-numero-val {
          font-size: 16px;
          color: #2277bb;
          font-weight: 700;
        }
        .pn-rev-group {
          display: flex; align-items: center; gap: 8px;
          font-size: 13px; color: #0a3a5c;
        }
        .pn-rev-input {
          width: 56px; padding: 3px 7px;
          border: 1px solid #b8cfe0; border-radius: 2px;
          font-family: 'Space Mono', monospace; font-size: 13px;
          text-align: center; color: #0a3a5c;
        }

        .pn-field-row {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 12px; flex-wrap: wrap;
        }
        .pn-field-label {
          font-size: 12px; color: #0a3a5c; font-weight: 700;
          min-width: 70px;
        }
        .pn-field-input {
          flex: 1; max-width: 460px;
          padding: 5px 10px;
          border: 1px solid #b8cfe0; border-radius: 2px;
          font-family: 'Space Mono', monospace; font-size: 12px;
          color: #0a3a5c; background: #fff;
          outline: none;
        }
        .pn-field-input:focus { border-color: #4a8ab5; box-shadow: 0 0 0 2px #4a8ab520; }
        .pn-field-select {
          padding: 5px 10px;
          border: 1px solid #b8cfe0; border-radius: 2px;
          font-family: 'Space Mono', monospace; font-size: 12px;
          color: #0a3a5c; background: #fff;
          outline: none; cursor: pointer;
        }
        .pn-field-select:focus { border-color: #4a8ab5; }

        /* ── Fecha ── */
        .pn-fecha-group { margin-left: auto; display: flex; align-items: center; gap: 8px; }
        .pn-fecha-label { font-size: 12px; color: #0a3a5c; font-weight: 700; }
        .pn-fecha-text { font-size: 12px; color: #334155; }

        /* ── Sección líneas ── */
        .pn-section-label {
          font-size: 11px; font-weight: 700; color: #0a3a5c;
          letter-spacing: 0.08em; text-transform: uppercase;
          margin: 18px 0 8px;
        }
        .pn-lineas-grid {
          display: grid;
          grid-template-columns: 200px 1fr 1fr;
          gap: 6px;
          margin-bottom: 4px;
        }
        .pn-linea-row { display: contents; }

        /* ── Sección precios ── */
        .pn-precios-wrap {
          border: 1px solid #c8dae8;
          border-radius: 3px;
          padding: 14px 18px;
          margin-bottom: 14px;
          background: #f8fbfd;
          display: flex;
          gap: 32px;
          align-items: flex-start;
          flex-wrap: wrap;
        }
        .pn-lista-group { display: flex; align-items: center; gap: 8px; }
        .pn-check-group { display: flex; flex-direction: column; gap: 5px; }
        .pn-check-row { display: flex; align-items: center; gap: 7px; font-size: 12px; color: #334155; cursor: pointer; }
        .pn-check-row input[type="checkbox"] { cursor: pointer; accent-color: #2277bb; }
        .pn-color-group { display: flex; align-items: center; gap: 8px; }
        .pn-color-label { font-size: 12px; color: #0a3a5c; }
        .pn-color-input {
          padding: 4px 8px; width: 120px;
          border: 1px solid #b8cfe0; border-radius: 2px;
          font-family: 'Space Mono', monospace; font-size: 12px;
        }
        .pn-right-checks { display: flex; flex-direction: column; gap: 5px; margin-left: auto; }

        /* ── Textarea ── */
        .pn-textarea {
          width: 100%; padding: 8px 10px;
          border: 1px solid #b8cfe0; border-radius: 2px;
          font-family: 'Space Mono', monospace; font-size: 12px;
          color: #0a3a5c; resize: vertical; outline: none;
          background: #fff; box-sizing: border-box;
        }
        .pn-textarea:focus { border-color: #4a8ab5; box-shadow: 0 0 0 2px #4a8ab520; }

        /* ── Feedback ── */
        .pn-error { font-size: 12px; color: #dc2626; background: #fef2f2; border: 1px solid #fca5a5; border-radius: 3px; padding: 6px 12px; margin-bottom: 10px; }
        .pn-ok    { font-size: 12px; color: #16a34a; background: #f0fdf4; border: 1px solid #86efac; border-radius: 3px; padding: 6px 12px; margin-bottom: 10px; }

        /* ── Tab módulos placeholder ── */
        .pn-modulos-empty {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 60px 20px; gap: 10px; color: #94a3b8;
        }

        /* ── Precio editable inline ── */
        .pn-precio-cell {
          cursor: pointer;
          border-radius: 2px;
          padding: 2px 4px;
          transition: background 0.1s;
          display: inline-flex; align-items: center; gap: 4px;
        }
        .pn-precio-cell:hover { background: #ddeefa; }
        .pn-precio-cell::after {
          content: "✏️";
          font-size: 10px;
          opacity: 0;
          transition: opacity 0.12s;
        }
        .pn-precio-cell:hover::after { opacity: 1; }

        /* ── Popover de precio ── */
        .pn-popover-backdrop {
          position: fixed; inset: 0; z-index: 200;
        }
        .pn-popover {
          position: fixed; z-index: 201;
          background: #fff; border: 1px solid #7aaac8;
          border-radius: 4px; box-shadow: 0 8px 24px #0a3a5c22;
          padding: 12px 14px; min-width: 240px;
          font-family: 'Space Mono', monospace; font-size: 12px;
        }
        .pn-popover-title { font-size: 10px; color: #6699bb; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; }
        .pn-pop-toggle { display: flex; border: 1px solid #b8cfe0; border-radius: 2px; overflow: hidden; margin-bottom: 8px; }
        .pn-pop-toggle button {
          flex: 1; padding: 4px 0; border: none; cursor: pointer;
          font-family: 'Space Mono', monospace; font-size: 11px;
          background: #fff; color: #0a3a5c; transition: all 0.1s;
        }
        .pn-pop-toggle button.active { background: #0a3a5c; color: #fff; font-weight: 700; }
        .pn-pop-input-row { display: flex; gap: 6px; align-items: center; }
        .pn-pop-input {
          flex: 1; padding: 5px 8px; border: 1px solid #b8cfe0; border-radius: 2px;
          font-family: 'Space Mono', monospace; font-size: 12px; color: #0a3a5c; outline: none;
        }
        .pn-pop-input:focus { border-color: #4a8ab5; }
        .pn-pop-confirm { padding: 5px 12px; background: #0a3a5c; color: #fff; border: none; border-radius: 2px; cursor: pointer; font-family: 'Space Mono', monospace; font-size: 12px; font-weight: 700; }
        .pn-pop-cancel  { padding: 5px 10px; background: #fff; color: #6699bb; border: 1px solid #c8dae8; border-radius: 2px; cursor: pointer; font-family: 'Space Mono', monospace; font-size: 12px; }
        .pn-pop-hint { font-size: 10px; color: #99aabb; margin-top: 6px; }
      `}</style>

      <div className="pn-root">

        {/* ── Popover de ajuste de precio ── */}
        {precioPopover && (() => {
          const rect = precioPopover.rect;
          const top  = Math.min(rect.bottom + 6, window.innerHeight - 180);
          const left = Math.min(rect.left, window.innerWidth - 260);
          return (
            <>
              <div className="pn-popover-backdrop" onClick={cerrarPopover} />
              <div className="pn-popover" style={{ top, left }}
                onClick={e => e.stopPropagation()}
              >
                <div className="pn-popover-title">Ajustar precio</div>
                <div className="pn-pop-toggle">
                  <button className={popoverModo === "valor" ? "active" : ""} onClick={() => { setPopoverModo("valor"); setPopoverInput(String(precioPopover.precioActual ?? "")); }}>$ Valor</button>
                  <button className={popoverModo === "porcentaje" ? "active" : ""} onClick={() => { setPopoverModo("porcentaje"); setPopoverInput(""); }}>% Porcentaje</button>
                </div>
                <div className="pn-pop-input-row">
                  <span style={{ color: "#6699bb", fontSize: 13 }}>{popoverModo === "valor" ? "$" : "%"}</span>
                  <input
                    autoFocus
                    type="number"
                    className="pn-pop-input"
                    value={popoverInput}
                    onChange={e => setPopoverInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") confirmarPopover(); if (e.key === "Escape") cerrarPopover(); }}
                    placeholder={popoverModo === "valor" ? "Nuevo precio" : "ej: 10 ó -5"}
                  />
                  <button className="pn-pop-confirm" onClick={confirmarPopover}>✓</button>
                  <button className="pn-pop-cancel"  onClick={cerrarPopover}>✕</button>
                </div>
                <div className="pn-pop-hint">
                  {popoverModo === "valor"
                    ? `Precio actual: $${Number(precioPopover.precioActual).toLocaleString("es-AR", { minimumFractionDigits: 2 })}${precioPopover.porcentajeActual != null ? ` (${precioPopover.porcentajeActual > 0 ? "+" : ""}${precioPopover.porcentajeActual}% aplicado)` : ""}`
                    : precioPopover.porcentajeActual != null
                      ? `% actual: ${precioPopover.porcentajeActual > 0 ? "+" : ""}${precioPopover.porcentajeActual}% · Positivo = aumento · Negativo = descuento`
                      : "Positivo = aumento · Negativo = descuento"}
                </div>
              </div>
            </>
          );
        })()}

        {/* Barra de título */}
        <div className="pn-topbar">
          <span className="pn-topbar-title">Sistema de presupuestos</span>
          <span className="pn-menu-item">Precios</span>
          <span
            className="pn-menu-item"
            style={{ cursor: "pointer" }}
            onClick={() => onVerTabla && onVerTabla()}
          >Presupuestos</span>
          <span className="pn-menu-item">Sistema</span>
        </div>

        {/* Toolbar */}
        <div className="pn-toolbar">
          <button className="pn-tool-btn" onClick={onVolver}
            style={{ background: "#0a3a5c", color: "#60efff", borderColor: "#0a3a5c", fontWeight: 700 }}
            title="Volver al inicio">
            🏠 Inicio
          </button>
          <button className="pn-tool-btn" onClick={handleActualizar}
            title="Actualiza el presupuesto con los parámetros actuales del encabezado"
            style={{ background: "#e8f5e9", borderColor: "#4caf50", color: "#1b5e20", fontWeight: 700 }}>
            🔄 Actualizar
          </button>
          <button className="pn-tool-btn save" onClick={() => handleGuardar(false)} disabled={guardando}>
            💾 {guardando ? "Guardando..." : "Guardar"}
          </button>
          {numeroPres !== null && (
            <button className="pn-tool-btn" onClick={() => handleGuardar(true)} disabled={guardando}
              style={{ background: "#fff3cd", borderColor: "#ffc107", color: "#856404", fontWeight: 700 }}>
              🔖 Nueva Revisión
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="pn-tabs">
          <button className={`pn-tab${tab === "encabezado" ? " active" : ""}`} onClick={() => setTab("encabezado")}>
            Encabezado
          </button>
          <button className={`pn-tab${tab === "cocina" ? " active" : ""}`} onClick={() => setTab("cocina")}>
            Cocina
          </button>
          <button className={`pn-tab${tab === "placard" ? " active" : ""}`} onClick={() => setTab("placard")}>
            Placard
          </button>
          <button className={`pn-tab${tab === "mampara" ? " active" : ""}`} onClick={() => setTab("mampara")}>
            Mampara
          </button>
          <button className={`pn-tab${tab === "especiales" ? " active" : ""}`} onClick={() => setTab("especiales")}>
            Especiales
          </button>
          <button className={`pn-tab${tab === "presupuesto" ? " active" : ""}`} onClick={() => setTab("presupuesto")}>
            Presupuesto
          </button>
        </div>

        {/* Cuerpo */}
        <div className="pn-body">

          {error    && <div className="pn-error">⚠️ {error}</div>}
          {guardadoOk && <div className="pn-ok">✅ Presupuesto guardado correctamente</div>}

          {tab === "encabezado" && (
            <>
              {/* Número y revisión */}
              <div className="pn-header-row">
                <span className="pn-numero-label">
                  Presupuesto número:&nbsp;
                  <span className="pn-numero-val">[{numero}]</span>
                </span>
                <div className="pn-rev-group">
                  <span>Revisión:</span>
                  <input
                    className="pn-rev-input"
                    type="number" min="1"
                    value={revision}
                    onChange={e => setRevision(Number(e.target.value))}
                  />
                </div>
                <div className="pn-fecha-group">
                  <span className="pn-fecha-label">Fecha:</span>
                  <span className="pn-fecha-text">{formatFechaLarga(fecha)}</span>
                  <input
                    type="date"
                    className="pn-field-select"
                    value={fecha}
                    onChange={e => setFecha(e.target.value)}
                    style={{ marginLeft: 4 }}
                  />
                </div>
              </div>

              {/* Cliente + Teléfono */}
              <div className="pn-field-row" style={{ alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                <span className="pn-field-label" style={{ paddingTop: 7 }}>Cliente:</span>

                {/* Campo cliente — busca por nombre en BD, o ingresa nuevo */}
                <div style={{ position: "relative", flex: "2 1 200px", minWidth: 160 }}>
                  <input
                    className="pn-field-input"
                    value={cliente}
                    onChange={e => {
                      const val = e.target.value;
                      setCliente(val);
                      clearTimeout(window._clienteTimer);
                      if (val.length > 1) {
                        window._clienteTimer = setTimeout(() => {
                          fetch(`${API}/clientes/buscar-nombre?q=${encodeURIComponent(val)}`)
                            .then(r => r.json())
                            .then(data => setClientesSugeridos(Array.isArray(data) ? data : []))
                            .catch(() => {});
                        }, 250);
                      } else {
                        setClientesSugeridos([]);
                      }
                    }}
                    onBlur={() => setClientesSugeridos([])}
                    placeholder="Nombre o nuevo cliente..."
                    autoComplete="off"
                    style={{ width: "100%" }}
                  />
                  {clientesSugeridos.length > 0 && (
                    <div
                      onMouseDown={e => e.preventDefault()}
                      style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #b8cfe0", zIndex: 50, boxShadow: "0 4px 12px #0002", maxHeight: 220, overflowY: "auto", borderRadius: "0 0 3px 3px" }}>
                      {clientesSugeridos.map((c, i) => {
                        const nombre = c.nombre ?? c.NOMBRE ?? "";
                        const loc    = c.localidad ?? c.LOCALIDAD ?? "";
                        const tel1   = c.telefono1 ?? c.TELEFONO1 ?? "";
                        const tel2   = c.telefono2 ?? c.TELEFONO2 ?? "";
                        const wp     = c.wapp ?? c.WAPP ?? "";
                        return (
                          <div key={i}
                            onMouseDown={() => {
                              setCliente(nombre);
                              setTelefono1(tel1);
                              setTelefono2(tel2);
                              setWapp(wp);
                              setTelefonoSearch(tel1 || tel2 || wp);
                              setClientesSugeridos([]);
                            }}
                            style={{ padding: "8px 14px", cursor: "pointer", fontSize: 12, borderBottom: "1px solid #eef2f6", fontFamily: "'Space Mono',monospace" }}
                            onMouseOver={e => e.currentTarget.style.background = "#ddeefa"}
                            onMouseOut={e => e.currentTarget.style.background = "#fff"}
                          >
                            <div style={{ fontWeight: 700, color: "#0a3a5c" }}>{nombre}</div>
                            <div style={{ fontSize: 11, color: "#6699bb", marginTop: 2, display: "flex", gap: 10 }}>
                              {tel1 && <span>📞 {tel1}</span>}
                              {tel2 && <span>📞 {tel2}</span>}
                              {wp   && <span>💬 {wp}</span>}
                              {loc  && <span>📍 {loc}</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Campo teléfono — busca en telefono1, telefono2, wapp */}
                <div style={{ position: "relative", flex: "1 1 150px", minWidth: 140 }}>
                  <input
                    className="pn-field-input"
                    value={telefonoSearch}
                    onChange={e => {
                      const val = e.target.value;
                      setTelefonoSearch(val);
                      clearTimeout(window._telTimer);
                      if (val.length > 1) {
                        window._telTimer = setTimeout(() => {
                          fetch(`${API}/clientes/buscar-telefono?q=${encodeURIComponent(val)}`)
                            .then(r => r.json())
                            .then(data => setTelefonosSugeridos(Array.isArray(data) ? data : []))
                            .catch(() => {});
                        }, 250);
                      } else {
                        setTelefonosSugeridos([]);
                      }
                    }}
                    onBlur={() => setTelefonosSugeridos([])}
                    placeholder="📞 Teléfono..."
                    autoComplete="off"
                    style={{ width: "100%" }}
                  />
                  {telefonosSugeridos.length > 0 && (
                    <div
                      onMouseDown={e => e.preventDefault()}
                      style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #b8cfe0", zIndex: 50, boxShadow: "0 4px 12px #0002", maxHeight: 220, overflowY: "auto", borderRadius: "0 0 3px 3px" }}>
                      {telefonosSugeridos.map((c, i) => {
                        const nombre = c.nombre ?? c.NOMBRE ?? "";
                        const tel1   = c.telefono1 ?? c.TELEFONO1 ?? "";
                        const tel2   = c.telefono2 ?? c.TELEFONO2 ?? "";
                        const wp     = c.wapp ?? c.WAPP ?? "";
                        return (
                          <div key={i}
                            onMouseDown={() => {
                              setCliente(nombre);
                              setTelefono1(tel1);
                              setTelefono2(tel2);
                              setWapp(wp);
                              setTelefonoSearch(tel1 || tel2 || wp);
                              setTelefonosSugeridos([]);
                            }}
                            style={{ padding: "8px 14px", cursor: "pointer", fontSize: 12, borderBottom: "1px solid #eef2f6", fontFamily: "'Space Mono',monospace" }}
                            onMouseOver={e => e.currentTarget.style.background = "#ddeefa"}
                            onMouseOut={e => e.currentTarget.style.background = "#fff"}
                          >
                            <div style={{ fontWeight: 700, color: "#0a3a5c" }}>{nombre}</div>
                            <div style={{ fontSize: 11, color: "#6699bb", marginTop: 2, display: "flex", gap: 10 }}>
                              {tel1 && <span>📞 {tel1}</span>}
                              {tel2 && <span>📞 {tel2}</span>}
                              {wp   && <span>💬 {wp}</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Chips de teléfonos del cliente seleccionado */}
                {(telefono1 || telefono2 || wapp) && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                    {telefono1 && <span style={{ fontSize: 11, color: "#0a3a5c", background: "#e8f0f7", border: "1px solid #c8dae8", borderRadius: 3, padding: "4px 10px", fontFamily: "'Space Mono',monospace" }}>📞 {telefono1}</span>}
                    {telefono2 && <span style={{ fontSize: 11, color: "#0a3a5c", background: "#e8f0f7", border: "1px solid #c8dae8", borderRadius: 3, padding: "4px 10px", fontFamily: "'Space Mono',monospace" }}>📞 {telefono2}</span>}
                    {wapp      && <span style={{ fontSize: 11, color: "#1a7a3a", background: "#e6f5eb", border: "1px solid #a8d8b0", borderRadius: 3, padding: "4px 10px", fontFamily: "'Space Mono',monospace" }}>💬 {wapp}</span>}
                  </div>
                )}
              </div>

              {/* Localidad */}
              <div className="pn-field-row">
                <span className="pn-field-label">Localidad:</span>
                <select
                  className="pn-field-select"
                  value={localidad}
                  onChange={e => setLocalidad(e.target.value)}
                  style={{ minWidth: 200 }}
                >
                  {LOCALIDADES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              {/* Líneas */}
              <div className="pn-section-label">Líneas a presupuestar:</div>
              <div className="pn-lineas-grid">
                {lineas.map((l, idx) => (
                  <div key={idx} className="pn-linea-row">
                    <select
                      className="pn-field-select"
                      value={l.linea}
                      onChange={e => setLinea(idx, "linea", e.target.value)}
                      style={{ width: "100%" }}
                    >
                      <option value="[Sin líneas]">[Sin líneas]</option>
                      {lineasBD.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                    <input
                      className="pn-field-input"
                      style={{ maxWidth: "100%" }}
                      value={l.col2}
                      onChange={e => setLinea(idx, "col2", e.target.value)}
                      placeholder=""
                      disabled={l.linea === "[Sin líneas]"}
                    />
                    <input
                      className="pn-field-input"
                      style={{ maxWidth: "100%" }}
                      value={l.col3}
                      onChange={e => setLinea(idx, "col3", e.target.value)}
                      placeholder=""
                      disabled={l.linea === "[Sin líneas]"}
                    />
                  </div>
                ))}
              </div>

              {/* Precios */}
              <div className="pn-section-label" style={{ marginTop: 20 }}>Precios</div>
              <div className="pn-precios-wrap">
                <div className="pn-lista-group">
                  <span style={{ fontSize: 12, color: "#0a3a5c" }}>Lista de precios:</span>
                  <select
                    className="pn-field-select"
                    value={listaPrecio}
                    onChange={e => setListaPrecio(e.target.value)}
                  >
                    {listasDB.length === 0 ? (
                      <option value="">Cargando...</option>
                    ) : (
                      listasDB.map(l => (
                        <option key={l.id} value={l.lista}>{l.lista}</option>
                      ))
                    )}
                  </select>
                  {listaPorcentaje !== 0 && (
                    <span style={{
                      fontSize: 11, fontFamily: "'Space Mono',monospace", fontWeight: 700,
                      color: "#fff", background: "#2277bb", borderRadius: 4,
                      padding: "3px 10px", letterSpacing: "0.04em"
                    }}>
                      +{listaPorcentaje}% sobre precio base
                    </span>
                  )}
                </div>

                <div className="pn-check-group">
                  <label className="pn-check-row">
                    <input type="checkbox" checked={mostrarCosto}   onChange={e => setMostrarCosto(e.target.checked)} /> Mostrar costo
                  </label>
                  <label className="pn-check-row">
                    <input type="checkbox" checked={incluirPrecio}  onChange={e => setIncluirPrecio(e.target.checked)} /> Incluir precio
                  </label>
                  <label className="pn-check-row">
                    <input type="checkbox" checked={incluirTotal}   onChange={e => setIncluirTotal(e.target.checked)} /> Incluir total
                  </label>
                </div>

                <div className="pn-color-group">
                  <span className="pn-color-label">Color:</span>
                  <input
                    className="pn-color-input"
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    placeholder=""
                  />
                </div>

                <div className="pn-right-checks">
                  <label className="pn-check-row">
                    <input type="checkbox" checked={incluirTextoColoc} onChange={e => setIncluirTextoColoc(e.target.checked)} /> Incluir texto de colocación
                  </label>
                  <label className="pn-check-row">
                    <input type="checkbox" checked={agregarIVA}        onChange={e => setAgregarIVA(e.target.checked)} /> Agregar IVA al precio de cada módulo
                  </label>
                </div>
              </div>

              {/* Leyenda */}
              <div className="pn-section-label">Leyenda:</div>
              <textarea
                className="pn-textarea"
                rows={2}
                value={leyenda}
                onChange={e => setLeyenda(e.target.value)}
              />

              {/* Observaciones */}
              <div className="pn-section-label" style={{ marginTop: 14 }}>Observaciones:</div>
              <textarea
                className="pn-textarea"
                rows={10}
                value={observaciones}
                onChange={e => setObservaciones(e.target.value)}
              />
            </>
          )}

          {tab === "cocina" && !cocinaFamilia && (
            /* ── Selector de familia ── */
            <div>
              <div style={{ fontSize: 11, color: "#6699bb", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>
                Seleccionar familia
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                {[
                  { key: "bajomesadas", icon: "🪵", label: "Bajomesada", count: cocinaItems.bajomesadas.length },
                  { key: "alacenas",    icon: "🗄️", label: "Alacena",    count: cocinaItems.alacenas.length },
                ].map(({ key, icon, label, count }) => (
                  <button
                    key={key}
                    onClick={() => { setCocinaFamilia(key); setCocinaEditIdx(null); setCocinaFila({ articulo: "", nombreart: "", cantidad: 1, precio: "", precios: [], margen: null, valor1: null, porcentaje1: null, valor2: null, porcentaje2: null, valor3: null, porcentaje3: null }); setCocinaSearch(""); }}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                      padding: "28px 40px",
                      background: "#fff",
                      border: "1px solid #b8cfe0",
                      borderRadius: 4,
                      fontFamily: "'Space Mono', monospace",
                      cursor: "pointer",
                      minWidth: 160,
                      transition: "all 0.12s",
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = "#ddeefa"; e.currentTarget.style.borderColor = "#4a90c8"; }}
                    onMouseOut={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#b8cfe0"; }}
                  >
                    <span style={{ fontSize: 36 }}>{icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#0a3a5c" }}>{label}</span>
                    {count > 0 && (
                      <span style={{ fontSize: 11, color: "#4a90c8", background: "#e0f0fc", borderRadius: 10, padding: "2px 10px" }}>
                        {count} artículo{count !== 1 ? "s" : ""}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              {/* Resumen rápido si hay items */}
              {(cocinaItems.bajomesadas.length > 0 || cocinaItems.alacenas.length > 0) && (
                <div style={{ marginTop: 24, fontSize: 12, color: "#0a3a5c", borderTop: "1px solid #dde6ef", paddingTop: 16, display: "flex", gap: 32 }}>
                  <span>Bajomesada: <strong>${cocina_total("bajomesadas").toLocaleString("es-AR", { minimumFractionDigits: 2 })}</strong></span>
                  <span>Alacena: <strong>${cocina_total("alacenas").toLocaleString("es-AR", { minimumFractionDigits: 2 })}</strong></span>
                  <span style={{ color: "#0a5c3a" }}>Total cocina: <strong>${(cocina_total("bajomesadas") + cocina_total("alacenas")).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</strong></span>
                </div>
              )}
            </div>
          )}

          {tab === "cocina" && cocinaFamilia && (
            /* ── Detalle de familia ── */
            <div>
              {/* Encabezado familia */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <button
                  onClick={() => { setCocinaFamilia(null); setCocinaEditIdx(null); setCocinaFila({ articulo: "", nombreart: "", cantidad: 1, precio: "", precios: [], margen: null, valor1: null, porcentaje1: null, valor2: null, porcentaje2: null, valor3: null, porcentaje3: null }); setCocinaSearch(""); }}
                  style={{ padding: "4px 14px", background: "#fff", border: "1px solid #b8cfe0", borderRadius: 2, fontFamily: "'Space Mono',monospace", fontSize: 12, cursor: "pointer", color: "#0a3a5c" }}
                >← Familias</button>
                <span style={{ fontFamily: "'Space Mono',monospace", fontWeight: 700, fontSize: 14, color: "#0a3a5c", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {cocinaFamilia === "bajomesadas" ? "🪵 Bajomesada" : "🗄️ Alacena"}
                </span>
                <button
                  onClick={() => setTab("presupuesto")}
                  style={{ marginLeft: "auto", padding: "5px 16px", background: "#0a5c3a", color: "#fff", border: "none", borderRadius: 2, fontFamily: "'Space Mono',monospace", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                  title="Ver presupuesto completo"
                >
                  📋 Ver Presupuesto
                </button>
              </div>

              {/* Tabla de artículos cargados */}
              {cocinaItems[cocinaFamilia].length > 0 && (
                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20, fontFamily: "'Space Mono',monospace", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "#e8f0f7", color: "#0a3a5c" }}>
                      <th style={{ padding: "8px 12px", textAlign: "left", border: "1px solid #c8dae8", fontWeight: 700 }}>Producto</th>
                      <th style={{ padding: "8px 12px", textAlign: "left", border: "1px solid #c8dae8", fontWeight: 700 }}>Artículo</th>
                      <th style={{ padding: "8px 12px", textAlign: "center", border: "1px solid #c8dae8", fontWeight: 700, width: 80 }}>Cant.</th>
                      {lineasActivas.length > 0
                        ? lineasActivas.map(l => <th key={l.linea} style={{ padding: "8px 12px", textAlign: "right", border: "1px solid #c8dae8", fontWeight: 700, width: 120 }}>Línea {l.linea}</th>)
                        : <th style={{ padding: "8px 12px", textAlign: "right", border: "1px solid #c8dae8", fontWeight: 700, width: 130 }}>Precio unit.</th>
                      }
                      <th style={{ padding: "8px 12px", textAlign: "right", border: "1px solid #c8dae8", fontWeight: 700, width: 130 }}>Subtotal</th>
                      <th style={{ padding: "8px 6px", border: "1px solid #c8dae8", width: 70 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cocinaItems[cocinaFamilia].map((fila, idx) => (
                      cocinaEditIdx === idx ? (
                        /* fila en edición inline */
                        <tr key={idx} style={{ background: "#fffbe6" }}>
                          <td style={{ padding: "6px 8px", border: "1px solid #c8dae8" }}>
                            <input
                              value={cocinaFila.nombreart ?? ""}
                              onChange={e => setCocinaFila(f => ({ ...f, nombreart: e.target.value }))}
                              style={{ width: "100%", fontFamily: "'Space Mono',monospace", fontSize: 12, border: "1px solid #7aaac8", padding: "4px 8px", borderRadius: 2 }}
                            />
                          </td>
                          <td style={{ padding: "6px 8px", border: "1px solid #c8dae8", position: "relative" }}>
                            <input
                              value={cocinaSearch}
                              onChange={e => {
                                setCocinaSearch(e.target.value);
                                setCocinaFila(f => ({ ...f, articulo: e.target.value, precio: "" }));
                              }}
                              onFocus={() => setCocinaSearchFocus(true)}
                              onBlur={() => setTimeout(() => setCocinaSearchFocus(false), 150)}
                              style={{ width: "100%", fontFamily: "'Space Mono',monospace", fontSize: 12, border: "1px solid #7aaac8", padding: "4px 8px", borderRadius: 2 }}
                            />
                            {cocinaSearch.length >= 0 && productosFiltrados.length > 0 && cocinaSearchFocus && (
                              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #b8cfe0", zIndex: 50, boxShadow: "0 4px 12px #0002", minWidth: 480 }}>
                                {productosFiltrados.map((p, pi) => {
                                  const base = p.articulo;
                                  return (
                                    <div key={pi}
                                      onClick={() => {
                                        const preciosBase = lineasActivas.map(l => ({ linea: l.linea, precioBase: p.precios?.[String(l.linea)] ?? '' }));
                                        const precios = preciosBase.map(pb => ({ linea: pb.linea, precioBase: pb.precioBase, precio: aplicarPorcentaje(pb.precioBase) }));
                                        const precioBaseUsar = preciosBase[0]?.precioBase ?? '';
                                        const precioUsar = precios[0]?.precio ?? '';
                                        const nombreart = p.nombreart ?? p.NOMBREART ?? base;
                                        setCocinaFila(f => ({ ...f, articulo: base, nombreart, precio: String(precioUsar), precioBase: String(precioBaseUsar), precios, preciosBase }));
                                        setCocinaSearch(base);
                                      }}
                                      style={{ padding: "7px 12px", cursor: "pointer", fontSize: 12, borderBottom: "1px solid #eef2f6" }}
                                      onMouseOver={e => e.currentTarget.style.background = "#ddeefa"}
                                      onMouseOut={e => e.currentTarget.style.background = "#fff"}
                                    >
                                      <span style={{ color: "#0a3a5c", fontWeight: 600 }}>{base}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: "6px 8px", border: "1px solid #c8dae8" }}>
                            <input type="number" min="1" value={cocinaFila.cantidad}
                              onChange={e => setCocinaFila(f => ({ ...f, cantidad: e.target.value }))}
                              style={{ width: "100%", textAlign: "center", fontFamily: "'Space Mono',monospace", fontSize: 12, border: "1px solid #7aaac8", padding: "4px 4px", borderRadius: 2 }}
                            />
                          </td>
                          {lineasActivas.length > 0
                            ? lineasActivas.map((l, li) => (
                                <td key={l.linea} style={{ padding: "6px 8px", border: "1px solid #c8dae8" }}>
                                  <input type="number" min="0"
                                    value={cocinaFila.precios?.[li]?.precio ?? ""}
                                    onChange={e => setCocinaFila(f => {
                                      const precios = [...(f.precios?.length ? f.precios : lineasActivas.map(la => ({ linea: la.linea, precio: "" })))];
                                      precios[li] = { ...precios[li], precio: e.target.value };
                                      return { ...f, precio: precios[0]?.precio ?? "", precios };
                                    })}
                                    style={{ width: "100%", textAlign: "right", fontFamily: "'Space Mono',monospace", fontSize: 12, border: "1px solid #7aaac8", padding: "4px 8px", borderRadius: 2 }}
                                  />
                                </td>
                              ))
                            : <td style={{ padding: "6px 8px", border: "1px solid #c8dae8" }}>
                                <input type="number" min="0" value={cocinaFila.precio}
                                  onChange={e => setCocinaFila(f => ({ ...f, precio: e.target.value }))}
                                  style={{ width: "100%", textAlign: "right", fontFamily: "'Space Mono',monospace", fontSize: 12, border: "1px solid #7aaac8", padding: "4px 8px", borderRadius: 2 }}
                                />
                              </td>
                          }
                          <td style={{ padding: "6px 8px", border: "1px solid #c8dae8", textAlign: "right", color: "#0a5c3a", fontWeight: 700 }}>
                            ${((parseFloat(cocinaFila.precio)||0)*(parseFloat(cocinaFila.cantidad)||0)).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: "6px 4px", border: "1px solid #c8dae8", textAlign: "center" }}>
                            <button onClick={() => cocinaGuardarEdit(idx)} title="Guardar" style={{ background: "#0a5c3a", color: "#fff", border: "none", borderRadius: 2, padding: "3px 8px", cursor: "pointer", fontSize: 13, marginRight: 2 }}>✓</button>
                            <button onClick={() => { setCocinaEditIdx(null); setCocinaFila({ articulo: "", nombreart: "", cantidad: 1, precio: "", precios: [], margen: null, valor1: null, porcentaje1: null, valor2: null, porcentaje2: null, valor3: null, porcentaje3: null }); setCocinaSearch(""); }} title="Cancelar" style={{ background: "#c0392b", color: "#fff", border: "none", borderRadius: 2, padding: "3px 8px", cursor: "pointer", fontSize: 13 }}>✕</button>
                          </td>
                        </tr>
                      ) : (
                        <tr key={idx} style={{ background: idx % 2 === 0 ? "#fff" : "#f5f9fc" }}>
                          <td style={{ padding: "8px 12px", border: "1px solid #c8dae8", color: "#334155", fontSize: 11 }}>{fila.nombreart}</td>
                          <td style={{ padding: "8px 12px", border: "1px solid #c8dae8" }}>{fila.articulo}</td>
                          <td style={{ padding: "8px 12px", border: "1px solid #c8dae8", textAlign: "center" }}>{fila.cantidad}</td>
                          {lineasActivas.length > 0
                            ? lineasActivas.map((l, li) => {
                                const pr = fila.precios?.[li]?.precio ?? fila.precio ?? 0;
                                const pctSlot = ["porcentaje1","porcentaje2","porcentaje3"][li];
                                const pctAplicado = fila[pctSlot] ?? null;
                                return (
                                  <td key={l.linea} style={{ padding: "8px 12px", border: "1px solid #c8dae8", textAlign: "right" }}>
                                    <span className="pn-precio-cell" onClick={e => abrirPrecioPopover("cocina", cocinaFamilia, idx, li, parseFloat(pr) || 0, e)}>
                                      ${Number(pr).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                                    </span>
                                    {pctAplicado != null && (
                                      <span style={{ marginLeft: 5, fontSize: 9, color: pctAplicado >= 0 ? "#0a7a3a" : "#c0392b", fontWeight: 700, verticalAlign: "middle", background: pctAplicado >= 0 ? "#e6f5eb" : "#fdecea", borderRadius: 3, padding: "1px 4px" }}>
                                        {pctAplicado > 0 ? "+" : ""}{pctAplicado}%
                                      </span>
                                    )}
                                    {listaPorcentaje !== 0 && pctAplicado == null && (
                                      <span style={{ marginLeft: 5, fontSize: 9, color: "#2277bb", fontWeight: 700, verticalAlign: "middle" }}>+{listaPorcentaje}%</span>
                                    )}
                                  </td>
                                );
                              })
                            : (
                              <td style={{ padding: "8px 12px", border: "1px solid #c8dae8", textAlign: "right" }}>
                                <span className="pn-precio-cell" onClick={e => abrirPrecioPopover("cocina", cocinaFamilia, idx, "precio", parseFloat(fila.precio) || 0, e)}>
                                  ${Number(fila.precio).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                                </span>
                                {fila.porcentaje1 != null && (
                                  <span style={{ marginLeft: 5, fontSize: 9, color: fila.porcentaje1 >= 0 ? "#0a7a3a" : "#c0392b", fontWeight: 700, verticalAlign: "middle", background: fila.porcentaje1 >= 0 ? "#e6f5eb" : "#fdecea", borderRadius: 3, padding: "1px 4px" }}>
                                    {fila.porcentaje1 > 0 ? "+" : ""}{fila.porcentaje1}%
                                  </span>
                                )}
                                {listaPorcentaje !== 0 && fila.porcentaje1 == null && (
                                  <span style={{ marginLeft: 5, fontSize: 9, color: "#2277bb", fontWeight: 700, verticalAlign: "middle" }}>+{listaPorcentaje}%</span>
                                )}
                              </td>
                            )
                          }
                          <td style={{ padding: "8px 12px", border: "1px solid #c8dae8", textAlign: "right", fontWeight: 700 }}>${((parseFloat(fila.precio)||0)*(parseFloat(fila.cantidad)||0)).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</td>
                          <td style={{ padding: "8px 4px", border: "1px solid #c8dae8", textAlign: "center" }}>
                            <button onClick={() => cocinaIniciarEdit(idx)} title="Editar" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 15, marginRight: 4 }}>✏️</button>
                            <button onClick={() => cocinaEliminarFila(idx)} title="Eliminar" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 15 }}>🗑</button>
                          </td>
                        </tr>
                      )
                    ))}
                    {/* Fila de total */}
                    <tr style={{ background: "#e8f4ee" }}>
                      <td colSpan={3} style={{ padding: "8px 12px", border: "1px solid #c8dae8", textAlign: "right", fontWeight: 700, color: "#0a3a5c" }}>Total {cocinaFamilia === "bajomesadas" ? "Bajomesada" : "Alacena"}</td>
                      {lineasActivas.length > 0
                        ? lineasActivas.map((l, li) => {
                            const subtotal = cocinaItems[cocinaFamilia].reduce((s, f) => {
                              const pr = parseFloat(f.precios?.[li]?.precio ?? f.precio ?? 0) || 0;
                              return s + pr * (parseFloat(f.cantidad) || 1);
                            }, 0);
                            return <td key={l.linea} style={{ padding: "8px 12px", border: "1px solid #c8dae8", textAlign: "right", fontWeight: 700, color: "#0a5c3a" }}>${subtotal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</td>;
                          })
                        : <td style={{ padding: "8px 12px", border: "1px solid #c8dae8", textAlign: "right", fontWeight: 700, color: "#0a5c3a" }}>${cocina_total(cocinaFamilia).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</td>
                      }
                      <td style={{ padding: "8px 12px", border: "1px solid #c8dae8", textAlign: "right", fontWeight: 700, color: "#0a5c3a" }}>${cocina_total(cocinaFamilia).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</td>
                      <td style={{ border: "1px solid #c8dae8" }}></td>
                    </tr>
                  </tbody>
                </table>
              )}

              {/* Formulario nueva fila */}
              {cocinaEditIdx === null && (
                <div style={{ background: "#f5f9fc", border: "1px solid #c8dae8", borderRadius: 3, padding: "16px 20px" }}>
                  <div style={{ fontSize: 11, color: "#6699bb", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Agregar artículo</div>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
                    {/* Artículo con autocomplete */}
                    <div style={{ position: "relative", flex: "2 1 220px" }}>
                      <label style={{ display: "block", fontSize: 11, color: "#6699bb", marginBottom: 4 }}>Artículo</label>
                      <input
                        value={cocinaSearch}
                        onChange={e => {
                          setCocinaSearch(e.target.value);
                          setCocinaFila(f => ({ ...f, articulo: e.target.value, precio: "" }));
                        }}
                        onFocus={() => setCocinaSearchFocus(true)}
                        onBlur={() => setTimeout(() => setCocinaSearchFocus(false), 150)}
                        placeholder="Buscar en BD..."
                        style={{ width: "100%", fontFamily: "'Space Mono',monospace", fontSize: 12, border: "1px solid #b8cfe0", padding: "6px 10px", borderRadius: 2 }}
                      />
                      {cocinaSearchFocus && productosFiltrados.length > 0 && (
                        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #b8cfe0", zIndex: 50, boxShadow: "0 4px 12px #0002", maxHeight: 200, overflowY: "auto" }}>
                          {productosFiltrados.map((p, pi) => {
                            const base = p.articulo;
                            return (
                              <div key={pi}
                                onClick={() => {
                                  const preciosBase = lineasActivas.map(l => ({ linea: l.linea, precioBase: p.precios?.[String(l.linea)] ?? '' }));
                                  const precios = preciosBase.map(pb => ({ linea: pb.linea, precioBase: pb.precioBase, precio: aplicarPorcentaje(pb.precioBase) }));
                                  const precioBaseUsar = preciosBase[0]?.precioBase ?? '';
                                        const precioUsar = precios[0]?.precio ?? '';
                                        const nombreart = p.nombreart ?? p.NOMBREART ?? base;
                                        setCocinaFila(f => ({ ...f, articulo: base, nombreart, precio: String(precioUsar), precioBase: String(precioBaseUsar), precios, preciosBase }));
                                  setCocinaSearch(base);
                                }}
                                style={{ padding: "8px 14px", cursor: "pointer", fontSize: 12, borderBottom: "1px solid #eef2f6" }}
                                onMouseOver={e => e.currentTarget.style.background = "#ddeefa"}
                                onMouseOut={e => e.currentTarget.style.background = "#fff"}
                              >
                                <span style={{ color: "#0a3a5c", fontWeight: 600 }}>{base}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    {/* Producto (nombreart) — editable, pre-rellena con articulo */}
                    <div style={{ flex: "2 1 200px" }}>
                      <label style={{ display: "block", fontSize: 11, color: "#6699bb", marginBottom: 4 }}>Producto</label>
                      <input
                        value={cocinaFila.nombreart ?? ""}
                        onChange={e => setCocinaFila(f => ({ ...f, nombreart: e.target.value }))}
                        placeholder="Nombre en presupuesto..."
                        style={{ width: "100%", fontFamily: "'Space Mono',monospace", fontSize: 12, border: "1px solid #b8cfe0", padding: "6px 10px", borderRadius: 2 }}
                      />
                    </div>
                    {/* Cantidad */}
                    <div style={{ flex: "0 0 80px" }}>
                      <label style={{ display: "block", fontSize: 11, color: "#6699bb", marginBottom: 4 }}>Cantidad</label>
                      <input type="number" min="1" value={cocinaFila.cantidad}
                        onChange={e => setCocinaFila(f => ({ ...f, cantidad: e.target.value }))}
                        style={{ width: "100%", textAlign: "center", fontFamily: "'Space Mono',monospace", fontSize: 12, border: "1px solid #b8cfe0", padding: "6px 6px", borderRadius: 2 }}
                      />
                    </div>
                    {/* Precios por línea */}
                    {lineasActivas.length > 0 ? lineasActivas.map((l, li) => (
                      <div key={li} style={{ flex: "1 1 120px" }}>
                        <label style={{ display: "block", fontSize: 11, color: "#6699bb", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Línea {l.linea}</label>
                        <input type="number" min="0"
                          value={cocinaFila.precios[li]?.precio ?? ""}
                          onChange={e => setCocinaFila(f => {
                            const precios = [...(f.precios.length ? f.precios : lineasActivas.map(la => ({ linea: la.linea, precio: "" })))];
                            precios[li] = { ...precios[li], precio: e.target.value };
                            return { ...f, precio: precios[0]?.precio ?? "", precios };
                          })}
                          placeholder="0.00"
                          style={{ width: "100%", textAlign: "right", fontFamily: "'Space Mono',monospace", fontSize: 12, border: "1px solid #b8cfe0", padding: "6px 10px", borderRadius: 2 }}
                        />
                      </div>
                    )) : (
                      <div style={{ flex: "1 1 130px" }}>
                        <label style={{ display: "block", fontSize: 11, color: "#6699bb", marginBottom: 4 }}>Precio unit.</label>
                        <input type="number" min="0" value={cocinaFila.precio}
                          onChange={e => setCocinaFila(f => ({ ...f, precio: e.target.value }))}
                          placeholder="0.00"
                          style={{ width: "100%", textAlign: "right", fontFamily: "'Space Mono',monospace", fontSize: 12, border: "1px solid #b8cfe0", padding: "6px 10px", borderRadius: 2 }}
                        />
                      </div>
                    )}
                    {/* Botón agregar */}
                    <div style={{ flex: "0 0 auto", paddingTop: 20 }}>
                      <button
                        onClick={cocinaAgregarFila}
                        disabled={!cocinaFila.articulo.trim()}
                        style={{ padding: "6px 20px", background: cocinaFila.articulo.trim() ? "#0a3a5c" : "#c8dae8", color: "#fff", border: "none", borderRadius: 2, fontFamily: "'Space Mono',monospace", fontSize: 12, cursor: cocinaFila.articulo.trim() ? "pointer" : "default", transition: "background 0.12s" }}
                      >
                        + Agregar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "placard" && !placardFamilia && (
            <div>
              <div style={{ fontSize: 11, color: "#6699bb", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>
                Seleccionar familia
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                {[
                  { key: "placard", icon: "🚪", label: "Placard", count: placardItems.placard?.length ?? 0 },
                ].map(({ key, icon, label, count }) => (
                  <button
                    key={key}
                    onClick={() => { setPlacardFamilia(key); setPlacardEditIdx(null); setPlacardFila({ articulo: "", cantidad: 1, precio: "", precios: [] }); setPlacardSearch(""); }}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                      padding: "28px 40px", background: "#fff", border: "1px solid #b8cfe0",
                      borderRadius: 4, fontFamily: "'Space Mono', monospace", cursor: "pointer",
                      minWidth: 160, transition: "all 0.12s",
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = "#ddeefa"; e.currentTarget.style.borderColor = "#4a90c8"; }}
                    onMouseOut={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#b8cfe0"; }}
                  >
                    <span style={{ fontSize: 36 }}>{icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#0a3a5c" }}>{label}</span>
                    {count > 0 && (
                      <span style={{ fontSize: 11, color: "#4a90c8", background: "#e0f0fc", borderRadius: 10, padding: "2px 10px" }}>
                        {count} artículo{count !== 1 ? "s" : ""}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              {(placardItems.placard?.length > 0) && (
                <div style={{ marginTop: 24, fontSize: 12, color: "#0a3a5c", borderTop: "1px solid #dde6ef", paddingTop: 16, display: "flex", gap: 32 }}>
                  <span style={{ color: "#0a5c3a" }}>Total placard: <strong>${placard_total("placard").toLocaleString("es-AR", { minimumFractionDigits: 2 })}</strong></span>
                </div>
              )}
            </div>
          )}

          {tab === "placard" && placardFamilia && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <button
                  onClick={() => { setPlacardFamilia(null); setPlacardEditIdx(null); setPlacardFila({ articulo: "", nombreart: "", cantidad: 1, precio: "", precios: [], margen: null, valor1: null, porcentaje1: null, valor2: null, porcentaje2: null, valor3: null, porcentaje3: null }); setPlacardSearch(""); }}
                  style={{ padding: "4px 14px", background: "#fff", border: "1px solid #b8cfe0", borderRadius: 2, fontFamily: "'Space Mono',monospace", fontSize: 12, cursor: "pointer", color: "#0a3a5c" }}
                >← Familias</button>
                <span style={{ fontFamily: "'Space Mono',monospace", fontWeight: 700, fontSize: 14, color: "#0a3a5c", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  🚪 Placard
                </span>
                <button
                  onClick={() => setTab("presupuesto")}
                  style={{ marginLeft: "auto", padding: "5px 16px", background: "#0a5c3a", color: "#fff", border: "none", borderRadius: 2, fontFamily: "'Space Mono',monospace", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                  title="Ver presupuesto completo"
                >
                  📋 Ver Presupuesto
                </button>
              </div>

              {placardItems[placardFamilia]?.length > 0 && (
                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20, fontFamily: "'Space Mono',monospace", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "#e8f0f7", color: "#0a3a5c" }}>
                      <th style={{ padding: "8px 12px", textAlign: "left", border: "1px solid #c8dae8", fontWeight: 700 }}>Producto</th>
                      <th style={{ padding: "8px 12px", textAlign: "left", border: "1px solid #c8dae8", fontWeight: 700 }}>Artículo</th>
                      <th style={{ padding: "8px 12px", textAlign: "center", border: "1px solid #c8dae8", fontWeight: 700, width: 80 }}>Cant.</th>
                      <th style={{ padding: "8px 12px", textAlign: "right", border: "1px solid #c8dae8", fontWeight: 700, width: 130 }}>Precio unit.</th>
                      <th style={{ padding: "8px 12px", textAlign: "right", border: "1px solid #c8dae8", fontWeight: 700, width: 130 }}>Subtotal</th>
                      <th style={{ padding: "8px 6px", border: "1px solid #c8dae8", width: 70 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {placardItems[placardFamilia].map((fila, idx) => (
                      placardEditIdx === idx ? (
                        <tr key={idx} style={{ background: "#fffbe6" }}>
                          <td style={{ padding: "6px 8px", border: "1px solid #c8dae8" }}>
                            <input
                              value={placardFila.nombreart ?? ""}
                              onChange={e => setPlacardFila(f => ({ ...f, nombreart: e.target.value }))}
                              style={{ width: "100%", fontFamily: "'Space Mono',monospace", fontSize: 12, border: "1px solid #7aaac8", padding: "4px 8px", borderRadius: 2 }}
                            />
                          </td>
                          <td style={{ padding: "6px 8px", border: "1px solid #c8dae8", position: "relative" }}>
                            <input
                              value={placardSearch}
                              onChange={e => { setPlacardSearch(e.target.value); setPlacardFila(f => ({ ...f, articulo: e.target.value, precio: "" })); }}
                              onFocus={() => setPlacardSearchFocus(true)}
                              onBlur={() => setTimeout(() => setPlacardSearchFocus(false), 150)}
                              style={{ width: "100%", fontFamily: "'Space Mono',monospace", fontSize: 12, border: "1px solid #7aaac8", padding: "4px 8px", borderRadius: 2 }}
                            />
                            {placardSearchFocus && productosFiltrados.length > 0 && (
                              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #b8cfe0", zIndex: 50, boxShadow: "0 4px 12px #0002", minWidth: 480 }}>
                                {productosFiltrados.map((p, pi) => {
                                  const base = p.articulo;
                                  return (
                                    <div key={pi}
                                      onClick={() => {
                                        const preciosBase = lineasActivas.map(l => ({ linea: l.linea, precioBase: p.precios?.[String(l.linea)] ?? '' }));
                                        const precios = preciosBase.map(pb => ({ linea: pb.linea, precioBase: pb.precioBase, precio: aplicarPorcentaje(pb.precioBase) }));
                                        const precioBaseUsar = preciosBase[0]?.precioBase ?? '';
                                        const precioUsar = precios[0]?.precio ?? '';
                                        const nombreart = p.nombreart ?? p.NOMBREART ?? base;
                                        setPlacardFila(f => ({ ...f, articulo: base, nombreart, precio: String(precioUsar), precioBase: String(precioBaseUsar), precios, preciosBase }));
                                        setPlacardSearch(base);
                                      }}
                                      style={{ padding: "7px 12px", cursor: "pointer", fontSize: 12, borderBottom: "1px solid #eef2f6" }}
                                      onMouseOver={e => e.currentTarget.style.background = "#ddeefa"}
                                      onMouseOut={e => e.currentTarget.style.background = "#fff"}
                                    >
                                      <span style={{ color: "#0a3a5c", fontWeight: 600 }}>{base}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: "6px 8px", border: "1px solid #c8dae8" }}>
                            <input type="number" min="1" value={placardFila.cantidad} onChange={e => setPlacardFila(f => ({ ...f, cantidad: e.target.value }))}
                              style={{ width: "100%", textAlign: "center", fontFamily: "'Space Mono',monospace", fontSize: 12, border: "1px solid #7aaac8", padding: "4px 4px", borderRadius: 2 }} />
                          </td>
                          <td style={{ padding: "6px 8px", border: "1px solid #c8dae8" }}>
                            <input type="number" min="0" value={placardFila.precio} onChange={e => setPlacardFila(f => ({ ...f, precio: e.target.value }))}
                              style={{ width: "100%", textAlign: "right", fontFamily: "'Space Mono',monospace", fontSize: 12, border: "1px solid #7aaac8", padding: "4px 8px", borderRadius: 2 }} />
                          </td>
                          <td style={{ padding: "6px 8px", border: "1px solid #c8dae8", textAlign: "right", color: "#0a5c3a", fontWeight: 700 }}>
                            ${((parseFloat(placardFila.precio)||0)*(parseFloat(placardFila.cantidad)||0)).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: "6px 4px", border: "1px solid #c8dae8", textAlign: "center" }}>
                            <button onClick={() => placardGuardarEdit(idx)} style={{ background: "#0a5c3a", color: "#fff", border: "none", borderRadius: 2, padding: "3px 8px", cursor: "pointer", fontSize: 13, marginRight: 2 }}>✓</button>
                            <button onClick={() => { setPlacardEditIdx(null); setPlacardFila({ articulo: "", nombreart: "", cantidad: 1, precio: "", precios: [], margen: null, valor1: null, porcentaje1: null, valor2: null, porcentaje2: null, valor3: null, porcentaje3: null }); setPlacardSearch(""); }} style={{ background: "#c0392b", color: "#fff", border: "none", borderRadius: 2, padding: "3px 8px", cursor: "pointer", fontSize: 13 }}>✕</button>
                          </td>
                        </tr>
                      ) : (
                        <tr key={idx} style={{ background: idx % 2 === 0 ? "#fff" : "#f5f9fc" }}>
                          <td style={{ padding: "8px 12px", border: "1px solid #c8dae8", color: "#334155", fontSize: 11 }}>{fila.nombreart}</td>
                          <td style={{ padding: "8px 12px", border: "1px solid #c8dae8" }}>{fila.articulo}</td>
                          <td style={{ padding: "8px 12px", border: "1px solid #c8dae8", textAlign: "center" }}>{fila.cantidad}</td>
                          <td style={{ padding: "8px 12px", border: "1px solid #c8dae8", textAlign: "right" }}>
                            <span className="pn-precio-cell" onClick={e => abrirPrecioPopover("placard", placardFamilia, idx, "precio", parseFloat(fila.precio) || 0, e)}>
                              ${Number(fila.precio).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                            </span>
                            {listaPorcentaje !== 0 && (
                              <span style={{ marginLeft: 5, fontSize: 9, color: "#2277bb", fontWeight: 700, verticalAlign: "middle" }}>+{listaPorcentaje}%</span>
                            )}
                          </td>
                          <td style={{ padding: "8px 12px", border: "1px solid #c8dae8", textAlign: "right", fontWeight: 700 }}>${((parseFloat(fila.precio)||0)*(parseFloat(fila.cantidad)||0)).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</td>
                          <td style={{ padding: "8px 4px", border: "1px solid #c8dae8", textAlign: "center" }}>
                            <button onClick={() => placardIniciarEdit(idx)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 15, marginRight: 4 }}>✏️</button>
                            <button onClick={() => placardEliminarFila(idx)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 15 }}>🗑</button>
                          </td>
                        </tr>
                      )
                    ))}
                    <tr style={{ background: "#e8f4ee" }}>
                      <td colSpan={4} style={{ padding: "8px 12px", border: "1px solid #c8dae8", textAlign: "right", fontWeight: 700, color: "#0a3a5c" }}>Total Placard</td>
                      <td style={{ padding: "8px 12px", border: "1px solid #c8dae8", textAlign: "right", fontWeight: 700, color: "#0a5c3a" }}>${placard_total(placardFamilia).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</td>
                      <td style={{ border: "1px solid #c8dae8" }}></td>
                    </tr>
                  </tbody>
                </table>
              )}

              {placardEditIdx === null && (
                <div style={{ background: "#f5f9fc", border: "1px solid #c8dae8", borderRadius: 3, padding: "16px 20px" }}>
                  <div style={{ fontSize: 11, color: "#6699bb", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Agregar artículo</div>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
                    <div style={{ position: "relative", flex: "2 1 220px" }}>
                      <label style={{ display: "block", fontSize: 11, color: "#6699bb", marginBottom: 4 }}>Artículo</label>
                      <input
                        value={placardSearch}
                        onChange={e => { setPlacardSearch(e.target.value); setPlacardFila(f => ({ ...f, articulo: e.target.value, precio: "" })); }}
                        onFocus={() => setPlacardSearchFocus(true)}
                        onBlur={() => setTimeout(() => setPlacardSearchFocus(false), 150)}
                        placeholder="Buscar en BD..."
                        style={{ width: "100%", fontFamily: "'Space Mono',monospace", fontSize: 12, border: "1px solid #b8cfe0", padding: "6px 10px", borderRadius: 2 }}
                      />
                      {placardSearchFocus && productosFiltrados.length > 0 && (
                        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #b8cfe0", zIndex: 50, boxShadow: "0 4px 12px #0002", maxHeight: 200, overflowY: "auto" }}>
                          {productosFiltrados.map((p, pi) => {
                            const base = p.articulo;
                            return (
                              <div key={pi}
                                onClick={() => {
                                        const preciosBase = lineasActivas.map(l => ({ linea: l.linea, precioBase: p.precios?.[String(l.linea)] ?? '' }));
                                        const precios = preciosBase.map(pb => ({ linea: pb.linea, precioBase: pb.precioBase, precio: aplicarPorcentaje(pb.precioBase) }));
                                        const precioBaseUsar = preciosBase[0]?.precioBase ?? '';
                                        const precioUsar = precios[0]?.precio ?? '';
                                        const nombreart = p.nombreart ?? p.NOMBREART ?? base;
                                        setPlacardFila(f => ({ ...f, articulo: base, nombreart, precio: String(precioUsar), precioBase: String(precioBaseUsar), precios, preciosBase }));
                                        setPlacardSearch(base);
                                      }}
                                style={{ padding: "8px 14px", cursor: "pointer", fontSize: 12, borderBottom: "1px solid #eef2f6" }}
                                onMouseOver={e => e.currentTarget.style.background = "#ddeefa"}
                                onMouseOut={e => e.currentTarget.style.background = "#fff"}
                              >
                                <span style={{ color: "#0a3a5c", fontWeight: 600 }}>{base}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    {/* Producto (nombreart) — editable, pre-rellena con articulo */}
                    <div style={{ flex: "2 1 200px" }}>
                      <label style={{ display: "block", fontSize: 11, color: "#6699bb", marginBottom: 4 }}>Producto</label>
                      <input
                        value={placardFila.nombreart ?? ""}
                        onChange={e => setPlacardFila(f => ({ ...f, nombreart: e.target.value }))}
                        placeholder="Nombre en presupuesto..."
                        style={{ width: "100%", fontFamily: "'Space Mono',monospace", fontSize: 12, border: "1px solid #b8cfe0", padding: "6px 10px", borderRadius: 2 }}
                      />
                    </div>
                    <div style={{ flex: "0 0 80px" }}>
                      <label style={{ display: "block", fontSize: 11, color: "#6699bb", marginBottom: 4 }}>Cantidad</label>
                      <input type="number" min="1" value={placardFila.cantidad} onChange={e => setPlacardFila(f => ({ ...f, cantidad: e.target.value }))}
                        style={{ width: "100%", textAlign: "center", fontFamily: "'Space Mono',monospace", fontSize: 12, border: "1px solid #b8cfe0", padding: "6px 6px", borderRadius: 2 }} />
                    </div>
                    {lineasActivas.length > 0 ? lineasActivas.map((l, li) => (
                      <div key={li} style={{ flex: "1 1 120px" }}>
                        <label style={{ display: "block", fontSize: 11, color: "#6699bb", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Línea {l.linea}</label>
                        <input type="number" min="0"
                          value={placardFila.precios[li]?.precio ?? ""}
                          onChange={e => setPlacardFila(f => {
                            const precios = [...(f.precios.length ? f.precios : lineasActivas.map(la => ({ linea: la.linea, precio: "" })))];
                            precios[li] = { ...precios[li], precio: e.target.value };
                            return { ...f, precio: precios[0]?.precio ?? "", precios };
                          })}
                          placeholder="0.00"
                          style={{ width: "100%", textAlign: "right", fontFamily: "'Space Mono',monospace", fontSize: 12, border: "1px solid #b8cfe0", padding: "6px 10px", borderRadius: 2 }}
                        />
                      </div>
                    )) : (
                      <div style={{ flex: "1 1 130px" }}>
                        <label style={{ display: "block", fontSize: 11, color: "#6699bb", marginBottom: 4 }}>Precio unit.</label>
                        <input type="number" min="0" value={placardFila.precio} onChange={e => setPlacardFila(f => ({ ...f, precio: e.target.value }))}
                          placeholder="0.00"
                          style={{ width: "100%", textAlign: "right", fontFamily: "'Space Mono',monospace", fontSize: 12, border: "1px solid #b8cfe0", padding: "6px 10px", borderRadius: 2 }} />
                      </div>
                    )}
                    <div style={{ flex: "0 0 auto", paddingTop: 20 }}>
                      <button onClick={placardAgregarFila} disabled={!placardFila.articulo.trim()}
                        style={{ padding: "6px 20px", background: placardFila.articulo.trim() ? "#0a3a5c" : "#c8dae8", color: "#fff", border: "none", borderRadius: 2, fontFamily: "'Space Mono',monospace", fontSize: 12, cursor: placardFila.articulo.trim() ? "pointer" : "default" }}>
                        + Agregar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "mampara" && (
            <div>
              {/* Banner cliente del encabezado */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#e8f0f7", border: "1px solid #c8dae8", borderRadius: 3, padding: "10px 16px", marginBottom: 16, fontFamily: "'Space Mono',monospace" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 11, color: "#6699bb", textTransform: "uppercase", letterSpacing: "0.08em" }}>Cliente:</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#0a3a5c" }}>{cliente || "Consumidor final"}</span>
                  {telefono1 && <span style={{ fontSize: 11, color: "#4a6a8c" }}>📞 {telefono1}</span>}
                  {wapp      && <span style={{ fontSize: 11, color: "#1a7a3a" }}>💬 {wapp}</span>}
                </div>
                <button
                  onClick={async () => {
                    const payload = {
                      NOMBRE:   cliente || "Consumidor final",
                      FECHA:    fecha,
                      REVISION: 0,
                    };
                    try {
                      const res = await fetch(`${API}/presupuestos-mamparas`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload),
                      });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.error ?? "Error al guardar");
                      alert(`✅ Guardado como presupuesto #${data.NUMERO ?? data.id}`);
                    } catch (err) {
                      alert(`⚠️ ${err.message}`);
                    }
                  }}
                  style={{ padding: "6px 18px", background: "#0a3a5c", color: "#fff", border: "none", borderRadius: 2, fontFamily: "'Space Mono',monospace", fontSize: 12, cursor: "pointer" }}
                >
                  💾 Guardar en BD
                </button>
              </div>
              <PresupuestoMamparas
                clienteInicial={cliente}
                onSelectItem={(item) => console.log("Mampara:", item)}
                onGuardado={(data) => {
                  if (!data) return;
                  agregarAPresupuesto({
                    id:          `mampara-${data.NUMERO ?? data.id ?? Date.now()}`,
                    seccion:     "Mampara",
                    descripcion: data.MODELO ?? "Mampara",
                    cantidad:    Number(data.CANTIDAD ?? 1),
                    precio:      Number(data.PRECIO ?? 0),
                    subtotal:    Number(data.PRECIO ?? 0),
                  });
                }}
              />
            </div>
          )}

          {tab === "especiales" && especialesVista === "selector" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 12, padding: "24px 0" }}>
              <span style={{ fontSize: 12, color: "#6699bb", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Seleccionar tipo de especial</span>
              {[
                { key: "vanitory",    icon: "🚿", label: "Vanitory" },
                { key: "escritorio",  icon: "🖥️", label: "Escritorio" },
                { key: "despensero",  icon: "🗄️", label: "Despensero" },
              ].map(({ key, icon, label }) => (
                <button
                  key={key}
                  onClick={() => setEspecialesVista(key)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 28px",
                    background: "#fff",
                    border: "1px solid #b8cfe0",
                    borderRadius: 3,
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 13,
                    color: "#0a3a5c",
                    cursor: "pointer",
                    minWidth: 220,
                    transition: "all 0.12s",
                  }}
                  onMouseOver={e => { e.currentTarget.style.background = "#ddeefa"; e.currentTarget.style.borderColor = "#7aaac8"; }}
                  onMouseOut={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#b8cfe0"; }}
                >
                  <span style={{ fontSize: 22 }}>{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          )}

          {tab === "especiales" && especialesVista === "vanitory" && vanitoryVista === "tipos" && (
            <TiposVanitory
              tiposVanitory={tiposVanitory}
              selected={null}
              modal={null}
              {...tiposVanitoryRUD}
              onArmar={(modelo) => { setVanitoryModelo(modelo); setVanitoryVista("armar"); }}
              onPrueba={() => setVanitoryVista("breakdown")}
              onVolver={() => { setEspecialesVista("selector"); setVanitoryVista("tipos"); setVanitoryModelo(null); }}
            />
          )}

          {tab === "especiales" && especialesVista === "vanitory" && vanitoryVista === "armar" && (
            <ArmarVanitory
              modelo={vanitoryModelo}
              onVolver={() => { setVanitoryVista("tipos"); setVanitoryModelo(null); }}
            />
          )}

          {tab === "especiales" && especialesVista === "vanitory" && vanitoryVista === "breakdown" && (
            <BreakdownFormulasVanitory
              onVolver={() => setVanitoryVista("tipos")}
            />
          )}

          {tab === "especiales" && especialesVista === "escritorio" && (
            <div className="pn-modulos-empty">
              <button
                onClick={() => setEspecialesVista("selector")}
                style={{ alignSelf: "flex-start", marginBottom: 16, padding: "5px 14px", background: "#fff", border: "1px solid #b8cfe0", borderRadius: 2, fontFamily: "'Space Mono',monospace", fontSize: 12, cursor: "pointer", color: "#0a3a5c" }}
              >← Volver</button>
              <span style={{ fontSize: 40 }}>🖥️</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#0a3a5c" }}>Escritorio</span>
              <span style={{ fontSize: 12 }}>Próximamente</span>
            </div>
          )}

          {tab === "especiales" && especialesVista === "despensero" && (
            <div className="pn-modulos-empty">
              <button
                onClick={() => setEspecialesVista("selector")}
                style={{ alignSelf: "flex-start", marginBottom: 16, padding: "5px 14px", background: "#fff", border: "1px solid #b8cfe0", borderRadius: 2, fontFamily: "'Space Mono',monospace", fontSize: 12, cursor: "pointer", color: "#0a3a5c" }}
              >← Volver</button>
              <span style={{ fontSize: 40 }}>🗄️</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#0a3a5c" }}>Despensero</span>
              <span style={{ fontSize: 12 }}>Próximamente</span>
            </div>
          )}

          {tab === "presupuesto" && (
            <div>
              {/* Encabezado cliente */}
              <div style={{ background: "#e8f0f7", border: "1px solid #c8dae8", borderRadius: 3, padding: "10px 16px", marginBottom: 20, fontFamily: "'Space Mono',monospace", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, color: "#6699bb", textTransform: "uppercase", letterSpacing: "0.08em" }}>Cliente:</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#0a3a5c" }}>{cliente || "Consumidor final"}</span>
                {telefono1 && <span style={{ fontSize: 11, color: "#4a6a8c" }}>📞 {telefono1}</span>}
                {telefono2 && <span style={{ fontSize: 11, color: "#4a6a8c" }}>📞 {telefono2}</span>}
                {wapp      && <span style={{ fontSize: 11, color: "#1a7a3a" }}>💬 {wapp}</span>}
                <span style={{ marginLeft: "auto", fontSize: 11, color: "#6699bb" }}>N° {numero} — Rev. {revision}</span>
              </div>

              {/* ── Panel de ajuste de precios ── */}
              {presupuestoItems.length > 0 && (
                <div style={{ background: "#f5f8fb", border: "1px solid #c8dae8", borderRadius: 4, padding: "12px 16px", marginBottom: 16, fontFamily: "'Space Mono',monospace", fontSize: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    {/* Etiqueta */}
                    <span style={{ fontWeight: 700, color: "#0a3a5c", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
                      ✏️ Ajuste de precios
                    </span>

                    {/* Modo */}
                    <div style={{ display: "flex", border: "1px solid #b8cfe0", borderRadius: 2, overflow: "hidden" }}>
                      {[["porcentaje", "% Porcentaje"], ["monto", "$ Monto"]].map(([val, label]) => (
                        <button
                          key={val}
                          onClick={() => { setAjusteModo(val); setAjusteValor(""); }}
                          style={{
                            padding: "5px 12px", border: "none", cursor: "pointer",
                            fontFamily: "'Space Mono',monospace", fontSize: 11,
                            background: ajusteModo === val ? "#0a3a5c" : "#fff",
                            color: ajusteModo === val ? "#fff" : "#0a3a5c",
                            borderRight: val === "porcentaje" ? "1px solid #b8cfe0" : "none",
                            transition: "all 0.12s",
                          }}
                        >{label}</button>
                      ))}
                    </div>

                    {/* Valor */}
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ color: "#6699bb", fontSize: 13 }}>{ajusteModo === "porcentaje" ? "%" : "$"}</span>
                      <input
                        type="number"
                        value={ajusteValor}
                        onChange={e => setAjusteValor(e.target.value)}
                        placeholder={ajusteModo === "porcentaje" ? "ej: 10" : "ej: 500"}
                        style={{ width: 90, padding: "5px 8px", border: "1px solid #b8cfe0", borderRadius: 2, fontFamily: "'Space Mono',monospace", fontSize: 12, outline: "none", color: "#0a3a5c" }}
                        onKeyDown={e => e.key === "Enter" && aplicarAjuste()}
                      />
                    </div>

                    {/* Scope */}
                    <select
                      value={ajusteScope}
                      onChange={e => setAjusteScope(e.target.value)}
                      style={{ padding: "5px 8px", border: "1px solid #b8cfe0", borderRadius: 2, fontFamily: "'Space Mono',monospace", fontSize: 11, color: "#0a3a5c", background: "#fff", maxWidth: 200 }}
                    >
                      <option value="todos">Todos los ítems</option>
                      {presupuestoItems.map(it => (
                        <option key={it.id} value={it.id}>{it.descripcion || it.nombreart || it.id}</option>
                      ))}
                    </select>

                    {/* Botón aplicar */}
                    <button
                      onClick={aplicarAjuste}
                      disabled={!ajusteValor}
                      style={{ padding: "5px 14px", background: ajusteValor ? "#0a3a5c" : "#c8dae8", color: ajusteValor ? "#fff" : "#99aabb", border: "none", borderRadius: 2, fontFamily: "'Space Mono',monospace", fontSize: 11, cursor: ajusteValor ? "pointer" : "default", fontWeight: 700, transition: "all 0.12s" }}
                    >Aplicar</button>

                    {/* Botón revertir */}
                    {ajusteAplicado && (
                      <button
                        onClick={revertirAjuste}
                        style={{ padding: "5px 14px", background: "#fff", color: "#c0392b", border: "1px solid #e0b0b0", borderRadius: 2, fontFamily: "'Space Mono',monospace", fontSize: 11, cursor: "pointer", transition: "all 0.12s" }}
                      >↩ Revertir</button>
                    )}

                    {/* Indicador activo */}
                    {ajusteAplicado && (
                      <span style={{ fontSize: 10, color: "#1a7a3a", background: "#e8f4ee", border: "1px solid #b0d8bc", borderRadius: 2, padding: "2px 8px", fontWeight: 700 }}>
                        AJUSTE ACTIVO
                      </span>
                    )}
                  </div>
                </div>
              )}

              {presupuestoItems.length === 0 ? (
                <div className="pn-modulos-empty">
                  <span style={{ fontSize: 36 }}>📋</span>
                  <span style={{ fontSize: 13, color: "#6699bb" }}>Aún no hay ítems cargados</span>
                  <span style={{ fontSize: 11, color: "#99bbcc" }}>Cargá artículos en Cocina, Placard, Mampara o Especiales</span>
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'Space Mono',monospace", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "#0a3a5c", color: "#fff" }}>
                      <th style={{ padding: "9px 14px", textAlign: "left", fontWeight: 700, letterSpacing: "0.06em" }}>Sección</th>
                      <th style={{ padding: "9px 14px", textAlign: "left", fontWeight: 700 }}>Producto</th>
                      <th style={{ padding: "9px 14px", textAlign: "left", fontWeight: 700 }}>Descripción</th>
                      <th style={{ padding: "9px 10px", textAlign: "center", fontWeight: 700, width: 70 }}>Cant.</th>
                      {lineasActivas.length > 0
                        ? lineasActivas.map(l => <th key={l.linea} style={{ padding: "9px 14px", textAlign: "right", fontWeight: 700, width: 130 }}>Línea {l.linea}</th>)
                        : <th style={{ padding: "9px 14px", textAlign: "right", fontWeight: 700, width: 130 }}>Precio unit.</th>
                      }
                      <th style={{ padding: "9px 14px", textAlign: "right", fontWeight: 700, width: 140 }}>Subtotal</th>
                      <th style={{ padding: "9px 8px", width: 36 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const secciones = [...new Set(presupuestoItems.map(p => p.seccion))];
                      let rowIdx = 0;
                      return secciones.flatMap(sec => {
                        const items = presupuestoItems.filter(p => p.seccion === sec);
                        // Subtotal por línea para la sección
                        const subtotalesSec = lineasActivas.length > 0
                          ? lineasActivas.map((l, li) =>
                              items.reduce((s, it) => {
                                const pr = parseFloat(it.precios?.[li]?.precio ?? it.precio ?? 0) || 0;
                                return s + pr * (parseFloat(it.cantidad) || 1);
                              }, 0)
                            )
                          : null;
                        const subtotalSecSimple = items.reduce((s, it) => s + it.subtotal, 0);
                        const totalCols = 4 + (lineasActivas.length > 0 ? lineasActivas.length : 1) + 1; // sección+prod+desc+cant + líneas + subtotal

                        return [
                          // Fila de sección
                          <tr key={`sec-${sec}`} style={{ background: "#ddeefa" }}>
                            <td colSpan={totalCols + 1} style={{ padding: "6px 14px", fontWeight: 700, color: "#0a3a5c", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                              {sec}
                            </td>
                          </tr>,
                          // Filas de ítems
                          ...items.map((item) => {
                            const bg = rowIdx++ % 2 === 0 ? "#fff" : "#f5f9fc";
                            return (
                              <tr key={item.id} style={{ background: bg }}>
                                <td style={{ padding: "7px 14px", border: "1px solid #e8f0f7", color: "#6699bb", fontSize: 11 }}></td>
                                <td style={{ padding: "7px 14px", border: "1px solid #e8f0f7", color: "#334155", fontSize: 11 }}>{item.nombreart}</td>
                                <td style={{ padding: "7px 14px", border: "1px solid #e8f0f7", color: "#0a3a5c" }}>{item.descripcion}</td>
                                <td style={{ padding: "7px 10px", border: "1px solid #e8f0f7", textAlign: "center" }}>{item.cantidad}</td>
                                {lineasActivas.length > 0
                                  ? lineasActivas.map((l, li) => {
                                      const pr = item.precios?.[li]?.precio ?? item.precio ?? 0;
                                      return (
                                        <td key={l.linea} style={{ padding: "7px 14px", border: "1px solid #e8f0f7", textAlign: "right" }}>
                                          ${Number(pr).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                                          {listaPorcentaje !== 0 && (
                                            <span style={{ marginLeft: 5, fontSize: 9, color: "#2277bb", fontWeight: 700 }}>+{listaPorcentaje}%</span>
                                          )}
                                        </td>
                                      );
                                    })
                                  : (
                                    <td style={{ padding: "7px 14px", border: "1px solid #e8f0f7", textAlign: "right" }}>
                                      ${Number(item.precio).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                                    </td>
                                  )
                                }
                                <td style={{ padding: "7px 14px", border: "1px solid #e8f0f7", textAlign: "right", fontWeight: 700 }}>
                                  ${Number(item.subtotal).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                                </td>
                                <td style={{ padding: "7px 4px", border: "1px solid #e8f0f7", textAlign: "center" }}>
                                  <button onClick={() => quitarDePresupuesto(item.id)} title="Quitar" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#c0392b" }}>🗑</button>
                                </td>
                              </tr>
                            );
                          }),
                          // Subtotal de sección
                          <tr key={`sub-${sec}`} style={{ background: "#e8f4ee" }}>
                            <td colSpan={4} style={{ padding: "6px 14px", textAlign: "right", fontWeight: 700, color: "#0a3a5c", fontSize: 11, border: "1px solid #c8dae8" }}>
                              Subtotal {sec}
                            </td>
                            {lineasActivas.length > 0
                              ? subtotalesSec.map((st, li) => (
                                  <td key={li} style={{ padding: "6px 14px", textAlign: "right", fontWeight: 700, color: "#0a5c3a", border: "1px solid #c8dae8" }}>
                                    ${st.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                                  </td>
                                ))
                              : null
                            }
                            <td style={{ padding: "6px 14px", textAlign: "right", fontWeight: 700, color: "#0a5c3a", border: "1px solid #c8dae8" }}>
                              ${subtotalSecSimple.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                            </td>
                            <td style={{ border: "1px solid #c8dae8" }}></td>
                          </tr>,
                        ];
                      });
                    })()}
                    {/* TOTAL GENERAL */}
                    <tr style={{ background: "#0a3a5c" }}>
                      <td colSpan={4} style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: "#60efff", fontSize: 13, letterSpacing: "0.06em" }}>
                        TOTAL GENERAL
                      </td>
                      {lineasActivas.length > 0
                        ? lineasActivas.map((l, li) => {
                            const total = presupuestoItems.reduce((s, it) => {
                              const pr = parseFloat(it.precios?.[li]?.precio ?? it.precio ?? 0) || 0;
                              return s + pr * (parseFloat(it.cantidad) || 1);
                            }, 0);
                            return (
                              <td key={l.linea} style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: "#fff", fontSize: 14 }}>
                                ${total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                              </td>
                            );
                          })
                        : null
                      }
                      <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: lineasActivas.length > 0 ? "#60efff" : "#fff", fontSize: 14 }}>
                        ${presupuestoItems.reduce((s, p) => s + p.subtotal, 0).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ background: "#0a3a5c" }}></td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
}
