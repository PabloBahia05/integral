import { useState, useEffect, useCallback } from "react";

/**
 * BreakdownFormulasVanitory
 * Muestra el desglose completo de fórmulas asociadas para el presupuesto de vanitory.
 *
 * Props:
 *   - slotDefs:   Array de { n, cod, expr } — slots de la asociación de fórmulas
 *   - formulaPrincipal: { cod, expr }       — fórmula principal que combina slots
 *   - vars:       { ancho, alto, profundo, cantidad, precio_material, precio_base }
 *   - correderaPrecio, correderaCantidad, colocacion, margen
 *
 * Si no se pasan props, usa valores de ejemplo para demo.
 */

const DEMO_SLOTS = [
  { n: 1, cod: "FBASE",   expr: "precio_base + precio_material * (ancho * profundo / 10000)" },
  { n: 2, cod: "FDIM",    expr: "ancho * alto * profundo / 1000" },
  { n: 3, cod: "FMANO",   expr: "FORM_FDIM * 18.5" },
  { n: 4, cod: "FINSUMO", expr: "FORM_FBASE * 0.12" },
  { n: 5, cod: "FCANT",   expr: "FORM_FMANO * cantidad" },
];
const DEMO_FORMULA_PRINCIPAL = { cod: "FVANITORY", expr: "FORM_FCANT + FORM_FINSUMO + FORM_FBASE" };

function evalExpr(expr, ctx) {
  let e = expr;
  for (const [k, v] of Object.entries(ctx)) {
    e = e.replaceAll(k, String(v));
  }
  try {
    // eslint-disable-next-line no-new-func
    return Function('"use strict"; return (' + e + ')')();
  } catch {
    return 0;
  }
}

function fmt(n) {
  return "$" + Math.round(n).toLocaleString("es-AR");
}

function tokenizeExpr(expr) {
  return expr.split(/(FORM_[A-Z0-9]+)/g).map(p => ({
    isRef: /^FORM_/.test(p),
    val: p,
  }));
}

