import { useState } from "react";
import ScreenHeader from "../Component/ScreenHeader";

const API = "http://localhost:3001";
const VIDRIOS = ["Incoloro", "Esmerilado"];

export default function FormMampara({ modelo, onBack }) {
  const [form, setForm] = useState({
    nombre:    "",
    cantidad:  "1",
    ancho:     "",
    alto:      "",
    vidrio:    "Incoloro",
    colocacion:"",
  });

  const [resultado, setResultado]   = useState(null); // { vidrio, heraje, total }
  const [calculando, setCalculando] = useState(false);
  const [guardando, setGuardando]   = useState(false);
  const [error, setError]           = useState("");
  const [exito, setExito]           = useState("");

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setResultado(null);
    setError("");
    setExito("");
  };

  // ── Calcular ──────────────────────────────────────────────
  const calcular = async () => {
    if (!form.ancho || !form.alto || !form.cantidad) {
      setError("Completá ancho, alto y cantidad antes de calcular.");
      return;
    }
    setCalculando(true);
    setError("");
    try {
      const res = await fetch(`${API}/formulas/calcular`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codformv: modelo?.codformv,
          variables: {
            ancho:      parseFloat(form.ancho),
            alto:       parseFloat(form.alto),
            cantidad:   parseInt(form.cantidad),
            colocacion: parseFloat(form.colocacion) || 0,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResultado(data); // { vidrio, heraje, total }
    } catch (e) {
      setError("Error al calcular: " + e.message);
    } finally {
      setCalculando(false);
    }
  };

  // ── Guardar ───────────────────────────────────────────────
  const guardar = async () => {
    if (!resultado)          { setError("Primero calculá el valor."); return; }
    if (!form.nombre.trim()) { setError("El nombre es obligatorio."); return; }
    setGuardando(true);
    setError("");
    try {
      const today = new Date().toISOString().split("T")[0];
      const body = {
        NOMBRE:        form.nombre,
        FECHA:         today,
        CANTIDAD:      parseInt(form.cantidad),
        MODELO:        modelo?.label ?? "",
        ANCHO:         parseFloat(form.ancho),
        ALTO:          parseFloat(form.alto),
        VIDRIO:        form.vidrio,
        COLOCACION:    parseFloat(form.colocacion) || 0,
        VALOR_VIDRIO:  resultado.vidrio,
        VALOR_HERAJE:  resultado.heraje,
        TOTAL:         resultado.total,
      };
      const res = await fetch(`${API}/presupuestos-mamparas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setExito("✅ Presupuesto guardado correctamente (ID: " + data.id + ")");
    } catch (e) {
      setError("Error al guardar: " + e.message);
    } finally {
      setGuardando(false);
    }
  };

  const fmt = (v) => `$${(v ?? 0).toLocaleString("es-AR")}`;

  return (
    <>
      <ScreenHeader
        icon="🚿"
        title={modelo?.label ?? "Mampara"}
        subtitle="Completá los datos para calcular el presupuesto"
      />

      <div className="formmampara-wrap">
        <button className="ver-tablas-back" onClick={onBack}>← Volver</button>

        <div className="formmampara-body">

          {/* Nombre */}
          <div className="form-group">
            <label className="form-label">Nombre / Cliente *</label>
            <input className="form-input" placeholder="Ej: Juan Pérez"
              value={form.nombre} onChange={(e) => set("nombre", e.target.value)} />
          </div>

          {/* Cantidad */}
          <div className="form-group">
            <label className="form-label">Cantidad</label>
            <input className="form-input" type="number" min="1" placeholder="1"
              value={form.cantidad} onChange={(e) => set("cantidad", e.target.value)} />
          </div>

          {/* Ancho / Alto */}
          <div className="formmampara-row">
            <div className="form-group">
              <label className="form-label">Ancho (cm)</label>
              <input className="form-input" type="number" placeholder="Ej: 80"
                value={form.ancho} onChange={(e) => set("ancho", e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Alto (cm)</label>
              <input className="form-input" type="number" placeholder="Ej: 200"
                value={form.alto} onChange={(e) => set("alto", e.target.value)} />
            </div>
          </div>

          {/* Vidrio */}
          <div className="form-group">
            <label className="form-label">Vidrio</label>
            <div className="formmampara-vidrio">
              {VIDRIOS.map((v) => (
                <button key={v} type="button"
                  className={`formmampara-vidrio-btn${form.vidrio === v ? " selected" : ""}`}
                  onClick={() => set("vidrio", v)}
                >
                  {v === "Incoloro" ? "🔵" : "🌫️"} {v}
                </button>
              ))}
            </div>
          </div>

          {/* Colocación */}
          <div className="form-group">
            <label className="form-label">Colocación ($)</label>
            <input className="form-input" type="number" placeholder="Ej: 5000"
              value={form.colocacion} onChange={(e) => set("colocacion", e.target.value)} />
          </div>

          {/* Errores / Éxito */}
          {error && <p className="form-error">{error}</p>}
          {exito && <p className="formmampara-exito">{exito}</p>}

          {/* Resultado desglosado */}
          {resultado && (
            <div className="formmampara-desglose">
              <div className="formmampara-desglose-fila">
                <span>Vidrio</span>
                <strong>{fmt(resultado.vidrio)}</strong>
              </div>
              <div className="formmampara-desglose-fila">
                <span>Heraje</span>
                <strong>{fmt(resultado.heraje)}</strong>
              </div>
              <div className="formmampara-desglose-fila formmampara-desglose-total">
                <span>TOTAL</span>
                <strong>{fmt(resultado.total)}</strong>
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="form-actions">
            <button className="btn-cancel" onClick={onBack}>Cancelar</button>
            <button className="btn-save" onClick={calcular} disabled={calculando}>
              {calculando ? "Calculando..." : "🧮 Calcular"}
            </button>
            {resultado && (
              <button
                className="btn-save"
                style={{ background: "#00c9a7", borderColor: "#00c9a7" }}
                onClick={guardar}
                disabled={guardando}
              >
                {guardando ? "Guardando..." : "💾 Guardar"}
              </button>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
