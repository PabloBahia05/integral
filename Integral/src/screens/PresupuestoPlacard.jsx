import { useState } from "react";

const TERMINACIONES = [
  {
    id: "blanco",
    label: "BLANCO",
    desc: "Laminado blanco mate",
    color: "#F8F8F6",
    border: "#d0cfc8",
    textColor: "#555",
  },
  {
    id: "color",
    label: "COLOR",
    desc: "Melamina madera o color",
    color: "#c9a96e",
    border: "#a07840",
    textColor: "#fff",
  },
  {
    id: "laqueado",
    label: "LAQUEADO",
    desc: "Pintura al horno brillante",
    color: "#2a2a2a",
    border: "#111",
    textColor: "#fff",
  },
];

const STYLE = `
  .placard-wrap { max-width: 560px; margin: 0 auto; font-family: 'Space Mono', monospace; }
  .placard-header { margin-bottom: 32px; }
  .placard-title { font-size: 22px; font-weight: 800; color: #0a3a5c; letter-spacing: -0.5px; font-family: 'Syne', sans-serif; }
  .placard-sub { font-size: 10px; color: #6699bb; letter-spacing: 3px; text-transform: uppercase; margin-top: 4px; }

  .placard-section-label {
    font-size: 9px; letter-spacing: 3px; color: #6699bb;
    text-transform: uppercase; margin-bottom: 14px; margin-top: 28px;
    border-bottom: 1px solid #a0cce8; padding-bottom: 6px;
  }
  .placard-section-label:first-of-type { margin-top: 0; }

  .medidas-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .medida-group { display: flex; flex-direction: column; gap: 6px; }
  .medida-label { font-size: 11px; color: #6699bb; letter-spacing: 1px; text-transform: uppercase; }
  .medida-input-wrap { position: relative; }
  .medida-input {
    width: 100%; padding: 12px 40px 12px 14px;
    border: 1px solid #a0cce8;
    border-radius: 3px;
    background: #fff;
    color: #0a3a5c;
    font-family: 'Space Mono', monospace;
    font-size: 16px;
    outline: none;
    transition: border-color 0.2s;
  }
  .medida-input:focus { border-color: #4ab0e8; box-shadow: 0 0 0 2px #4ab0e820; }
  .medida-input::placeholder { color: #bcd; }
  .medida-suffix {
    position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
    font-size: 11px; color: #88aacc; pointer-events: none;
  }

  .terminaciones-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .terminacion-card {
    border: 2px solid transparent;
    border-radius: 3px;
    padding: 16px 10px 14px;
    cursor: pointer;
    display: flex; flex-direction: column; align-items: center; gap: 10px;
    background: #fff;
    border: 1px solid #a0cce8;
    transition: all 0.15s;
    position: relative;
    overflow: hidden;
  }
  .terminacion-card:hover { border-color: #4ab0e8; transform: translateY(-2px); box-shadow: 0 4px 16px #4ab0e820; }
  .terminacion-card.selected { border: 2px solid #4ab0e8; background: #e8f5fd; }
  .terminacion-card.selected::after {
    content: '✓';
    position: absolute; top: 6px; right: 8px;
    font-size: 11px; color: #4ab0e8; font-weight: 700;
  }

  .terminacion-muestra {
    width: 52px; height: 52px;
    border-radius: 3px;
    border: 1px solid rgba(0,0,0,0.1);
  }
  .terminacion-nombre { font-size: 11px; font-weight: 700; color: #0a3a5c; letter-spacing: 1px; }
  .terminacion-desc { font-size: 10px; color: #88aacc; text-align: center; line-height: 1.4; }

  .resumen-box {
    background: #fff; border: 1px solid #a0cce8; border-radius: 3px;
    padding: 16px 20px; margin-top: 8px;
  }
  .resumen-row { display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px solid #e8f0f8; font-size: 12px; }
  .resumen-row:last-child { border-bottom: none; }
  .resumen-key { color: #6699bb; }
  .resumen-val { color: #0a3a5c; font-weight: 700; }

  .placard-btn-confirmar {
    width: 100%; margin-top: 20px;
    padding: 15px;
    background: #fff;
    border: 1px solid #a0cce8;
    border-radius: 3px;
    font-family: 'Space Mono', monospace;
    font-size: 13px; font-weight: 700;
    color: #2255aa; cursor: pointer;
    transition: all 0.15s;
    letter-spacing: 1px;
  }
  .placard-btn-confirmar:hover:not(:disabled) { background: #0a3a5c; color: #fff; border-color: #0a3a5c; }
  .placard-btn-confirmar:disabled { opacity: 0.4; cursor: not-allowed; }
  .placard-btn-confirmar.listo { background: #0a3a5c; color: #60efff; border-color: #0a3a5c; }
  .placard-btn-confirmar.listo:hover { background: #072d47; }

  .guardado-msg {
    display: flex; align-items: center; gap: 10px;
    background: #e8f5fd; border: 1px solid #a0cce8; border-radius: 3px;
    padding: 14px 18px; margin-top: 16px;
    font-size: 12px; color: #0a3a5c;
    animation: fadeIn 0.3s ease;
  }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
`;

