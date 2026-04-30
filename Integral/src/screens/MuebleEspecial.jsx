import { useState } from "react";

const EMPTY = {
  ancho: "", alto: "", profundidad: "",
  cajon1_ancho: "", cajon1_alto: "", cajon1_cantidad: "",
  cajon2_ancho: "", cajon2_alto: "", cajon2_cantidad: "",
  cajon3_ancho: "", cajon3_alto: "", cajon3_cantidad: "",
};

function Field({ label, value, onChange, unit = "cm" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: "#6699bb", letterSpacing: "0.08em", textTransform: "uppercase" }}>
        {label}
      </label>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <input
          type="number"
          min="0"
          step="0.1"
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            width: "100%", padding: "9px 12px", borderRadius: 6,
            border: "1.5px solid #b8cfe0", fontSize: 14, fontFamily: "inherit",
            outline: "none", transition: "border-color 0.2s",
            background: "#fff", color: "#0a3a5c",
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
          background: filled ? "#2563eb" : "#94a3b8",
          color: "#fff", borderRadius: "50%", width: 22, height: 22,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 800, flexShrink: 0, transition: "background 0.2s",
        }}>{num}</span>
        CAJÓN {num}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <Field label="Ancho" value={form[`cajon${num}_ancho`]} onChange={set("ancho")} />
        <Field label="Alto" value={form[`cajon${num}_alto`]} onChange={set("alto")} />
        <Field label="Cantidad" value={form[`cajon${num}_cantidad`]} onChange={set("cantidad")} unit="u." />
      </div>
    </div>
  );
}

export default function MuebleEspecial() {
  const [form, setForm] = useState(EMPTY);
  const [guardado, setGuardado] = useState(false);

  const set = (key) => (val) => { setForm(f => ({ ...f, [key]: val })); setGuardado(false); };

  const handleLimpiar = () => { setForm(EMPTY); setGuardado(false); };

  const handleGuardar = () => {
    // Placeholder: aquí irá el envío al servidor
    console.log("Mueble especial:", form);
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2500);
  };

  const tieneAlgo = Object.values(form).some(v => v !== "");

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

      {/* Medidas principales */}
      <div style={{
        background: "#fff", border: "1.5px solid #b8cfe0", borderRadius: 12,
        padding: "22px 24px", marginBottom: 20,
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#0a3a5c", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>
          📐 Medidas del mueble
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          <Field label="Ancho" value={form.ancho} onChange={set("ancho")} />
          <Field label="Alto" value={form.alto} onChange={set("alto")} />
          <Field label="Profundidad" value={form.profundidad} onChange={set("profundidad")} />
        </div>
      </div>

      {/* Cajones */}
      <div style={{
        background: "#fff", border: "1.5px solid #b8cfe0", borderRadius: 12,
        padding: "22px 24px", marginBottom: 24,
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#0a3a5c", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>
          🗂 Cajones
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <CajonSection num={1} form={form} setForm={setForm} />
          <CajonSection num={2} form={form} setForm={setForm} />
          <CajonSection num={3} form={form} setForm={setForm} />
        </div>
      </div>

      {/* Botones */}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        {tieneAlgo && (
          <button
            onClick={handleLimpiar}
            style={{
              padding: "10px 22px", borderRadius: 8, border: "1.5px solid #b8cfe0",
              background: "#fff", color: "#6699bb", fontSize: 13, fontFamily: "inherit",
              cursor: "pointer", fontWeight: 600, transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.target.style.background = "#f1f5f9"; e.target.style.borderColor = "#94a3b8"; }}
            onMouseLeave={e => { e.target.style.background = "#fff"; e.target.style.borderColor = "#b8cfe0"; }}
          >
            Limpiar
          </button>
        )}
        <button
          onClick={handleGuardar}
          style={{
            padding: "10px 28px", borderRadius: 8, border: "none",
            background: guardado ? "#22c55e" : "#2563eb",
            color: "#fff", fontSize: 13, fontFamily: "inherit",
            cursor: "pointer", fontWeight: 700, transition: "background 0.3s",
          }}
        >
          {guardado ? "✓ Guardado" : "Guardar"}
        </button>
      </div>
    </div>
  );
}
