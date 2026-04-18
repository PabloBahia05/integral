import { useState, useEffect } from "react";

const API = "http://localhost:3001";

const CAJON_EMPTY = { ancho: "", alto: "", prof: "" };

export default function ArmarVanitory({ modelo: modeloRaw, onVolver }) {
  const modelo = modeloRaw
    ? { ...modeloRaw, codart: modeloRaw.codart ?? modeloRaw.codtipvan ?? null }
    : null;

  const [presupuestoId, setPresupuestoId] = useState("");

  const [form, setForm] = useState({
    cliente:           "",
    cantidad:          1,
    ancho:             60,
    alto:              50,
    profundo:          45,
    colocacion:        0,
    material:          "",
    materialPrecio:    0,
    corredera:         "",
    correderaPrecio:   0,
    correderaCantidad: 1,
    margen:            0,
    cajon1: { ...CAJON_EMPTY },
    cajon2: { ...CAJON_EMPTY },
    cajon3: { ...CAJON_EMPTY },
    puerta1: { ancho: "", alto: "" },
    puerta2: { ancho: "", alto: "" },
    intermedios: "",
  });

  const [result, setResult]             = useState({ subtotal: 0 });
  const [calculando, setCalculando]     = useState(false);
  const [errorCalc, setErrorCalc]       = useState("");
  const [guardando, setGuardando]       = useState(false);
  const [guardadoOk, setGuardadoOk]     = useState(false);
  const [colocacionBD, setColocacionBD] = useState(null);
  const [margenBD, setMargenBD]         = useState(null);
  const [insumosMuebles, setInsumosMuebles] = useState([]);
  const [herrajes, setHerrajes]             = useState([]);
  const [cargandoInsumos, setCargandoInsumos] = useState(false);

  // Próximo número — se carga al montar y muestra el siguiente disponible
  useEffect(() => {
    fetch(`${API}/presupuestos-vanitory/proximo-numero`)
      .then(r => r.json())
      .then(d => {
        const n = d?.proximo ?? d?.siguiente ?? d?.next ?? null;
        if (n != null) setPresupuestoId(String(n).padStart(4, "0"));
        else {
          // Fallback: traer todos y tomar el máximo
          fetch(`${API}/presupuestos-vanitory`)
            .then(r => r.json())
            .then(rows => {
              const max = Array.isArray(rows) && rows.length
                ? Math.max(...rows.map(r => Number(r.NUMERO ?? r.id ?? 0)))
                : 0;
              setPresupuestoId(String(max + 1).padStart(4, "0"));
            })
            .catch(() => setPresupuestoId("0001"));
        }
      })
      .catch(() => setPresupuestoId("0001"));
  }, []);

  // Colocación desde BD
  useEffect(() => {
    if (!modelo?.codart) return;
    fetch(`${API}/colocacion/buscar?codart=${encodeURIComponent(modelo.codart)}`)
      .then(r => r.json())
      .then(d => {
        const precio = d?.precio != null ? parseFloat(d.precio) : null;
        if (precio !== null && !isNaN(precio)) { setColocacionBD(precio); setForm(prev => ({ ...prev, colocacion: precio })); }
        else setColocacionBD(null);
      })
      .catch(() => setColocacionBD(null));
  }, [modelo?.codart]);

  // Margen desde BD
  useEffect(() => {
    if (!modelo?.codart) return;
    fetch(`${API}/margenes?codart=${encodeURIComponent(modelo.codart)}`)
      .then(r => r.json())
      .then(d => {
        const row = Array.isArray(d) ? d[0] : d;
        const raw = row?.MARGEN != null ? parseFloat(row.MARGEN) : null;
        const margen = raw !== null && !isNaN(raw) ? Math.round((raw - 1) * 100 * 100) / 100 : null;
        if (margen !== null && !isNaN(margen)) { setMargenBD(margen); setForm(prev => ({ ...prev, margen })); }
        else setMargenBD(null);
      })
      .catch(() => setMargenBD(null));
  }, [modelo?.codart]);

  // Materiales y correderas
  useEffect(() => {
    setCargandoInsumos(true);
    Promise.all([
      fetch(`${API}/productos?rubro=${encodeURIComponent("MUEBLES")}&familia=${encodeURIComponent("INSUMOS")}&limit=500`)
        .then(r => r.json()).then(d => Array.isArray(d) ? d : []).catch(() => []),
      fetch(`${API}/productos?familia=${encodeURIComponent("HERRAJES")}&limit=500`)
        .then(r => r.json())
        .then(d => (Array.isArray(d) ? d : []).filter(p => (p.articulo ?? "").toLowerCase().includes("guia")))
        .catch(() => []),
    ]).then(([mats, her]) => { setInsumosMuebles(mats); setHerrajes(her); })
      .finally(() => setCargandoInsumos(false));
  }, []);

  // Calcular fórmula
  const calcular = async () => {
    if (!modelo?.codart && !modelo?.custom) { setErrorCalc("Este modelo no tiene código de artículo configurado."); return; }
    if (modelo?.custom) { setResult({ subtotal: 0 }); return; }
    setErrorCalc("");
    setCalculando(true);
    const { ancho, alto, profundo, cantidad, colocacion, materialPrecio } = form;
    try {
      const res = await fetch(`${API}/formulas/calcular`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codart_modelo: modelo.codart,
          variables: { ancho, alto, profundo, profundidad: profundo, cantidad, colocacion,
            precio_material: Number(materialPrecio) || 0,
            precio_base: modelo?.PRECIO_BASE ? parseFloat(modelo.PRECIO_BASE) : 0 },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult({ subtotal: data.resultado });
    } catch (err) { setErrorCalc(err.message); }
    finally { setCalculando(false); }
  };

  useEffect(() => {
    if (!modelo?.codart) return;
    calcular();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelo?.codart, form.ancho, form.alto, form.profundo, form.cantidad, form.colocacion, form.materialPrecio]);

  // Totales
  const totalCorredera = (Number(form.correderaPrecio) || 0) * (Number(form.correderaCantidad) || 1);
  const totalMaterial  = Number(form.materialPrecio) || 0;
  const baseMargen     = result.subtotal + totalCorredera;
  const totalMargen    = baseMargen * (Number(form.margen) || 0) / 100;
  const total          = baseMargen + totalMargen + Number(form.colocacion);

  const formatPeso = (n) => "$" + Number(n).toLocaleString("es-AR").replace(/,/g, ".");

  // Helper para actualizar un cajón
  const setCajon = (num, field, val) =>
    setForm(prev => ({
      ...prev,
      [`cajon${num}`]: { ...prev[`cajon${num}`], [field]: val === "" ? "" : Number(val) },
    }));

  // Helper para actualizar una puerta
  const setPuerta = (num, field, val) =>
    setForm(prev => ({
      ...prev,
      [`puerta${num}`]: { ...prev[`puerta${num}`], [field]: val === "" ? "" : Number(val) },
    }));

  // Guardar
  const handleGuardar = async () => {
    if (!form.cliente.trim()) { setErrorCalc("Ingresá el nombre del cliente."); return; }
    setGuardando(true); setErrorCalc(""); setGuardadoOk(false);
    const payload = {
      NOMBRE: form.cliente, FECHA: new Date().toISOString().slice(0, 10),
      CANTIDAD: Number(form.cantidad), MODELO: modelo?.nombre ?? "Personalizado",
      ANCHO: Number(form.ancho), ALTO: Number(form.alto), PROFUNDO: Number(form.profundo),
      COLOCACION: Number(form.colocacion), MATERIAL: form.material || null,
      MATERIAL_PRECIO: Number(form.materialPrecio) || 0, CORREDERA: form.corredera || null,
      CORREDERA_PRECIO: Number(form.correderaPrecio) || 0,
      CORREDERA_CANTIDAD: Number(form.correderaCantidad) || 1,
      MARGEN: Number(form.margen) || 0, PRECIO: Number(total), REVISION: 0,
      // Cajones
      AHJ1: form.cajon1.ancho !== "" ? Number(form.cajon1.ancho) : null,
      ALJ1: form.cajon1.alto  !== "" ? Number(form.cajon1.alto)  : null,
      PRJ1: form.cajon1.prof  !== "" ? Number(form.cajon1.prof)  : null,
      AHJ2: form.cajon2.ancho !== "" ? Number(form.cajon2.ancho) : null,
      ALJ2: form.cajon2.alto  !== "" ? Number(form.cajon2.alto)  : null,
      PRJ2: form.cajon2.prof  !== "" ? Number(form.cajon2.prof)  : null,
      AHJ3: form.cajon3.ancho !== "" ? Number(form.cajon3.ancho) : null,
      ALJ3: form.cajon3.alto  !== "" ? Number(form.cajon3.alto)  : null,
      PRJ3: form.cajon3.prof  !== "" ? Number(form.cajon3.prof)  : null,
      // Puertas
      AHPTA1: form.puerta1.ancho !== "" ? Number(form.puerta1.ancho) : null,
      ALPTA1: form.puerta1.alto  !== "" ? Number(form.puerta1.alto)  : null,
      AHPTA2: form.puerta2.ancho !== "" ? Number(form.puerta2.ancho) : null,
      ALPTA2: form.puerta2.alto  !== "" ? Number(form.puerta2.alto)  : null,
      // Intermedios
      INT: form.intermedios !== "" ? Number(form.intermedios) : null,
    };
    try {
      const res = await fetch(`${API}/presupuestos-vanitory`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al guardar");
      setGuardadoOk(true);
      fetch(`${API}/presupuestos-vanitory/proximo-numero`).then(r => r.json())
        .then(d => { const n = d?.proximo ?? null; if (n != null) setPresupuestoId(String(n).padStart(4, "0")); }).catch(() => {});
      setTimeout(() => setGuardadoOk(false), 3000);
    } catch (err) { setErrorCalc(err.message); }
    finally { setGuardando(false); }
  };

  // PDF
  const handlePDF = () => {
    const fecha = new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" });
    const nro   = presupuestoId ? presupuestoId.padStart(4, "0") : "----";
    const cajonRow = (n, c) => {
      if (c.ancho === "" && c.alto === "" && c.prof === "") return "";
      return `<div class="info-row"><span class="info-label">Cajón ${n}</span><span class="info-value">${c.ancho !== "" ? `Ancho: ${c.ancho} cm` : ""}${c.alto !== "" ? ` · Alto: ${c.alto} cm` : ""}${c.prof !== "" ? ` · Prof: ${c.prof} cm` : ""}</span></div>`;
    };
    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/>
<title>Armar Vanitory N° ${nro}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Source+Sans+3:wght@300;400;600;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}body{font-family:'Source Sans 3',Arial,sans-serif;background:#fff;color:#1a2a3a;font-size:13px}
  .page{width:794px;min-height:1123px;margin:0 auto;display:flex;flex-direction:column}
  .header{background:#0f2944;color:#fff;padding:32px 48px 28px;display:flex;justify-content:space-between;align-items:flex-start}
  .company-name{font-family:'Rajdhani',sans-serif;font-size:28px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
  .doc-title{font-family:'Rajdhani',sans-serif;font-size:24px;font-weight:700;color:#60b4f0;text-transform:uppercase;letter-spacing:.1em}
  .doc-nro{font-family:'Rajdhani',sans-serif;font-size:40px;font-weight:700;color:#fff}
  .doc-fecha{font-size:11px;color:#7ab2d4;margin-top:6px}
  .accent-bar{height:4px;background:linear-gradient(90deg,#2d7fc1,#60b4f0,#2d7fc1)}
  .body{padding:36px 48px;flex:1}
  .info-box{border:1px solid #d0dde8;border-radius:6px;padding:16px 20px;margin-bottom:16px}
  .info-box-title{font-family:'Rajdhani',sans-serif;font-size:10px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#2d7fc1;margin-bottom:10px;border-bottom:1px solid #e8f0f7;padding-bottom:6px}
  .info-row{display:flex;justify-content:space-between;padding:4px 0;font-size:13px}
  .info-label{color:#6a8aa0}.info-value{font-weight:600;color:#0f2944}
  .totals-wrap{display:flex;justify-content:flex-end;margin-top:24px}
  .totals-box{width:280px}
  .totals-row{display:flex;justify-content:space-between;padding:8px 14px;font-size:13px;border-bottom:1px solid #e8f0f7}
  .totals-total{display:flex;justify-content:space-between;padding:13px 16px;background:#0f2944;border-radius:4px;margin-top:4px}
  .totals-total .t-label{color:#a8c4d8;font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:700;letter-spacing:.14em}
  .totals-total .t-value{color:#fff;font-family:'Rajdhani',sans-serif;font-size:20px;font-weight:700}
  .footer{background:#f0f6fb;border-top:2px solid #d0dde8;padding:20px 48px;display:flex;justify-content:space-between;align-items:center;margin-top:auto}
  .footer-brand{font-family:'Rajdhani',sans-serif;font-size:14px;font-weight:700;color:#0f2944}
</style></head><body>
<div class="page">
  <div class="header">
    <div><div class="company-name">🛁 Vanitorys & Muebles</div><div style="font-size:11px;color:#7ab2d4;margin-top:6px">Bahía Blanca, Buenos Aires · 291-000-0000</div></div>
    <div style="text-align:right"><div class="doc-title">Armar Vanitory</div><div class="doc-nro">N° ${nro}</div><div class="doc-fecha">Fecha: ${fecha}</div></div>
  </div>
  <div class="accent-bar"></div>
  <div class="body">
    <div class="info-box">
      <div class="info-box-title">Detalle del pedido</div>
      <div class="info-row"><span class="info-label">Cliente</span><span class="info-value">${form.cliente || "—"}</span></div>
      <div class="info-row"><span class="info-label">Modelo</span><span class="info-value">${modelo?.nombre ?? "Personalizado"}</span></div>
      <div class="info-row"><span class="info-label">Cantidad</span><span class="info-value">${form.cantidad} unidad(es)</span></div>
      <div class="info-row"><span class="info-label">Medidas generales</span><span class="info-value">${form.ancho} × ${form.alto} × ${form.profundo} cm</span></div>
      ${form.material ? `<div class="info-row"><span class="info-label">Material</span><span class="info-value">${form.material}</span></div>` : ""}
      ${form.corredera ? `<div class="info-row"><span class="info-label">Correderas</span><span class="info-value">${form.corredera} × ${form.correderaCantidad} u.</span></div>` : ""}
    </div>
    <div class="info-box">
      <div class="info-box-title">📦 Medidas de cajones</div>
      ${cajonRow(1, form.cajon1)}${cajonRow(2, form.cajon2)}${cajonRow(3, form.cajon3)}
    </div>
    <div class="info-box">
      <div class="info-box-title">🚪 Puertas e intermedios</div>
      ${form.puerta1.ancho !== "" || form.puerta1.alto !== "" ? `<div class="info-row"><span class="info-label">Puerta 1</span><span class="info-value">${form.puerta1.ancho !== "" ? `Ancho: ${form.puerta1.ancho} cm` : ""}${form.puerta1.alto !== "" ? ` · Alto: ${form.puerta1.alto} cm` : ""}</span></div>` : ""}
      ${form.puerta2.ancho !== "" || form.puerta2.alto !== "" ? `<div class="info-row"><span class="info-label">Puerta 2</span><span class="info-value">${form.puerta2.ancho !== "" ? `Ancho: ${form.puerta2.ancho} cm` : ""}${form.puerta2.alto !== "" ? ` · Alto: ${form.puerta2.alto} cm` : ""}</span></div>` : ""}
      ${form.intermedios !== "" ? `<div class="info-row"><span class="info-label">Intermedios</span><span class="info-value">${form.intermedios}</span></div>` : ""}
    </div>
    <div class="totals-wrap"><div class="totals-box">
      <div class="totals-row"><span style="color:#6a8aa0">Subtotal</span><span style="font-weight:600">${formatPeso(result.subtotal)}</span></div>
      ${Number(form.colocacion) > 0 ? `<div class="totals-row"><span style="color:#6a8aa0">Colocación</span><span style="font-weight:600">${formatPeso(form.colocacion)}</span></div>` : ""}
      ${totalCorredera > 0 ? `<div class="totals-row"><span style="color:#6a8aa0">Correderas</span><span style="font-weight:600">${formatPeso(totalCorredera)}</span></div>` : ""}
      ${totalMargen > 0 ? `<div class="totals-row"><span style="color:#6a8aa0">Margen (${form.margen}%)</span><span style="font-weight:600">${formatPeso(totalMargen)}</span></div>` : ""}
      <div class="totals-total"><span class="t-label">TOTAL</span><span class="t-value">${formatPeso(total)}</span></div>
    </div></div>
  </div>
  <div class="footer">
    <div><div class="footer-brand">Vanitorys & Muebles</div>Bahía Blanca, Buenos Aires · 291-000-0000</div>
    <div style="text-align:right;font-size:11px;color:#6a8aa0">N° ${nro}<br/>Emitido el ${fecha}</div>
  </div>
</div></body></html>`;
    const win = window.open("", "_blank");
    if (!win) { alert("Habilitá las ventanas emergentes para generar el PDF."); return; }
    win.document.write(html); win.document.close(); win.focus();
    setTimeout(() => win.print(), 800);
  };

  // ─── Componente cajón ───────────────────────────────────────────────────────
  const SeccionCajon = ({ numero }) => {
    const c = form[`cajon${numero}`];
    const tieneAlgo = c.ancho !== "" || c.alto !== "" || c.prof !== "";
    const inp = (field, label, cod) => (
      <div style={{ flex: 1 }}>
        <span style={{ display: "block", fontFamily: "'Rajdhani',sans-serif", fontSize: 10, fontWeight: 700,
          letterSpacing: "0.12em", color: "#4a8ab5", textTransform: "uppercase", marginBottom: 5 }}>
          {label} <span style={{ color: "#94a3b8", fontSize: 9 }}>({cod})</span>
        </span>
        <input
          className="input"
          type="number" min="0" placeholder="cm"
          value={c[field]}
          onChange={e => setCajon(numero, field, e.target.value)}
          style={{ textAlign: "center" }}
        />
      </div>
    );
    return (
      <div style={{ border: `1.5px solid ${tieneAlgo ? "#2d7fc1" : "#d0dde8"}`, borderRadius: 8, overflow: "hidden", transition: "border-color 0.2s" }}>
        <div style={{ background: tieneAlgo ? "#0f2944" : "#f4f8fb", padding: "10px 16px", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 15 }}>📦</span>
          <span style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 800, fontSize: 14,
            letterSpacing: "0.08em", color: tieneAlgo ? "#fff" : "#4a6a80", textTransform: "uppercase" }}>
            Cajón {numero}
          </span>
          {tieneAlgo && (
            <span style={{ marginLeft: "auto", fontSize: 10, background: "#2d7fc1", color: "#fff",
              borderRadius: 4, padding: "2px 8px", fontWeight: 700, letterSpacing: "0.06em" }}>
              CARGADO
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 12, padding: "14px 16px", background: "#fff" }}>
          {inp("ancho", "Ancho cajón", `AHJ${numero}`)}
          {inp("alto",  "Alto cajón",  `ALJ${numero}`)}
          {inp("prof",  "Prof. cajón", `PRJ${numero}`)}
        </div>
      </div>
    );
  };

  // ─── Componente puerta ──────────────────────────────────────────────────────
  const SeccionPuerta = ({ numero }) => {
    const p = form[`puerta${numero}`];
    const tieneAlgo = p.ancho !== "" || p.alto !== "";
    const inp = (field, label, cod) => (
      <div style={{ flex: 1 }}>
        <span style={{ display: "block", fontFamily: "'Rajdhani',sans-serif", fontSize: 10, fontWeight: 700,
          letterSpacing: "0.12em", color: "#7c3aed", textTransform: "uppercase", marginBottom: 5 }}>
          {label} <span style={{ color: "#94a3b8", fontSize: 9 }}>({cod})</span>
        </span>
        <input
          className="input"
          type="number" min="0" placeholder="cm"
          value={p[field]}
          onChange={e => setPuerta(numero, field, e.target.value)}
          style={{ textAlign: "center" }}
        />
      </div>
    );
    return (
      <div style={{ border: `1.5px solid ${tieneAlgo ? "#7c3aed" : "#d0dde8"}`, borderRadius: 8, overflow: "hidden", transition: "border-color 0.2s" }}>
        <div style={{ background: tieneAlgo ? "#4c1d95" : "#f9f7ff", padding: "10px 16px", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 15 }}>🚪</span>
          <span style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 800, fontSize: 14,
            letterSpacing: "0.08em", color: tieneAlgo ? "#fff" : "#4a6a80", textTransform: "uppercase" }}>
            Puerta {numero}
          </span>
          {tieneAlgo && (
            <span style={{ marginLeft: "auto", fontSize: 10, background: "#7c3aed", color: "#fff",
              borderRadius: 4, padding: "2px 8px", fontWeight: 700, letterSpacing: "0.06em" }}>
              CARGADO
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 12, padding: "14px 16px", background: "#fff" }}>
          {inp("ancho", "Ancho puerta", `AHPTA${numero}`)}
          {inp("alto",  "Alto puerta",  `ALPTA${numero}`)}
        </div>
      </div>
    );
  };

  // ─── UI ────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Source+Sans+3:wght@300;400;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:#e8f0f7;font-family:'Source Sans 3',sans-serif}
        .pv-layout{min-height:100vh;background:#e8f0f7}
        .pv-main{display:flex;align-items:flex-start;justify-content:center;padding:40px 24px;gap:24px;flex-wrap:wrap}
        .pv-form-col{flex:1;min-width:320px;max-width:560px}
        .pv-card{background:#fff;border-radius:10px;padding:32px 36px;width:100%;box-shadow:0 2px 16px rgba(15,41,68,.08)}
        .pv-back{background:none;border:none;cursor:pointer;color:#4a8ab5;font-size:13px;font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:.08em;margin-bottom:20px;display:flex;align-items:center;gap:6px;padding:0}
        .pv-back:hover{color:#0f2944}
        .field{margin-bottom:20px}
        .label-text{display:block;font-family:'Rajdhani',sans-serif;font-size:11px;font-weight:700;letter-spacing:.14em;color:#4a8ab5;margin-bottom:6px}
        .input{width:100%;border:1.5px solid #d0dde8;border-radius:6px;padding:10px 14px;font-size:15px;color:#0f2944;outline:none;transition:border-color .15s;font-family:'Source Sans 3',sans-serif}
        .input:focus{border-color:#2d7fc1}
        .row{display:flex;gap:16px}
        .row .field{flex:1}
        .presup-badge{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;padding-bottom:18px;border-bottom:1.5px solid #e0eaf2}
        .presup-badge-title{font-family:'Rajdhani',sans-serif;font-size:18px;font-weight:700;color:#0f2944;letter-spacing:.06em;text-transform:uppercase}
        .presup-badge-num{font-family:'Rajdhani',sans-serif;font-size:22px;font-weight:700;color:#2d7fc1;background:#eaf3fb;border:1.5px solid #b8d6ef;border-radius:6px;padding:4px 16px;min-width:100px;text-align:center}
        .breakdown{background:#f4f8fb;border-radius:8px;overflow:hidden;margin-bottom:24px}
        .breakdown-row{display:flex;justify-content:space-between;padding:12px 16px;font-size:14px;color:#4a6a80;border-bottom:1px solid #e0eaf2}
        .total-row{display:flex;justify-content:space-between;align-items:center;padding:14px 16px;background:#0f2944;color:#fff}
        .total-label{font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:700;letter-spacing:.14em}
        .total-value{font-family:'Rajdhani',sans-serif;font-size:22px;font-weight:700}
        .actions{display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end}
        .btn{padding:11px 20px;border-radius:6px;border:none;cursor:pointer;font-family:'Rajdhani',sans-serif;font-size:14px;font-weight:700;letter-spacing:.06em;display:flex;align-items:center;gap:7px;transition:all .15s}
        .btn-cancel{background:transparent;border:1.5px solid #d0dde8;color:#4a6a80}
        .btn-cancel:hover{border-color:#4a8ab5;color:#0f2944}
        .btn-save{background:#16a34a;color:#fff}
        .btn-save:hover{background:#15803d}
        .btn-pdf{background:#dc2626;color:#fff}
        .btn-pdf:hover{background:#b91c1c}
        .btn-print{background:#7c3aed;color:#fff}
        .btn-print:hover{background:#6d28d9}
        .foto-panel{background:#fff;border-radius:10px;box-shadow:0 2px 16px rgba(15,41,68,.08);padding:24px;display:flex;flex-direction:column;align-items:center;min-width:220px;max-width:280px;align-self:flex-start;position:sticky;top:40px}
        .foto-panel-title{font-family:'Rajdhani',sans-serif;font-size:11px;font-weight:700;letter-spacing:.14em;color:#4a8ab5;text-transform:uppercase;margin-bottom:14px;align-self:flex-start}
        .foto-panel-img{width:100%;max-height:220px;object-fit:contain;border-radius:8px;border:1px solid #e0eaf2;background:#f7fafd}
        .foto-panel-empty{width:100%;height:180px;border:2px dashed #d0dde8;border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#b0c8d8}
        .foto-info-row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f0f4f8;font-size:12px;width:100%}
        .foto-info-label{color:#6a8aa0}
        .foto-info-value{font-weight:600;color:#0f2944}
        .cajones-title{font-family:'Rajdhani',sans-serif;font-size:12px;font-weight:700;letter-spacing:.14em;color:#0f2944;text-transform:uppercase;display:flex;align-items:center;gap:8px;border-bottom:2px solid #e0eaf2;padding-bottom:8px;margin-bottom:14px;margin-top:4px}
      `}</style>

      <div className="pv-layout">
        <main className="pv-main">
          <div className="pv-form-col">
            <div className="pv-card">
              <button className="pv-back" onClick={onVolver}>← Volver a modelos</button>

              <div className="presup-badge">
                <span className="presup-badge-title">🛁 Armar Vanitory</span>
                <span className="presup-badge-num">{presupuestoId ? `N° ${presupuestoId}` : "N° —"}</span>
              </div>

              {/* Cliente */}
              <div className="field">
                <span className="label-text">NOMBRE / CLIENTE *</span>
                <input className="input" value={form.cliente}
                  onChange={e => setForm({ ...form, cliente: e.target.value })} />
              </div>

              {/* Material */}
              <div className="field">
                <span className="label-text">
                  🪵 MATERIAL
                  {form.material && <span style={{ marginLeft: 8, fontSize: "10px", color: "#2d7fc1", fontWeight: 600 }}>{formatPeso(totalMaterial)}</span>}
                </span>
                {cargandoInsumos ? <div style={{ fontSize: "12px", color: "#4a8ab5", fontStyle: "italic", padding: "10px 0" }}>⏳ Cargando...</div> : (
                  <select className="input" style={{ cursor: "pointer" }} value={form.material}
                    onChange={e => { const sel = insumosMuebles.find(p => p.articulo === e.target.value); setForm(prev => ({ ...prev, material: e.target.value, materialPrecio: sel ? parseFloat(sel.precio) || 0 : 0 })); }}>
                    <option value="">— Sin material —</option>
                    {insumosMuebles.map((p, i) => (
                      <option key={p.id ?? p.codart ?? i} value={p.articulo}>
                        {p.codart ? `[${p.codart}] ` : ""}{p.articulo}{p.precio != null ? ` — $${parseFloat(p.precio).toLocaleString("es-AR")}` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Correderas */}
              <div className="field">
                <span className="label-text">
                  🔩 CORREDERAS
                  {form.corredera && <span style={{ marginLeft: 8, fontSize: "10px", color: "#2d7fc1", fontWeight: 600 }}>{formatPeso(totalCorredera)}</span>}
                </span>
                {cargandoInsumos ? <div style={{ fontSize: "12px", color: "#4a8ab5", fontStyle: "italic", padding: "10px 0" }}>⏳ Cargando...</div> : (
                  <select className="input" style={{ cursor: "pointer" }} value={form.corredera}
                    onChange={e => { const sel = herrajes.find(p => p.articulo === e.target.value); setForm(prev => ({ ...prev, corredera: e.target.value, correderaPrecio: sel ? parseFloat(sel.precio) || 0 : 0 })); }}>
                    <option value="">— Sin correderas —</option>
                    {herrajes.map((p, i) => (
                      <option key={p.id ?? p.codart ?? i} value={p.articulo}>
                        {p.articulo}{p.precio != null ? ` — $${parseFloat(p.precio).toLocaleString("es-AR")}` : ""}
                      </option>
                    ))}
                  </select>
                )}
                {form.corredera && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                    <span className="label-text" style={{ margin: 0 }}>CANTIDAD</span>
                    <input className="input" type="number" min="1" style={{ width: 80, textAlign: "center" }}
                      value={form.correderaCantidad}
                      onChange={e => setForm(prev => ({ ...prev, correderaCantidad: Math.max(1, Number(e.target.value)) }))} />
                    <span style={{ fontSize: "12px", color: "#6a8aa0" }}>× {formatPeso(form.correderaPrecio)} c/u</span>
                  </div>
                )}
              </div>

              {/* Cantidad */}
              <div className="field">
                <span className="label-text">CANTIDAD</span>
                <input className="input" type="number" min="1" value={form.cantidad}
                  onChange={e => setForm({ ...form, cantidad: Number(e.target.value) })} />
              </div>

              {/* Dimensiones generales */}
              <div className="row">
                <div className="field">
                  <span className="label-text">ANCHO (CM)</span>
                  <input className="input" type="number" value={form.ancho} onChange={e => setForm({ ...form, ancho: Number(e.target.value) })} />
                </div>
                <div className="field">
                  <span className="label-text">ALTO (CM)</span>
                  <input className="input" type="number" value={form.alto} onChange={e => setForm({ ...form, alto: Number(e.target.value) })} />
                </div>
                <div className="field">
                  <span className="label-text">PROF. (CM)</span>
                  <input className="input" type="number" value={form.profundo} onChange={e => setForm({ ...form, profundo: Number(e.target.value) })} />
                </div>
              </div>

              {/* ── CAJONES ── */}
              <div className="cajones-title">📦 Medidas de cajones</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                <SeccionCajon numero={1} />
                <SeccionCajon numero={2} />
                <SeccionCajon numero={3} />
              </div>

              {/* ── PUERTAS ── */}
              <div className="cajones-title" style={{ color: "#4c1d95", borderBottomColor: "#e9d5ff" }}>
                🚪 Medidas de puertas
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                <SeccionPuerta numero={1} />
                <SeccionPuerta numero={2} />
              </div>

              {/* ── INTERMEDIOS ── */}
              <div className="field">
                <span className="label-text" style={{ color: "#059669" }}>
                  ➕ INTERMEDIOS <span style={{ color: "#94a3b8", fontSize: 9, fontWeight: 400, letterSpacing: 0 }}>(INT)</span>
                </span>
                <input
                  className="input"
                  type="number" min="0" step="1" placeholder="Cantidad de intermedios"
                  value={form.intermedios}
                  onChange={e => setForm(prev => ({ ...prev, intermedios: e.target.value === "" ? "" : Math.round(Number(e.target.value)) }))}
                  style={{ textAlign: "center" }}
                />
              </div>

              {/* Colocación */}
              <div className="field">
                <span className="label-text" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>COLOCACIÓN ($)</span>
                  {colocacionBD !== null && (
                    <span style={{ fontSize: "10px", fontWeight: 600, borderRadius: "4px", padding: "1px 7px",
                      background: Number(form.colocacion) !== colocacionBD ? "#fff3cd" : "#eaf3fb",
                      color: Number(form.colocacion) !== colocacionBD ? "#856404" : "#2d7fc1",
                      border: `1px solid ${Number(form.colocacion) !== colocacionBD ? "#ffc107" : "#b8d6ef"}`,
                      cursor: Number(form.colocacion) !== colocacionBD ? "pointer" : "default" }}
                      onClick={() => Number(form.colocacion) !== colocacionBD && setForm(p => ({ ...p, colocacion: colocacionBD }))}>
                      {Number(form.colocacion) !== colocacionBD ? `⚠️ BD: $${colocacionBD} — restaurar` : `📊 BD: $${colocacionBD}`}
                    </span>
                  )}
                </span>
                <input className="input" type="number" min="0" value={form.colocacion}
                  onChange={e => setForm({ ...form, colocacion: Number(e.target.value) })} />
              </div>

              {/* Margen */}
              <div className="field">
                <span className="label-text" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>MARGEN (%)</span>
                  {margenBD !== null && (
                    <span style={{ fontSize: "10px", fontWeight: 600, borderRadius: "4px", padding: "1px 7px",
                      background: Number(form.margen) !== margenBD ? "#fff3cd" : "#eaf3fb",
                      color: Number(form.margen) !== margenBD ? "#856404" : "#2d7fc1",
                      border: `1px solid ${Number(form.margen) !== margenBD ? "#ffc107" : "#b8d6ef"}`,
                      cursor: Number(form.margen) !== margenBD ? "pointer" : "default" }}
                      onClick={() => Number(form.margen) !== margenBD && setForm(p => ({ ...p, margen: margenBD }))}>
                      {Number(form.margen) !== margenBD ? `⚠️ BD: ${margenBD}% — restaurar` : `📊 BD: ${margenBD}%`}
                    </span>
                  )}
                </span>
                <input className="input" type="number" min="0" step="0.5" value={form.margen}
                  onChange={e => setForm({ ...form, margen: Number(e.target.value) })} />
              </div>

              {/* Breakdown */}
              <div className="breakdown">
                {calculando && <div style={{ padding: "8px 16px", fontSize: "12px", color: "#4a8ab5", fontStyle: "italic", borderBottom: "1px solid #e0eaf2" }}>⏳ Recalculando...</div>}
                <div className="breakdown-row"><span>Fórmula vanitory</span><span>{formatPeso(result.subtotal)}</span></div>
                {totalCorredera > 0 && <div className="breakdown-row" style={{ color: "#d97706" }}><span>🔩 {form.corredera} × {form.correderaCantidad}</span><span>{formatPeso(totalCorredera)}</span></div>}
                {totalMargen > 0 && <div className="breakdown-row" style={{ color: "#16a34a" }}><span>📈 Margen ({form.margen}%)</span><span>{formatPeso(totalMargen)}</span></div>}
                {Number(form.colocacion) > 0 && <div className="breakdown-row"><span>Colocación</span><span>{formatPeso(form.colocacion)}</span></div>}
                <div className="total-row">
                  <span className="total-label">TOTAL</span>
                  <span className="total-value">{formatPeso(total)}</span>
                </div>
              </div>

              {/* Acciones */}
              <div className="actions">
                <button className="btn btn-cancel" onClick={onVolver}>Cancelar</button>
                {errorCalc && <p style={{ color: "#dc2626", fontSize: "12px", width: "100%", textAlign: "right", marginBottom: 4 }}>⚠️ {errorCalc}</p>}
                {guardadoOk && <p style={{ color: "#16a34a", fontSize: "12px", width: "100%", textAlign: "right", marginBottom: 4 }}>✅ Guardado correctamente</p>}
                <button className="btn btn-save" onClick={handleGuardar} disabled={guardando}>{guardando ? "⏳ Guardando..." : "💾 Guardar"}</button>
                <button className="btn btn-pdf" onClick={handlePDF}>📄 PDF</button>
                <button className="btn btn-print" onClick={() => window.print()}>🖨️ Imprimir</button>
              </div>
            </div>
          </div>

          {/* Panel foto */}
          <div className="foto-panel">
            <div className="foto-panel-title">🛁 Modelo seleccionado</div>
            {modelo?.foto && modelo.foto !== "null" ? (
              <img className="foto-panel-img" src={modelo.foto} alt={modelo.nombre} />
            ) : (
              <div className="foto-panel-empty">
                <span style={{ fontSize: 48 }}>🛁</span>
                <small style={{ marginTop: 8 }}>{modelo?.custom ? "Personalizado" : "Sin imagen"}</small>
              </div>
            )}
            {modelo && (
              <div style={{ width: "100%", marginTop: 16 }}>
                <div className="foto-info-row"><span className="foto-info-label">Modelo</span><span className="foto-info-value">{modelo.nombre ?? "Personalizado"}</span></div>
                {modelo.codtipvan && <div className="foto-info-row"><span className="foto-info-label">Código</span><span className="foto-info-value">{modelo.codtipvan}</span></div>}
                {modelo.descripcion && <div className="foto-info-row"><span className="foto-info-label">Descripción</span><span className="foto-info-value" style={{ fontSize: 11 }}>{modelo.descripcion}</span></div>}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