export default function PresupuestoPlacard({ onVolver }) {
  const [vista, setVista] = useState("principal");
  const [terminacion, setTerminacion] = useState(null);
  const [ancho, setAncho] = useState("");
  const [alto, setAlto] = useState("");
  const [guardado, setGuardado] = useState(false);

  const listo = terminacion && ancho && alto;

  const handleConfirmar = () => {
    if (!listo) return;
    setGuardado(true);
    setVista("principal");
  };

  const resumenBadge = terminacion && ancho && alto
    ? `${terminacion.toUpperCase()} · ${ancho}×${alto} cm`
    : "Sin configurar";

  return (
    <>
      <style>{STYLE}</style>

      <div className="placard-wrap">

        {vista === "principal" && (
          <>
            <div className="placard-header">
              <h1 className="placard-title">Placard</h1>
              <p className="placard-sub">Configuración de módulo</p>
            </div>

            {/* Botón FRENTE */}
            <p className="placard-section-label">Componentes</p>
            <button
              className="btn"
              style={{
                "--accent": "#4ab0e8",
                width: "100%",
                justifyContent: "space-between",
                fontFamily: "'Space Mono', monospace",
                fontSize: 13,
                padding: "16px 20px",
                background: "#fff",
                border: "1px solid #a0cce8",
                borderRadius: 3,
                color: "#2255aa",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
              onClick={() => setVista("frente")}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span>🪟</span>
                <span style={{ fontWeight: 700, letterSpacing: 1 }}>FRENTE</span>
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{
                  fontSize: 10, background: guardado ? "#0a3a5c" : "#e8f5fd",
                  color: guardado ? "#60efff" : "#6699bb",
                  border: "1px solid #a0cce8",
                  borderRadius: 20, padding: "3px 10px", letterSpacing: 1,
                }}>
                  {resumenBadge}
                </span>
                <span style={{ color: "#a0cce8" }}>›</span>
              </span>
            </button>

            {guardado && (
              <div className="guardado-msg">
                ✅ Frente configurado: <strong>{terminacion?.toUpperCase()}</strong> — {ancho} × {alto} cm
              </div>
            )}

            {onVolver && (
              <button
                onClick={onVolver}
                style={{
                  marginTop: 32, background: "none", border: "1px solid #a0cce8",
                  borderRadius: 3, padding: "8px 18px", cursor: "pointer",
                  fontFamily: "'Space Mono', monospace", fontSize: 11,
                  color: "#6699bb", letterSpacing: 1,
                }}
              >
                ← Volver
              </button>
            )}
          </>
        )}

        {vista === "frente" && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
              <button
                onClick={() => setVista("principal")}
                style={{
                  background: "none", border: "1px solid #a0cce8", borderRadius: 3,
                  padding: "6px 14px", cursor: "pointer",
                  fontFamily: "'Space Mono', monospace", fontSize: 11,
                  color: "#6699bb", letterSpacing: 1,
                }}
              >
                ← Volver
              </button>
              <div>
                <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: "#0a3a5c" }}>
                  Configurar Frente
                </h2>
              </div>
            </div>

            {/* Medidas */}
            <p className="placard-section-label">Medidas</p>
            <div className="medidas-grid">
              <div className="medida-group">
                <label className="medida-label">Ancho</label>
                <div className="medida-input-wrap">
                  <input
                    type="number"
                    className="medida-input"
                    placeholder="0"
                    min="0"
                    value={ancho}
                    onChange={(e) => setAncho(e.target.value)}
                  />
                  <span className="medida-suffix">cm</span>
                </div>
              </div>
              <div className="medida-group">
                <label className="medida-label">Alto</label>
                <div className="medida-input-wrap">
                  <input
                    type="number"
                    className="medida-input"
                    placeholder="0"
                    min="0"
                    value={alto}
                    onChange={(e) => setAlto(e.target.value)}
                  />
                  <span className="medida-suffix">cm</span>
                </div>
              </div>
            </div>

            {/* Terminación */}
            <p className="placard-section-label">Terminación</p>
            <div className="terminaciones-grid">
              {TERMINACIONES.map((t) => (
                <div
                  key={t.id}
                  className={`terminacion-card${terminacion === t.id ? " selected" : ""}`}
                  onClick={() => setTerminacion(t.id)}
                >
                  <div
                    className="terminacion-muestra"
                    style={{ background: t.color, borderColor: t.border }}
                  />
                  <span className="terminacion-nombre">{t.label}</span>
                  <span className="terminacion-desc">{t.desc}</span>
                </div>
              ))}
            </div>

            {/* Resumen */}
            {(terminacion || ancho || alto) && (
              <>
                <p className="placard-section-label">Resumen</p>
                <div className="resumen-box">
                  <div className="resumen-row">
                    <span className="resumen-key">Terminación</span>
                    <span className="resumen-val">{terminacion ? terminacion.toUpperCase() : "—"}</span>
                  </div>
                  <div className="resumen-row">
                    <span className="resumen-key">Ancho</span>
                    <span className="resumen-val">{ancho ? `${ancho} cm` : "—"}</span>
                  </div>
                  <div className="resumen-row">
                    <span className="resumen-key">Alto</span>
                    <span className="resumen-val">{alto ? `${alto} cm` : "—"}</span>
                  </div>
                </div>
              </>
            )}

            <button
              className={`placard-btn-confirmar${listo ? " listo" : ""}`}
              disabled={!listo}
              onClick={handleConfirmar}
            >
              {listo ? "✓ CONFIRMAR FRENTE" : "Completá todos los campos"}
            </button>
          </>
        )}
      </div>
    </>
  );
}