export default function BreakdownFormulasVanitory({
  slotDefs = DEMO_SLOTS,
  formulaPrincipal = DEMO_FORMULA_PRINCIPAL,
  vars: varsProp = null,
  correderaPrecio: corrPrecioProp = null,
  correderaCantidad: corrCantProp = null,
  colocacion: colocProp = null,
  margen: margenProp = null,
  onVolver = null,
}) {
  const [ancho,      setAncho]      = useState(60);
  const [alto,       setAlto]       = useState(50);
  const [profundo,   setProfundo]   = useState(45);
  const [cantidad,   setCantidad]   = useState(1);
  const [matPrecio,  setMatPrecio]  = useState(5000);
  const [precioBase, setPrecioBase] = useState(0);
  const [corrPrecio, setCorrPrecio] = useState(800);
  const [corrCant,   setCorrCant]   = useState(2);
  const [coloc,      setColoc]      = useState(2000);
  const [margen,     setMargen]     = useState(30);

  // Usa props si vienen, si no usa estado interno
  const vars = varsProp ?? {
    ancho, alto, profundo, cantidad,
    precio_material: matPrecio,
    precio_base: precioBase,
  };
  const _corrPrecio = corrPrecioProp ?? corrPrecio;
  const _corrCant   = corrCantProp   ?? corrCant;
  const _coloc      = colocProp      ?? coloc;
  const _margen     = margenProp     ?? margen;

  // Calcular slots en orden
  const slotCtx = {};
  const slotResults = slotDefs.map(s => {
    const val = evalExpr(s.expr, { ...vars, ...slotCtx });
    slotCtx[`FORM_${s.cod}`] = val;
    return { ...s, val };
  });

  const subtotal    = evalExpr(formulaPrincipal.expr, { ...vars, ...slotCtx });
  const totalCorr   = _corrPrecio * _corrCant;
  const base        = subtotal + totalCorr;
  const totalMargen = base * _margen / 100;
  const total       = base + totalMargen + _coloc;

  // Sustitución numérica para mostrar la cadena
  let chainStr = formulaPrincipal.expr;
  for (const s of slotResults) {
    chainStr = chainStr.replaceAll(`FORM_${s.cod}`, Math.round(s.val));
  }
  const chainFull = `${chainStr} = ${Math.round(subtotal)}`;

  const isDemo = varsProp === null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Source+Sans+3:wght@300;400;600&display=swap');

        .bfv-root {
          font-family: 'Source Sans 3', sans-serif;
          background: #e8f0f7;
          min-height: 100vh;
          padding: 32px 24px;
          color: #1a2a3a;
        }

        .bfv-header {
          display: flex; align-items: center; gap: 12px;
          margin-bottom: 28px;
        }
        .bfv-header-icon {
          font-size: 28px;
        }
        .bfv-title {
          font-family: 'Rajdhani', sans-serif;
          font-size: 26px; font-weight: 700;
          color: #0f2944; letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .bfv-subtitle {
          font-size: 13px; color: #6a8aa0; margin-top: 2px;
        }

        /* ── Sección label ── */
        .bfv-sec {
          display: flex; align-items: center; gap: 8px;
          font-family: 'Rajdhani', sans-serif;
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: #4a8ab5; margin: 20px 0 10px;
        }
        .bfv-sec::after {
          content: ''; flex: 1; height: 1px; background: #d0dde8;
        }

        /* ── Card ── */
        .bfv-card {
          background: #fff;
          border-radius: 10px;
          box-shadow: 0 2px 16px rgba(15,41,68,0.07);
          padding: 20px 24px;
          margin-bottom: 16px;
        }

        /* ── Inputs demo ── */
        .bfv-inputs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 12px;
          margin-bottom: 4px;
        }
        .bfv-field { display: flex; flex-direction: column; gap: 4px; }
        .bfv-label {
          font-family: 'Rajdhani', sans-serif;
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: #4a8ab5;
        }
        .bfv-input {
          border: 1.5px solid #d0dde8; border-radius: 6px;
          padding: 8px 10px; font-size: 14px;
          font-family: 'Source Sans 3', sans-serif;
          color: #0f2944; outline: none;
          transition: border-color 0.15s;
          width: 100%; box-sizing: border-box;
        }
        .bfv-input:focus { border-color: #2d7fc1; }

        /* ── Slots grid ── */
        .bfv-slots-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 10px;
        }
        .bfv-slot {
          border: 1.5px solid #e0eaf2;
          border-radius: 8px;
          padding: 12px 14px;
          background: #f7fafd;
          transition: border-color 0.15s, background 0.15s;
        }
        .bfv-slot.used {
          border-color: #b8d6ef;
          background: #eaf3fb;
        }
        .bfv-slot-head {
          display: flex; justify-content: space-between;
          align-items: center; margin-bottom: 6px;
        }
        .bfv-slot-num {
          font-family: 'Rajdhani', sans-serif;
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: #4a8ab5;
        }
        .bfv-slot-cod {
          font-family: monospace; font-size: 12px;
          font-weight: 700; color: #2d7fc1;
          background: #dbeafe; padding: 2px 7px;
          border-radius: 4px;
        }
        .bfv-slot-expr {
          font-family: monospace; font-size: 11px;
          color: #6a8aa0; white-space: nowrap;
          overflow: hidden; text-overflow: ellipsis;
          margin-bottom: 8px;
        }
        .bfv-slot-val {
          font-family: 'Rajdhani', sans-serif;
          font-size: 18px; font-weight: 700;
          color: #0f2944; text-align: right;
        }
        .bfv-slot-raw {
          font-size: 11px; color: #8aabb8;
          text-align: right; margin-top: 1px;
        }

        /* ── Fórmula principal ── */
        .bfv-formula-box {
          background: #fffbeb;
          border: 1.5px solid #fde68a;
          border-radius: 8px;
          padding: 12px 16px;
          font-family: monospace;
          font-size: 14px;
          margin-bottom: 10px;
          word-break: break-all;
          line-height: 1.8;
        }
        .bfv-ref {
          display: inline-block;
          background: #dbeafe; color: #1e40af;
          border-radius: 4px; padding: 1px 7px;
          font-size: 12px; font-weight: 700;
          border: 1px solid #bfdbfe;
        }
        .bfv-ref-val {
          font-size: 11px; font-weight: 400;
          opacity: 0.75; margin-left: 3px;
        }
        .bfv-op { color: #6a8aa0; }

        .bfv-chain {
          background: #f4f8fb;
          border-radius: 6px;
          padding: 8px 14px;
          font-family: monospace;
          font-size: 12px;
          color: #4a6a80;
          margin-bottom: 4px;
        }

        /* ── Breakdown rows ── */
        .bfv-brow {
          display: flex; justify-content: space-between;
          align-items: flex-start; gap: 12px;
          padding: 11px 0;
          border-bottom: 1px solid #f0f4f8;
        }
        .bfv-brow:last-child { border-bottom: none; }
        .bfv-brow-left { display: flex; flex-direction: column; gap: 3px; }
        .bfv-brow-label { font-size: 14px; color: #4a6a80; }
        .bfv-brow-formula {
          font-family: monospace; font-size: 11px;
          background: #eaf3fb; color: #2d7fc1;
          padding: 1px 7px; border-radius: 4px;
          width: fit-content;
        }
        .bfv-brow-val {
          font-size: 16px; font-weight: 600;
          color: #0f2944; white-space: nowrap;
          font-family: 'Rajdhani', sans-serif;
        }

        /* ── Arrow ── */
        .bfv-arrow {
          text-align: center;
          color: #b0c8d8; font-size: 20px;
          margin: 6px 0;
        }

        /* ── Suma final ── */
        .bfv-suma {
          text-align: center;
          font-family: monospace; font-size: 12px;
          color: #6a8aa0;
          background: #f4f8fb;
          border-radius: 6px;
          padding: 8px 14px;
          margin: 6px 0;
        }

        /* ── Total ── */
        .bfv-total {
          background: #0f2944;
          border-radius: 10px;
          padding: 18px 24px;
          display: flex; justify-content: space-between;
          align-items: center;
          margin-top: 8px;
        }
        .bfv-total-label {
          font-family: 'Rajdhani', sans-serif;
          font-size: 13px; font-weight: 700;
          letter-spacing: 0.14em; color: #a8c4d8;
        }
        .bfv-total-val {
          font-family: 'Rajdhani', sans-serif;
          font-size: 28px; font-weight: 700;
          color: #fff;
        }

        .bfv-demo-badge {
          display: inline-block;
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
          background: #fef3c7; color: #92400e;
          border: 1px solid #fde68a;
          border-radius: 5px;
          padding: 2px 8px;
          margin-left: 10px;
          vertical-align: middle;
        }
      `}</style>

      <div className="bfv-root">
        <div className="bfv-header">
          {onVolver && (
            <button
              onClick={onVolver}
              style={{
                background: "none",
                border: "1.5px solid #b0c8d8",
                borderRadius: 6,
                padding: "6px 14px",
                cursor: "pointer",
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 700,
                fontSize: 13,
                color: "#4a8ab5",
                letterSpacing: "0.08em",
                marginRight: 4,
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#4a8ab5"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#4a8ab5"; }}
            >
              ← VOLVER
            </button>
          )}
          <span className="bfv-header-icon">🧮</span>
          <div>
            <div className="bfv-title">
              Desglose de Fórmulas Vanitory
              {isDemo && <span className="bfv-demo-badge">demo</span>}
            </div>
            <div className="bfv-subtitle">
              Fórmula principal: <strong>{formulaPrincipal.cod}</strong> —
              {slotDefs.length} slot{slotDefs.length !== 1 ? "s" : ""} asociado{slotDefs.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>

        {/* ── Inputs (solo en modo demo) ── */}
        {isDemo && (
          <>
            <div className="bfv-sec">Variables de dimensiones</div>
            <div className="bfv-card">
              <div className="bfv-inputs-grid">
                {[
                  ["Ancho (cm)",          ancho,      setAncho],
                  ["Alto (cm)",           alto,       setAlto],
                  ["Profundo (cm)",       profundo,   setProfundo],
                  ["Cantidad",            cantidad,   setCantidad],
                  ["Precio material ($/m²)", matPrecio, setMatPrecio],
                  ["Precio base ($)",     precioBase, setPrecioBase],
                ].map(([label, val, setter]) => (
                  <div className="bfv-field" key={label}>
                    <span className="bfv-label">{label}</span>
                    <input
                      className="bfv-input"
                      type="number"
                      value={val}
                      onChange={e => setter(Number(e.target.value))}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="bfv-sec">Variables de presupuesto</div>
            <div className="bfv-card">
              <div className="bfv-inputs-grid">
                {[
                  ["Corredera ($/u)",     corrPrecio, setCorrPrecio],
                  ["Cant. correderas",    corrCant,   setCorrCant],
                  ["Colocación ($)",      coloc,      setColoc],
                  ["Margen (%)",          margen,     setMargen],
                ].map(([label, val, setter]) => (
                  <div className="bfv-field" key={label}>
                    <span className="bfv-label">{label}</span>
                    <input
                      className="bfv-input"
                      type="number"
                      value={val}
                      onChange={e => setter(Number(e.target.value))}
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── Slots ── */}
        <div className="bfv-sec">Slots de fórmulas asociadas</div>
        <div className="bfv-slots-grid">
          {slotResults.map(s => {
            const usedInPrincipal = formulaPrincipal.expr.includes(`FORM_${s.cod}`);
            const usedInSlot = slotResults.some(
              x => x.n !== s.n && x.expr.includes(`FORM_${s.cod}`)
            );
            const used = usedInPrincipal || usedInSlot;
            return (
              <div key={s.n} className={`bfv-slot${used ? " used" : ""}`}>
                <div className="bfv-slot-head">
                  <span className="bfv-slot-num">Form {s.n}</span>
                  <span className="bfv-slot-cod">{s.cod}</span>
                </div>
                <div className="bfv-slot-expr" title={s.expr}>{s.expr}</div>
                <div className="bfv-slot-val">{fmt(s.val)}</div>
                <div className="bfv-slot-raw">{(Math.round(s.val * 100) / 100).toLocaleString("es-AR")}</div>
              </div>
            );
          })}
        </div>

        {/* ── Fórmula principal ── */}
        <div className="bfv-sec">Fórmula principal — {formulaPrincipal.cod}</div>
        <div className="bfv-card">
          <div className="bfv-formula-box">
            {tokenizeExpr(formulaPrincipal.expr).map((t, i) => {
              if (t.isRef) {
                const cod = t.val.replace("FORM_", "");
                const sr  = slotResults.find(s => s.cod === cod);
                const v   = sr ? fmt(sr.val) : "?";
                return (
                  <span key={i} className="bfv-ref" title={`${t.val} = ${v}`}>
                    {t.val}<span className="bfv-ref-val">({v})</span>
                  </span>
                );
              }
              return <span key={i} className="bfv-op">{t.val}</span>;
            })}
          </div>
          <div className="bfv-chain">⟶ {chainFull}</div>
        </div>

        {/* ── Breakdown parciales ── */}
        <div className="bfv-sec">Desglose del total</div>
        <div className="bfv-card">
          <div className="bfv-brow">
            <div className="bfv-brow-left">
              <span className="bfv-brow-label">Subtotal fórmula ({formulaPrincipal.cod})</span>
              <span className="bfv-brow-formula">{formulaPrincipal.expr}</span>
            </div>
            <span className="bfv-brow-val">{fmt(subtotal)}</span>
          </div>
          <div className="bfv-brow">
            <div className="bfv-brow-left">
              <span className="bfv-brow-label">Total correderas</span>
              <span className="bfv-brow-formula">precio_corredera × cantidad_correderas</span>
            </div>
            <span className="bfv-brow-val">{fmt(totalCorr)}</span>
          </div>
          <div className="bfv-brow">
            <div className="bfv-brow-left">
              <span className="bfv-brow-label">Base para margen</span>
              <span className="bfv-brow-formula">subtotal + correderas</span>
            </div>
            <span className="bfv-brow-val">{fmt(base)}</span>
          </div>
          <div className="bfv-brow">
            <div className="bfv-brow-left">
              <span className="bfv-brow-label">Monto del margen ({_margen}%)</span>
              <span className="bfv-brow-formula">base × ({_margen}% / 100)</span>
            </div>
            <span className="bfv-brow-val">{fmt(totalMargen)}</span>
          </div>
          {_coloc > 0 && (
            <div className="bfv-brow">
              <div className="bfv-brow-left">
                <span className="bfv-brow-label">Colocación</span>
                <span className="bfv-brow-formula">campo directo desde BD</span>
              </div>
              <span className="bfv-brow-val">{fmt(_coloc)}</span>
            </div>
          )}
        </div>

        <div className="bfv-arrow">↓</div>
        <div className="bfv-suma">
          {fmt(base)} + {fmt(totalMargen)} + {fmt(_coloc)} = {fmt(total)}
        </div>
        <div className="bfv-arrow">↓</div>

        <div className="bfv-total">
          <span className="bfv-total-label">TOTAL</span>
          <span className="bfv-total-val">{fmt(total)}</span>
        </div>
      </div>
    </>
  );
}
