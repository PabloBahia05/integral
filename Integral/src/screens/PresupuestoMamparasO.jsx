import { useState, useEffect, useRef } from "react";

export default function PresupuestoMamparas({ presupuestoACargar = null, onCargado, onGuardado }) {
  const [presupuestoId, setPresupuestoId] = useState(null); // número entero, null = sin asignar
  const [revision, setRevision]           = useState(0);
  const [articuloSeleccionado, setArticuloSeleccionado] = useState(null);
  const [articulos, setArticulos]         = useState([]);
  const [familias, setFamilias]           = useState([]);
  const [busqueda, setBusqueda]           = useState("");
  const [showDropdown, setShowDropdown]   = useState(false);
  const [modelo, setModelo]               = useState("");
  const searchRef = useRef(null);

  // ── Artículos asociados ─────────────────────────────────────────────────────
  // Cada slot: { slot, art, cod, precio, codform, resultado, parciales, error }
  const [asociados, setAsociados]               = useState([]);
  const [cargandoAsociados, setCargandoAsociados] = useState(false);

  // ── Cálculo ─────────────────────────────────────────────────────────────────
  const [calculando, setCalculando]   = useState(false);
  const [errorCalc, setErrorCalc]     = useState("");
  const [calculated, setCalculated]   = useState(false);
  const [parcialesExpandidos, setParcialesExpandidos] = useState({});

  // ── Colocación ──────────────────────────────────────────────────────────────
  const [colocacionBD, setColocacionBD] = useState(null);

  // ── Guardado ────────────────────────────────────────────────────────────────
  const [guardando, setGuardando]           = useState(false);
  const [guardadoOk, setGuardadoOk]         = useState(false);
  const [modoEdicion, setModoEdicion]       = useState(false);   // true = editando presupuesto existente
  const [presupuestoDbId, setPresupuestoDbId] = useState(null); // id de la fila en BD (para revisiones)

  // ── Form ────────────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    cliente:   "",
    cantidad:  1,
    ancho:     80,
    alto:      200,
    vidrio:    "esmerilado",
    colocacion: 0,
  });

  // ── Cargar presupuesto guardado (reabrir) ────────────────────────────────────
  // Se activa cuando el componente padre pasa un presupuesto guardado para editar.
  // Reconstituye todo el estado y pone modoEdicion = true.
  useEffect(() => {
    if (!presupuestoACargar) return;

    const p = presupuestoACargar;

    // Número de presupuesto y revisión
    setPresupuestoId(p.NUMERO ? Number(p.NUMERO) : Number(p.id ?? 0));
    setRevision(Number(p.REVISION ?? 0));
    setModoEdicion(true);
    setPresupuestoDbId(p.id ?? null);

    // Datos del form
    setForm({
      cliente:    p.NOMBRE   ?? "",
      cantidad:   Number(p.CANTIDAD  ?? 1),
      ancho:      Number(p.ANCHO     ?? 80),
      alto:       Number(p.ALTO      ?? 200),
      vidrio:     p.VIDRIO   ?? "esmerilado",
      colocacion: Number(p.COLOCACION ?? 0),
    });

    // Modelo / tipo
    setModelo(p.MODELO ?? "");
    setBusqueda("");   // el tipo se inferirá al seleccionar el artículo

    // Reconstituir artículos asociados desde art1..art10 y valor1..valor10
    const slotsGuardados = [];
    for (let n = 1; n <= 10; n++) {
      const art   = p[`art${n}`];
      const valor = p[`valor${n}`];
      if (!art) continue;
      slotsGuardados.push({
        slot:          n,
        art,
        cod:           "",        // se enriquece después si hace falta
        precio:        0,
        codform:       null,
        margen:        1,
        margenBD:      1,
        resultadoBase: Number(valor ?? 0),
        resultado:     Number(valor ?? 0),
        parciales:     {},
        error:         "",
      });
    }
    setAsociados(slotsGuardados);
    setCalculated(true);
    onCargado?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presupuestoACargar]);

  // ── Cargar catálogo de mamparas ─────────────────────────────────────────────
  useEffect(() => {
    fetch("http://localhost:3001/productos/mamparas")
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) return;
        const normalized = data.map(a => ({
          ...a,
          familia: (a.familia && a.familia.trim()) ? a.familia.trim() : (a.rubro ?? ""),
        }));
        setArticulos(normalized);
        const fams = [...new Set(normalized.map(a => a.familia).filter(Boolean))].sort();
        setFamilias(fams);
      })
      .catch(() => {});
  }, []);

  // ── Próximo número de presupuesto ───────────────────────────────────────────
  // Solo se consulta cuando NO hay presupuesto previo cargado (modo nuevo).
  // Se usa una ref para evitar que el fetch asíncrono pise el número
  // que ya seteó el useEffect de "cargar presupuesto existente".
  const fetchProximoNumero = () => {
    fetch("http://localhost:3001/presupuestos-mamparas/proximo-numero")
      .then(r => r.json())
      .then(data => {
        const n = data?.proximo ?? null;
        setPresupuestoId(n != null ? Number(n) : 1);
      })
      .catch(() => setPresupuestoId(1));
  };

  useEffect(() => {
    // Si al montar ya viene un presupuesto para editar, no traer número nuevo
    if (presupuestoACargar) return;
    fetchProximoNumero();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // solo al montar — handleNuevo llama fetchProximoNumero() directamente

  // ── Cerrar dropdown al hacer click fuera ────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target))
        setShowDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Colocación desde BD al cambiar artículo ─────────────────────────────────
  useEffect(() => {
    if (!articuloSeleccionado?.codart) return;
    fetch(`http://localhost:3001/colocacion/buscar?codart=${encodeURIComponent(articuloSeleccionado.codart)}`)
      .then(r => r.json())
      .then(data => {
        const precio = data?.precio != null ? parseFloat(data.precio) : null;
        if (precio !== null && !isNaN(precio)) {
          setColocacionBD(precio);
          setForm(prev => ({ ...prev, colocacion: precio }));
        } else {
          setColocacionBD(null);
          setForm(prev => ({ ...prev, colocacion: 0 }));
        }
      })
      .catch(() => setColocacionBD(null));
  }, [articuloSeleccionado?.id, articuloSeleccionado?.codart]);

  // ── Cargar artículos asociados al cambiar artículo ──────────────────────────
  // Flujo:
  //   1. GET /asociaciones → fila con art1..art10, cod1..cod10, margen1..10, form1..form10
  //   La fórmula viene directamente del campo form1..form10 de la tabla asociaciones.
  //   El margen viene de margen1..margen10 y es editable en el front.
  useEffect(() => {
    if (!articuloSeleccionado?.codart) {
      setAsociados([]);
      setCalculated(false);
      return;
    }

    setCargandoAsociados(true);
    setAsociados([]);
    setCalculated(false);

    fetch("http://localhost:3001/asociaciones")
      .then(r => r.json())
      .then(dataAsoc => {
        if (!Array.isArray(dataAsoc)) return;

        const codartLower = articuloSeleccionado.codart.toLowerCase().trim();
        const artLower    = (articuloSeleccionado.articulo ?? "").toLowerCase().trim();

        const fila = dataAsoc.find(a =>
          (a.codart   ?? "").toLowerCase().trim() === codartLower ||
          (a.articulo ?? "").toLowerCase().trim() === artLower
        );

        if (!fila) { setCargandoAsociados(false); return; }

        const slots = [];
        for (let n = 1; n <= 10; n++) {
          const art    = fila[`art${n}`];
          const cod    = fila[`cod${n}`];
          const margen = parseFloat(fila[`margen${n}`] ?? 0) || 0;
          const codform = fila[`form${n}`] ?? null;   // ← fórmula directa de asociaciones
          if (!art && !cod) continue;

          const codLower2 = (cod ?? "").toLowerCase().trim();
          const artLower2 = (art ?? "").toLowerCase().trim();

          // Precio del artículo asociado desde el catálogo
          const productoAsoc = articulos.find(p =>
            (p.codart   ?? "").toLowerCase().trim() === codLower2 ||
            (p.articulo ?? "").toLowerCase().trim() === artLower2
          );
          const precioAsoc = productoAsoc?.precio ? parseFloat(productoAsoc.precio) : 0;
          const codartAsoc = productoAsoc?.codart ?? cod ?? "";

          slots.push({
            slot:       n,
            art:        art ?? codartAsoc,
            cod:        codartAsoc,
            precio:     precioAsoc,
            codform:    codform || null,
            margen:     margen,       // editable en el front
            margenBD:   margen,       // valor original de BD para restaurar
            resultadoBase: 0,         // resultado puro de la fórmula (sin margen)
            resultado:     0,         // resultado final = base * (1 + margen/100)
            parciales:     {},
            error:      codform ? "" : "Sin fórmula",
          });
        }
        setAsociados(slots);
      })
      .catch(() => {})
      .finally(() => setCargandoAsociados(false));

  // Re-ejecutar cuando cambia el artículo o el catálogo
  }, [articuloSeleccionado?.id, articuloSeleccionado?.codart, articulos]);

  // ── Calcular bases: llama al backend por cada artículo asociado ─────────────
  // Calcula resultadoBase (valor puro de la fórmula, sin margen).
  // El resultado final = base * (1 + margen/100) se aplica reactivamente.
  const calcular = async (slotsActuales) => {
    const slots = slotsActuales ?? asociados;
    if (!articuloSeleccionado?.codart) return;
    const slotsConFormula = slots.filter(a => a.codform);
    if (slotsConFormula.length === 0) return;

    setErrorCalc("");
    setCalculando(true);

    try {
      // Obtener textos de fórmulas para resolver dependencias FORM_XXX
      const resFormulas = await fetch("http://localhost:3001/formulas").then(r => r.json()).catch(() => []);
      const formulasTexto = {};
      if (Array.isArray(resFormulas))
        resFormulas.forEach(f => { formulasTexto[f.codform] = f.formula ?? ""; });

      const getDeps = (cf) =>
        (formulasTexto[cf] ?? "").match(/FORM_([A-Z0-9]+)/g)?.map(m => m.replace("FORM_", "")) ?? [];

      // Sort topológico
      const codformsList = [...new Set(slotsConFormula.map(a => a.codform))];
      const ordenados = [];
      const visitados = new Set();
      const visitar = (cf) => {
        if (visitados.has(cf)) return;
        visitados.add(cf);
        getDeps(cf).forEach(dep => { if (codformsList.includes(dep)) visitar(dep); });
        ordenados.push(cf);
      };
      codformsList.forEach(cf => visitar(cf));

      // Calcular secuencialmente; acumular FORM_XXX para anidadas
      const resultadosMap = {};
      const nuevos = slots.map(a => ({ ...a }));

      for (const codform of ordenados) {
        const idxs = nuevos.reduce((acc, a, i) => { if (a.codform === codform) acc.push(i); return acc; }, []);

        for (const idx of idxs) {
          const asoc = nuevos[idx];
          const variables = {
            ancho:      Number(form.ancho),
            alto:       Number(form.alto),
            cantidad:   Number(form.cantidad),
            colocacion: Number(form.colocacion),
            precio:     asoc.precio,
            ...Object.fromEntries(Object.entries(resultadosMap).map(([cf, v]) => [`FORM_${cf}`, v])),
          };

          const res = await fetch("http://localhost:3001/formulas/calcular", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ codform, codart_modelo: asoc.cod, variables }),
          }).then(r => r.json()).catch(err => ({ error: err.message }));

          if (res.error) {
            nuevos[idx] = { ...asoc, resultadoBase: 0, resultado: 0, parciales: {}, error: res.error };
          } else {
            const base  = res.resultado ?? 0;
            const mg    = parseFloat(asoc.margen) || 1;
            const final = Math.round(base * mg);
            resultadosMap[codform] = base;
            nuevos[idx] = { ...asoc, resultadoBase: base, resultado: final, parciales: res.parciales ?? {}, error: "" };
          }
        }
      }

      setAsociados(nuevos);
      setCalculated(true);
    } catch (err) {
      setErrorCalc(err.message);
    } finally {
      setCalculando(false);
    }
  };

  // ── Recalcular al cambiar variables del form ─────────────────────────────────
  // Se dispara ante cualquier cambio de ancho/alto/cantidad/colocacion/vidrio
  // (cambios de margen se aplican reactivamente sin fetch — ver abajo)
  useEffect(() => {
    if (!articuloSeleccionado?.codart || asociados.length === 0) return;
    if (!asociados.some(a => a.codform)) return;
    calcular();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    articuloSeleccionado?.codart,
    form.ancho,
    form.alto,
    form.cantidad,
    form.vidrio,
    form.colocacion,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(asociados.map(a => a.codform)),
  ]);

  // ── Aplicar margen reactivamente (sin fetch) ─────────────────────────────────
  // Cuando el usuario cambia un margen en el front, recalcula
  // resultado = resultadoBase * (1 + margen/100) de forma instantánea.
  useEffect(() => {
    if (asociados.length === 0) return;
    setAsociados(prev => prev.map(a => {
      if (!a.resultadoBase) return a;
      const mg    = parseFloat(a.margen) || 1;
      const final = Math.round(a.resultadoBase * mg);
      return final !== a.resultado ? { ...a, resultado: final } : a;
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(asociados.map(a => a.margen))]);

  // ── Totales ─────────────────────────────────────────────────────────────────
  const subtotalArticulos = asociados.reduce((acc, a) => acc + (a.resultado ?? 0), 0);
  const total             = subtotalArticulos + Number(form.colocacion);

  const formatPeso = (n) =>
    "$" + Number(n).toLocaleString("es-AR", { minimumFractionDigits: 0 }).replace(/,/g, ".");

  // ── Artículos filtrados para los selects ─────────────────────────────────────
  const articulosFiltradosPorTipo = busqueda
    ? articulos.filter(a => (a.familia ?? "").toLowerCase() === busqueda.toLowerCase())
    : [];

  const seleccionarArticulo = (art) => {
    setArticuloSeleccionado(art);
    setBusqueda(art.articulo);
    setShowDropdown(false);
  };

  // ── Guardar ──────────────────────────────────────────────────────────────────
  // - Nuevo presupuesto  → POST /presupuestos-mamparas (REVISION = 0)
  // - Reabierto/editado  → POST /presupuestos-mamparas (mismo número, REVISION + 1)
  //   El backend debe insertar una nueva fila (nueva revisión), no actualizar la existente.
  const handleGuardar = async () => {
    if (!modelo) { setErrorCalc("Seleccioná un modelo de mampara primero."); return; }
    setGuardando(true);
    setErrorCalc("");
    setGuardadoOk(false);

    // Construir art1..art10 y valor1..valor10 desde los asociados
    const artValores = {};
    asociados.forEach((a, i) => {
      const n = i + 1;
      artValores[`art${n}`]   = a.art   ?? "";
      artValores[`valor${n}`] = a.resultado > 0 ? String(a.resultado) : "";
    });
    // Limpiar slots vacíos (hasta 10)
    for (let n = asociados.length + 1; n <= 10; n++) {
      artValores[`art${n}`]   = "";
      artValores[`valor${n}`] = "";
    }

    const nuevaRevision = modoEdicion ? revision + 1 : 0;

    const payload = {
      NOMBRE:     form.cliente,
      FECHA:      new Date().toISOString().slice(0, 10),
      CANTIDAD:   Number(form.cantidad),
      MODELO:     modelo,
      ANCHO:      Number(form.ancho),
      ALTO:       Number(form.alto),
      VIDRIO:     form.vidrio,
      COLOCACION: Number(form.colocacion),
      PRECIO:     Number(total),
      REVISION:   nuevaRevision,
      // NUMERO como entero: si es edición manda el número actual, si es nuevo no manda nada
      ...(modoEdicion && presupuestoId != null ? { NUMERO: Number(presupuestoId) } : {}),
      ...artValores,
    };

    try {
      const res  = await fetch("http://localhost:3001/presupuestos-mamparas", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al guardar");

      // Capturar si era nuevo ANTES de mutar modoEdicion
      const eraPresupuestoNuevo = !modoEdicion;

      setGuardadoOk(true);
      setRevision(nuevaRevision);
      setModoEdicion(true);
      setPresupuestoDbId(data.id ?? null);

      // Siempre actualizar el número desde la respuesta del servidor
      const numeroAsignado = data.NUMERO ?? data.id;
      if (numeroAsignado != null) {
        setPresupuestoId(Number(numeroAsignado));
      } else if (eraPresupuestoNuevo) {
        fetchProximoNumero();
      }

      onGuardado?.();   // avisar al padre para refrescar la lista
      setTimeout(() => setGuardadoOk(false), 3000);
    } catch (err) {
      setErrorCalc(err.message);
    } finally {
      setGuardando(false);
    }
  };

  // ── Nuevo presupuesto (resetear todo) ────────────────────────────────────────
  const handleNuevo = () => {
    setModoEdicion(false);
    setPresupuestoDbId(null);
    setRevision(0);
    setArticuloSeleccionado(null);
    setAsociados([]);
    setBusqueda("");
    setModelo("");
    setForm({ cliente: "", cantidad: 1, ancho: 80, alto: 200, vidrio: "esmerilado", colocacion: 0 });
    setColocacionBD(null);
    setErrorCalc("");
    fetchProximoNumero(); // trae el próximo número actualizado desde la BD
  };

  const handlePrint = () => window.print();

  const handlePDF = () => {
    const fecha  = new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" });
    const nro    = presupuestoId != null ? String(presupuestoId).padStart(5, "0") : "----";

    const filasArticulos = asociados
      .filter(a => a.resultado > 0)
      .map((a, i) => `
        <tr>
          <td>${i + 1}</td>
          <td><strong>${a.art}</strong></td>
          <td>${a.cod ?? ""}</td>
          <td>${formatPeso(a.resultado)}</td>
        </tr>`)
      .join("");

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Presupuesto N° ${nro}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Source+Sans+3:wght@300;400;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Source Sans 3', Arial, sans-serif; background: #fff; color: #1a2a3a; font-size: 13px; }
    .page { width: 794px; min-height: 1123px; margin: 0 auto; padding: 0; display: flex; flex-direction: column; }
    .header { background: #0f2944; color: #fff; padding: 32px 48px 28px; display: flex; justify-content: space-between; align-items: flex-start; }
    .company-name { font-family: 'Rajdhani', sans-serif; font-size: 30px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
    .company-sub { font-size: 11px; color: #7ab2d4; letter-spacing: 0.18em; text-transform: uppercase; margin-top: 4px; }
    .company-contact { font-size: 11px; color: #a8c4d8; margin-top: 10px; line-height: 1.7; }
    .header-right { text-align: right; }
    .doc-title { font-family: 'Rajdhani', sans-serif; font-size: 26px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #60b4f0; }
    .doc-nro { font-family: 'Rajdhani', sans-serif; font-size: 42px; font-weight: 700; color: #fff; line-height: 1; }
    .doc-fecha { font-size: 11px; color: #7ab2d4; margin-top: 6px; }
    .accent-bar { height: 4px; background: linear-gradient(90deg, #2d7fc1 0%, #60b4f0 50%, #2d7fc1 100%); }
    .body { padding: 36px 48px; flex: 1; }
    .client-block { display: flex; gap: 24px; margin-bottom: 32px; }
    .info-box { flex: 1; border: 1px solid #d0dde8; border-radius: 6px; padding: 16px 20px; }
    .info-box-title { font-family: 'Rajdhani', sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #2d7fc1; margin-bottom: 10px; border-bottom: 1px solid #e8f0f7; padding-bottom: 6px; }
    .info-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
    .info-label { color: #6a8aa0; }
    .info-value { font-weight: 600; color: #0f2944; text-align: right; }
    .section-title { font-family: 'Rajdhani', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #2d7fc1; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
    thead tr { background: #0f2944; }
    thead th { color: #fff; font-family: 'Rajdhani', sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; padding: 10px 14px; text-align: left; }
    thead th:last-child { text-align: right; }
    tbody tr { border-bottom: 1px solid #e8f0f7; }
    tbody tr:nth-child(even) { background: #f7fafd; }
    tbody td { padding: 11px 14px; font-size: 13px; color: #2a3a4a; }
    tbody td:last-child { text-align: right; font-weight: 600; color: #0f2944; }
    .totals-wrap { display: flex; justify-content: flex-end; margin-bottom: 36px; }
    .totals-box { width: 300px; }
    .totals-row { display: flex; justify-content: space-between; padding: 8px 14px; font-size: 13px; border-bottom: 1px solid #e8f0f7; }
    .totals-row .t-label { color: #6a8aa0; }
    .totals-row .t-value { font-weight: 600; color: #0f2944; }
    .totals-total { display: flex; justify-content: space-between; padding: 13px 16px; background: #0f2944; border-radius: 4px; margin-top: 4px; }
    .totals-total .t-label { color: #a8c4d8; font-family: 'Rajdhani', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 0.14em; }
    .totals-total .t-value { color: #fff; font-family: 'Rajdhani', sans-serif; font-size: 20px; font-weight: 700; }
    .footer { background: #f0f6fb; border-top: 2px solid #d0dde8; padding: 20px 48px; display: flex; justify-content: space-between; align-items: center; }
    .footer-left { font-size: 11px; color: #6a8aa0; line-height: 1.6; }
    .footer-right { text-align: right; font-size: 11px; color: #6a8aa0; }
    .footer-brand { font-family: 'Rajdhani', sans-serif; font-size: 14px; font-weight: 700; color: #0f2944; letter-spacing: 0.06em; }
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <div>
      <div class="company-name">🪟 Mamparas &amp; Vidrios</div>
      <div class="company-sub">Especialistas en mamparas de baño</div>
      <div class="company-contact">
        📍 Bahía Blanca, Buenos Aires<br/>
        📞 291 - 000 0000<br/>
        ✉️ contacto@mamparasvidrios.com
      </div>
    </div>
    <div class="header-right">
      <div class="doc-title">Presupuesto</div>
      <div class="doc-nro">N° ${nro}</div>
      <div class="doc-fecha">Fecha: ${fecha}</div>
      <div class="doc-fecha" style="margin-top:4px; color:#a8c4d8;">Revisión: ${revision}</div>
    </div>
  </div>
  <div class="accent-bar"></div>
  <div class="body">
    <div class="client-block">
      <div class="info-box">
        <div class="info-box-title">Datos del cliente</div>
        <div class="info-row"><span class="info-label">Cliente</span><span class="info-value">${form.cliente || "—"}</span></div>
        <div class="info-row"><span class="info-label">Fecha</span><span class="info-value">${fecha}</span></div>
      </div>
      <div class="info-box">
        <div class="info-box-title">Detalle del pedido</div>
        <div class="info-row"><span class="info-label">Tipo mampara</span><span class="info-value">${busqueda || "—"}</span></div>
        ${modelo ? `<div class="info-row"><span class="info-label">Modelo</span><span class="info-value">${modelo}</span></div>` : ""}
        <div class="info-row"><span class="info-label">Cantidad</span><span class="info-value">${form.cantidad} unidad(es)</span></div>
        <div class="info-row"><span class="info-label">Medidas</span><span class="info-value">${form.ancho} cm × ${form.alto} cm</span></div>
        <div class="info-row"><span class="info-label">Tipo de vidrio</span><span class="info-value">${form.vidrio === "incoloro" ? "Incoloro" : "Esmerilado"}</span></div>
      </div>
    </div>
    <div class="section-title">Detalle de costos</div>
    <table>
      <thead>
        <tr><th>#</th><th>Artículo</th><th>Código</th><th>Importe</th></tr>
      </thead>
      <tbody>
        ${filasArticulos}
        ${Number(form.colocacion) > 0 ? `
        <tr>
          <td>—</td>
          <td><strong>Colocación</strong></td>
          <td>—</td>
          <td>${formatPeso(form.colocacion)}</td>
        </tr>` : ""}
      </tbody>
    </table>
    <div class="totals-wrap">
      <div class="totals-box">
        <div class="totals-row"><span class="t-label">Subtotal artículos</span><span class="t-value">${formatPeso(subtotalArticulos)}</span></div>
        ${Number(form.colocacion) > 0 ? `<div class="totals-row"><span class="t-label">Colocación</span><span class="t-value">${formatPeso(form.colocacion)}</span></div>` : ""}
        <div class="totals-total"><span class="t-label">TOTAL</span><span class="t-value">${formatPeso(total)}</span></div>
      </div>
    </div>
  </div>
  <div class="footer">
    <div class="footer-left">
      <div class="footer-brand">Mamparas &amp; Vidrios</div>
      Bahía Blanca, Buenos Aires · 291-000-0000
    </div>
    <div class="footer-right">
      Presupuesto N° ${nro} — Rev. ${revision}<br/>
      Emitido el ${fecha}
    </div>
  </div>
</div>
</body>
</html>`;

    const win = window.open("", "_blank");
    if (!win) { alert("Habilitá las ventanas emergentes para generar el PDF."); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 800);
  };

  // ── RENDER ───────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Source+Sans+3:wght@300;400;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #e8f0f7; font-family: 'Source Sans 3', sans-serif; }
        .layout { min-height: 100vh; background: #e8f0f7; }
        .main { flex: 1; display: flex; align-items: flex-start; justify-content: center; padding: 40px 24px; }
        .card { background: #fff; border-radius: 10px; padding: 32px 36px; width: 100%; max-width: 560px; box-shadow: 0 2px 16px rgba(15,41,68,0.08); }
        .field { margin-bottom: 20px; }
        .label-text { display: block; font-family: 'Rajdhani', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.14em; color: #4a8ab5; margin-bottom: 6px; }
        .input { width: 100%; border: 1.5px solid #d0dde8; border-radius: 6px; padding: 10px 14px; font-size: 15px; color: #0f2944; outline: none; transition: border-color 0.15s; font-family: 'Source Sans 3', sans-serif; }
        .input:focus { border-color: #2d7fc1; }
        .row { display: flex; gap: 16px; }
        .row .field { flex: 1; }
        .toggle-row { display: flex; gap: 10px; }
        .toggle-btn { flex: 1; padding: 10px; border-radius: 6px; border: 1.5px solid #d0dde8; background: #fff; cursor: pointer; font-family: 'Rajdhani', sans-serif; font-size: 14px; font-weight: 600; letter-spacing: 0.05em; color: #4a8ab5; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.15s; }
        .toggle-btn.active { background: #0f2944; border-color: #0f2944; color: #fff; }
        .breakdown { background: #f4f8fb; border-radius: 8px; overflow: hidden; margin-bottom: 24px; }
        .breakdown-row { display: flex; justify-content: space-between; padding: 12px 16px; font-size: 14px; color: #4a6a80; border-bottom: 1px solid #e0eaf2; }
        .breakdown-row:last-child { border-bottom: none; }
        .total-row { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; background: #0f2944; color: #fff; }
        .total-label { font-family: 'Rajdhani', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 0.14em; }
        .total-value { font-family: 'Rajdhani', sans-serif; font-size: 22px; font-weight: 700; letter-spacing: 0.04em; }
        .actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
        .btn { padding: 11px 20px; border-radius: 6px; border: none; cursor: pointer; font-family: 'Rajdhani', sans-serif; font-size: 14px; font-weight: 700; letter-spacing: 0.06em; display: flex; align-items: center; gap: 7px; transition: all 0.15s; }
        .btn-cancel { background: transparent; border: 1.5px solid #d0dde8; color: #4a6a80; }
        .btn-cancel:hover { border-color: #4a8ab5; color: #0f2944; }
        .btn-save { background: #16a34a; color: #fff; }
        .btn-save:hover { background: #15803d; }
        .btn-pdf { background: #dc2626; color: #fff; }
        .btn-pdf:hover { background: #b91c1c; }
        .btn-print { background: #7c3aed; color: #fff; }
        .btn-print:hover { background: #6d28d9; }
        .presup-badge { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; padding-bottom: 18px; border-bottom: 1.5px solid #e0eaf2; }
        .presup-badge-title { font-family: 'Rajdhani', sans-serif; font-size: 18px; font-weight: 700; color: #0f2944; letter-spacing: 0.06em; text-transform: uppercase; }
        .presup-badge-num { font-family: 'Rajdhani', sans-serif; font-size: 22px; font-weight: 700; color: #2d7fc1; letter-spacing: 0.08em; background: #eaf3fb; border: 1.5px solid #b8d6ef; border-radius: 6px; padding: 4px 16px; min-width: 100px; text-align: center; }
        .presup-badge-num.empty { color: #b0c8d8; border-color: #d8e8f0; }
        .presup-layout { display: flex; gap: 24px; align-items: flex-start; }
        .presup-form-col { flex: 1; min-width: 0; }
        .foto-panel { background: #fff; border-radius: 10px; box-shadow: 0 2px 16px rgba(15,41,68,0.08); padding: 24px; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; min-width: 220px; max-width: 280px; align-self: flex-start; position: sticky; top: 40px; }
        .foto-panel-title { font-family: 'Rajdhani', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.14em; color: #4a8ab5; text-transform: uppercase; margin-bottom: 14px; align-self: flex-start; }
        .foto-panel-img { width: 100%; max-height: 220px; object-fit: contain; border-radius: 8px; border: 1px solid #e0eaf2; background: #f7fafd; }
        .foto-panel-empty { width: 100%; height: 180px; border: 2px dashed #d0dde8; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #b0c8d8; gap: 8px; background: #f7fafd; }
        .foto-panel-empty span { font-size: 36px; }
        .foto-panel-empty small { font-size: 12px; }
        .foto-panel-info { margin-top: 14px; width: 100%; }
        .foto-info-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #f0f4f8; font-size: 12px; }
        .foto-info-row:last-child { border-bottom: none; }
        .foto-info-label { color: #6a8aa0; }
        .foto-info-value { font-weight: 600; color: #0f2944; text-align: right; max-width: 60%; word-break: break-word; }
        .asociados-section { margin-bottom: 20px; border: 1.5px solid #d0dde8; border-radius: 8px; overflow: hidden; }
        .asociados-header { background: #0f2944; padding: 10px 16px; display: flex; align-items: center; justify-content: space-between; }
        .asociados-header-title { font-family: 'Rajdhani', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.14em; color: #a8c4d8; text-transform: uppercase; }
        .asociado-row { display: grid; grid-template-columns: 1fr 110px auto; gap: 8px; align-items: center; padding: 10px 14px; border-bottom: 1px solid #e8f0f7; font-size: 13px; }
        .asociado-row:last-child { border-bottom: none; }
        .asociado-row:nth-child(even) { background: #f7fafd; }
        .asociado-nombre { color: #0f2944; font-weight: 600; }
        .asociado-cod { color: #6a8aa0; font-size: 11px; font-family: monospace; }
        .asociado-resultado { font-family: 'Rajdhani', sans-serif; font-size: 15px; font-weight: 700; color: #2d7fc1; text-align: right; white-space: nowrap; }
        .asociado-error { font-size: 11px; color: #c0392b; font-style: italic; }
        .asociado-empty { padding: 14px 16px; text-align: center; color: #9ab0c0; font-size: 12px; font-style: italic; }
        #presupuesto-print { display: none; }
        @media print { .sidebar, .actions { display: none !important; } .card { box-shadow: none; } #presupuesto-print { display: block !important; } }
        @media (max-width: 768px) { .presup-layout { flex-direction: column; } .foto-panel { max-width: 100%; width: 100%; position: static; min-width: unset; } }
      `}</style>

      <div className="layout">
        <main className="main">
          <div className="presup-layout">
            <div className="presup-form-col">
              <div className="card">

                {/* Header: título + número */}
                <div className="presup-badge">
                  <span className="presup-badge-title">🪟 Presupuesto Mamparas</span>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                    <span className={`presup-badge-num${presupuestoId == null ? " empty" : ""}`}>
                      {presupuestoId != null ? `N° ${String(presupuestoId).padStart(5, "0")}` : "N° —"}
                    </span>
                    <span style={{
                      fontSize: "11px", fontFamily: "'Source Sans 3', sans-serif", fontWeight: 600,
                      background: modoEdicion ? "#fff3cd" : "#eaf3fb",
                      color:      modoEdicion ? "#856404" : "#2d7fc1",
                      border:     `1px solid ${modoEdicion ? "#ffc107" : "#b8d6ef"}`,
                      borderRadius: "4px", padding: "1px 8px", letterSpacing: "0.04em",
                    }}>
                      {modoEdicion ? `✏️ Rev. ${revision} — editando` : "Rev. 0 — nuevo"}
                    </span>
                  </div>
                </div>

                {/* Cliente */}
                <div className="field">
                  <span className="label-text">NOMBRE / CLIENTE *</span>
                  <input
                    className="input"
                    value={form.cliente}
                    onChange={(e) => setForm({ ...form, cliente: e.target.value })}
                    placeholder="Nombre del cliente"
                  />
                </div>

                {/* Tipo de mampara */}
                <div className="field">
                  <span className="label-text">TIPO DE MAMPARA</span>
                  <select
                    className="input"
                    value={busqueda}
                    onChange={(e) => {
                      const val = e.target.value;
                      setBusqueda(val);
                      setModelo("");
                      setArticuloSeleccionado(null);
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <option value="">— Seleccioná un tipo —</option>
                    {familias.map((fam) => (
                      <option key={fam} value={fam}>{fam}</option>
                    ))}
                  </select>
                </div>

                {/* Modelo de mampara */}
                <div className="field">
                  <span className="label-text">MODELO DE MAMPARA</span>
                  <select
                    className="input"
                    value={modelo}
                    onChange={(e) => {
                      const val = e.target.value;
                      setModelo(val);
                      if (val) {
                        const art = articulosFiltradosPorTipo.find(a => a.articulo === val);
                        if (art) setArticuloSeleccionado(art);
                      }
                    }}
                    style={{ cursor: "pointer" }}
                    disabled={!busqueda}
                  >
                    <option value="">
                      {busqueda ? `— Seleccioná un modelo de ${busqueda} —` : "— Primero seleccioná un tipo —"}
                    </option>
                    {articulosFiltradosPorTipo.map((art) => (
                      <option key={art.id} value={art.articulo}>{art.articulo}</option>
                    ))}
                  </select>
                </div>

                {/* Artículos asociados */}
                {articuloSeleccionado && (
                  <div className="asociados-section">
                    <div className="asociados-header">
                      <span className="asociados-header-title">🔗 Artículos asociados</span>
                      {cargandoAsociados && <span style={{ fontSize:"10px", color:"#7ab2d4", fontStyle:"italic" }}>⏳ cargando...</span>}
                      {calculando && !cargandoAsociados && <span style={{ fontSize:"10px", color:"#7ab2d4", fontStyle:"italic" }}>⏳ calculando...</span>}
                    </div>

                    {!cargandoAsociados && asociados.length === 0 && (
                      <div className="asociado-empty">Sin artículos asociados para este modelo</div>
                    )}

                    {asociados.map((a, i) => {
                      const tieneParciales = a.parciales && Object.keys(a.parciales).length > 0;
                      const expandido      = parcialesExpandidos[`${a.slot}`];
                      const mg             = parseFloat(a.margen) || 1;
                      const montoMargen    = a.resultadoBase > 0 ? Math.round(a.resultadoBase * mg) - a.resultadoBase : 0;
                      return (
                        <div key={i}>
                          {/* Fila principal */}
                          <div className="asociado-row" style={{ gridTemplateColumns: "1fr 110px auto", gap: 8 }}>
                            {/* Nombre + info */}
                            <div
                              style={{ cursor: tieneParciales ? "pointer" : "default" }}
                              onClick={() => tieneParciales && setParcialesExpandidos(prev => ({
                                ...prev, [`${a.slot}`]: !prev[`${a.slot}`]
                              }))}
                            >
                              <div className="asociado-nombre">
                                {tieneParciales && (
                                  <span style={{ marginRight:5, color:"#2d7fc1", fontSize:11 }}>
                                    {expandido ? "▾" : "▸"}
                                  </span>
                                )}
                                {a.art}
                              </div>
                              <div className="asociado-cod">
                                {a.cod}
                                {a.codform
                                  ? <span style={{ marginLeft:6, background:"#fef3c7", color:"#92400e", borderRadius:3, padding:"1px 5px", fontSize:10, fontWeight:700 }}>{a.codform}</span>
                                  : <span style={{ marginLeft:6, background:"#fdf0f0", color:"#c0392b", borderRadius:3, padding:"1px 5px", fontSize:10 }}>sin fórmula</span>
                                }
                              </div>
                              {a.precio > 0 && (
                                <div style={{ fontSize:"10px", color:"#6a8aa0", marginTop:2 }}>
                                  Precio BD: {formatPeso(a.precio)}
                                </div>
                              )}
                              {/* Base de fórmula sin margen */}
                              {a.resultadoBase > 0 && mg !== 1 && (
                                <div style={{ fontSize:"10px", color:"#6a8aa0", marginTop:1, fontFamily:"monospace" }}>
                                  Base: {formatPeso(a.resultadoBase)} × {mg} = <strong style={{ color:"#2d7fc1" }}>{formatPeso(a.resultado)}</strong>
                                </div>
                              )}
                              {a.error && a.error !== "Sin fórmula" && (
                                <div className="asociado-error">⚠️ {a.error}</div>
                              )}
                            </div>

                            {/* Margen editable */}
                            <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                              <span style={{ fontSize:"9px", fontWeight:700, color:"#6a8aa0", textTransform:"uppercase", letterSpacing:".06em" }}>
                                Margen %
                              </span>
                              <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                                <input
                                  type="number" min="0" max="999" step="0.1"
                                  value={a.margen}
                                  onChange={e => setAsociados(prev => prev.map((x, j) =>
                                    j === i ? { ...x, margen: e.target.value } : x
                                  ))}
                                  style={{
                                    width:"60px", padding:"4px 6px", border:"1.5px solid #d0dde8",
                                    borderRadius:5, fontFamily:"monospace", fontSize:12,
                                    color:"#059669", fontWeight:700, outline:"none",
                                    background: String(a.margen) !== String(a.margenBD) ? "#fffbea" : "#fff",
                                    borderColor: String(a.margen) !== String(a.margenBD) ? "#f59e0b" : "#d0dde8",
                                  }}
                                />
                                {String(a.margen) !== String(a.margenBD) && (
                                  <span
                                    title={`Restaurar BD: ${a.margenBD}%`}
                                    onClick={() => setAsociados(prev => prev.map((x, j) =>
                                      j === i ? { ...x, margen: x.margenBD } : x
                                    ))}
                                    style={{ fontSize:10, cursor:"pointer", color:"#856404", background:"#fff3cd", border:"1px solid #ffc107", borderRadius:3, padding:"1px 5px" }}
                                  >↩ BD</span>
                                )}
                              </div>
                            </div>

                            {/* Resultado final */}
                            <div className="asociado-resultado" style={{ alignSelf:"center" }}>
                              {a.resultado > 0
                                ? formatPeso(a.resultado)
                                : a.error
                                  ? <span style={{ color:"#c0392b", fontSize:11 }}>—</span>
                                  : "—"
                              }
                            </div>
                          </div>

                          {/* Parciales expandidos */}
                          {tieneParciales && expandido && (
                            <div style={{ background:"#eaf3fb", borderTop:"1px solid #d8ecf7", padding:"6px 14px 8px 24px" }}>
                              {Object.entries(a.parciales).map(([nombre, valor]) => (
                                <div key={nombre} style={{ display:"flex", justifyContent:"space-between", padding:"3px 0", borderBottom:"1px solid #d8ecf7", fontSize:11, color:"#2a4a60" }}>
                                  <span style={{ fontFamily:"monospace", color:"#4a8ab5" }}>{nombre}</span>
                                  <span style={{ fontFamily:"monospace", fontWeight:600 }}>
                                    {typeof valor === "number" ? formatPeso(Math.round(valor)) : String(valor)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Cantidad */}
                <div className="field">
                  <span className="label-text">CANTIDAD</span>
                  <input
                    className="input"
                    type="number"
                    min="1"
                    value={form.cantidad}
                    onChange={(e) => setForm({ ...form, cantidad: Number(e.target.value) })}
                  />
                </div>

                {/* Ancho / Alto */}
                <div className="row">
                  <div className="field">
                    <span className="label-text">ANCHO (CM)</span>
                    <input
                      className="input"
                      type="number"
                      value={form.ancho}
                      onChange={(e) => setForm({ ...form, ancho: Number(e.target.value) })}
                    />
                  </div>
                  <div className="field">
                    <span className="label-text">ALTO (CM)</span>
                    <input
                      className="input"
                      type="number"
                      value={form.alto}
                      onChange={(e) => setForm({ ...form, alto: Number(e.target.value) })}
                    />
                  </div>
                </div>

                {/* Tipo de vidrio */}
                <div className="field">
                  <span className="label-text">TIPO DE VIDRIO</span>
                  <div className="toggle-row">
                    {["incoloro", "esmerilado"].map(v => (
                      <button
                        key={v}
                        type="button"
                        className={`toggle-btn${form.vidrio === v ? " active" : ""}`}
                        onClick={() => setForm({ ...form, vidrio: v })}
                      >
                        {v === "incoloro" ? "⬜ Incoloro" : "🔲 Esmerilado"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Colocación */}
                <div className="field">
                  <span className="label-text" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>COLOCACIÓN ($)</span>
                    {colocacionBD !== null && (
                      <span
                        style={{
                          fontSize: "10px", fontFamily: "'Source Sans 3', sans-serif", fontWeight: 600,
                          background: Number(form.colocacion) !== colocacionBD ? "#fff3cd" : "#eaf3fb",
                          color: Number(form.colocacion) !== colocacionBD ? "#856404" : "#2d7fc1",
                          border: `1px solid ${Number(form.colocacion) !== colocacionBD ? "#ffc107" : "#b8d6ef"}`,
                          borderRadius: "4px", padding: "1px 7px", letterSpacing: "0.04em",
                          cursor: Number(form.colocacion) !== colocacionBD ? "pointer" : "default",
                        }}
                        title={Number(form.colocacion) !== colocacionBD ? `Click para restaurar al valor de BD ($${colocacionBD})` : "Valor de BD"}
                        onClick={() => Number(form.colocacion) !== colocacionBD && setForm(prev => ({ ...prev, colocacion: colocacionBD }))}
                      >
                        {Number(form.colocacion) !== colocacionBD
                          ? `⚠️ BD: $${colocacionBD} — restaurar`
                          : `📊 BD: $${colocacionBD}`}
                      </span>
                    )}
                  </span>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    value={form.colocacion}
                    onChange={(e) => setForm({ ...form, colocacion: Number(e.target.value) })}
                  />
                </div>

                {/* Breakdown */}
                <div className="breakdown">
                  {calculando && (
                    <div style={{ padding: "8px 16px", fontSize: "12px", color: "#4a8ab5", fontStyle: "italic", borderBottom: "1px solid #e0eaf2" }}>
                      ⏳ Recalculando...
                    </div>
                  )}

                  {/* Una fila por cada artículo asociado con resultado */}
                  {asociados.filter(a => a.resultado > 0).map(a => {
                    const tieneParciales = a.parciales && Object.keys(a.parciales).length > 0;
                    const expandido      = parcialesExpandidos[`bd_${a.slot}`];
                    return (
                      <div key={a.slot}>
                        <div
                          className="breakdown-row"
                          style={{ cursor: tieneParciales ? "pointer" : "default" }}
                          onClick={() => tieneParciales && setParcialesExpandidos(prev => ({
                            ...prev, [`bd_${a.slot}`]: !prev[`bd_${a.slot}`]
                          }))}
                        >
                          <span>
                            {tieneParciales && (
                              <span style={{ marginRight: 5, color: "#2d7fc1", fontSize: 11 }}>
                                {expandido ? "▾" : "▸"}
                              </span>
                            )}
                            🔩 {a.art}
                            {a.codform && (
                              <span style={{ marginLeft: 6, fontSize: 11, color: "#92400e", fontFamily: "monospace" }}>
                                ({a.codform})
                              </span>
                            )}
                          </span>
                          <span>{formatPeso(a.resultado)}</span>
                        </div>
                        {tieneParciales && expandido && Object.entries(a.parciales).map(([nombre, valor]) => (
                          <div key={nombre} style={{
                            display: "flex", justifyContent: "space-between",
                            padding: "5px 16px 5px 28px", fontSize: 12,
                            background: "#eaf3fb", borderBottom: "1px solid #d8ecf7", color: "#2a4a60"
                          }}>
                            <span style={{ fontFamily: "monospace", color: "#4a8ab5" }}>{nombre}</span>
                            <span style={{ fontFamily: "monospace", fontWeight: 600 }}>
                              {typeof valor === "number" ? formatPeso(Math.round(valor)) : String(valor)}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  })}

                  {/* Errores de artículos */}
                  {asociados.filter(a => a.error && a.error !== "Sin fórmula").map(a => (
                    <div key={`err_${a.slot}`} className="breakdown-row" style={{ color: "#c0392b" }}>
                      <span>⚠️ {a.art}</span>
                      <span style={{ fontSize: 11 }}>{a.error}</span>
                    </div>
                  ))}

                  {/* Colocación */}
                  {Number(form.colocacion) > 0 && (
                    <div className="breakdown-row">
                      <span>Colocación</span>
                      <span>{formatPeso(form.colocacion)}</span>
                    </div>
                  )}

                  {/* Total */}
                  <div className="total-row">
                    <span className="total-label">TOTAL</span>
                    <span className="total-value">{formatPeso(total)}</span>
                  </div>
                </div>

                {/* Acciones */}
                <div className="actions">
                  <button className="btn btn-cancel" onClick={handleNuevo}>+ Nuevo</button>
                  {errorCalc && (
                    <p style={{ color: "#dc2626", fontSize: "12px", width: "100%", textAlign: "right", marginBottom: 4 }}>
                      ⚠️ {errorCalc}
                    </p>
                  )}
                  {guardadoOk && (
                    <p style={{ color: "#16a34a", fontSize: "12px", width: "100%", textAlign: "right", marginBottom: 4 }}>
                      ✅ {modoEdicion ? `Guardado como Rev. ${revision}` : "Presupuesto guardado correctamente"}
                    </p>
                  )}
                  <button className="btn btn-save" onClick={handleGuardar} disabled={guardando}>
                    {guardando ? "⏳ Guardando..." : "💾 Guardar"}
                  </button>
                  <button className="btn btn-pdf" onClick={handlePDF}>
                    📄 PDF
                  </button>
                  <button className="btn btn-print" onClick={handlePrint}>
                    🖨️ Imprimir
                  </button>
                </div>

              </div>{/* /card */}
            </div>{/* /presup-form-col */}

            {/* Panel foto — derecha en desktop */}
            <div className="foto-panel">
              <div className="foto-panel-title">🪟 Tipo de mampara</div>
              {articuloSeleccionado?.artfoto && articuloSeleccionado.artfoto !== "null" ? (
                <img
                  src={articuloSeleccionado.artfoto}
                  alt={articuloSeleccionado.articulo}
                  className="foto-panel-img"
                />
              ) : (
                <div className="foto-panel-empty">
                  <span>🪟</span>
                  <small>{articuloSeleccionado ? "Sin imagen" : "Seleccioná un tipo"}</small>
                </div>
              )}
              {articuloSeleccionado && (
                <div className="foto-panel-info">
                  <div className="foto-info-row">
                    <span className="foto-info-label">Código</span>
                    <span className="foto-info-value">{articuloSeleccionado.codart}</span>
                  </div>
                  <div className="foto-info-row">
                    <span className="foto-info-label">Tipo</span>
                    <span className="foto-info-value">{busqueda || "—"}</span>
                  </div>
                  {modelo && (
                    <div className="foto-info-row">
                      <span className="foto-info-label">Modelo</span>
                      <span className="foto-info-value">{modelo}</span>
                    </div>
                  )}
                  {articuloSeleccionado?.precio && (
                    <div className="foto-info-row">
                      <span className="foto-info-label">Precio ref.</span>
                      <span className="foto-info-value" style={{ color: "#2d7fc1" }}>
                        ${Number(articuloSeleccionado.precio).toLocaleString("es-AR")}
                      </span>
                    </div>
                  )}
                  {articuloSeleccionado.color && (
                    <div className="foto-info-row">
                      <span className="foto-info-label">Color</span>
                      <span className="foto-info-value">{articuloSeleccionado.color}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>{/* /presup-layout */}

          {/* Contenido oculto para impresión */}
          <div id="presupuesto-print">
            <h2>Presupuesto Mamparas {presupuestoId != null ? `N° ${String(presupuestoId).padStart(5, "0")}` : ""}</h2>
            <p><strong>Cliente:</strong> {form.cliente}</p>
            {busqueda && <p><strong>Tipo:</strong> {busqueda}</p>}
            {modelo && <p><strong>Modelo:</strong> {modelo}</p>}
            <p><strong>Cantidad:</strong> {form.cantidad}</p>
            <p><strong>Dimensiones:</strong> {form.ancho} cm × {form.alto} cm</p>
            <p><strong>Tipo de vidrio:</strong> {form.vidrio}</p>
            <table>
              <tbody>
                {asociados.filter(a => a.resultado > 0).map(a => (
                  <tr key={a.slot}>
                    <td>{a.art}</td>
                    <td>{formatPeso(a.resultado)}</td>
                  </tr>
                ))}
                {Number(form.colocacion) > 0 && (
                  <tr><td>Colocación</td><td>{formatPeso(form.colocacion)}</td></tr>
                )}
                <tr className="total-row"><td>TOTAL</td><td>{formatPeso(total)}</td></tr>
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </>
  );
}
