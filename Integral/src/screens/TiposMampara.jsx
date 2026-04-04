import { useState, useEffect } from "react";
import ScreenHeader from "../Component/ScreenHeader";
import FormMampara from "./FormMampara";

const API = "http://localhost:3001";

export default function TiposMampara({ onBack }) {
  const [tipos, setTipos]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetch(`${API}/mamparas-tipos`)
      .then((r) => r.json())
      .then((data) => { setTipos(data); setLoading(false); })
      .catch(() => { setError("No se pudieron cargar los tipos."); setLoading(false); });
  }, []);

  if (selected) {
    return (
      <FormMampara
        modelo={{
          label:    selected.NOMBRE,
          codformv: selected.CODFORMV,   // clave para calcular vidrio
          codformh: selected.CODFORMH,   // por si se necesita en el futuro
        }}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <>
      <ScreenHeader icon="🚿" title="Mamparas" subtitle="Seleccioná el tipo de mampara" />
      <button className="ver-tablas-back" onClick={onBack}>← Volver</button>

      {loading && <p style={{ color: "#88aacc", fontSize: "13px" }}>Cargando tipos...</p>}
      {error   && <p className="form-error">{error}</p>}
      {!loading && !error && tipos.length === 0 && (
        <p style={{ color: "#88aacc", fontSize: "13px" }}>
          No hay tipos cargados. Creá uno desde <strong>Ver Tablas → Tipos de Mampara</strong>.
        </p>
      )}

      <div className="presup-grid">
        {tipos.map((tipo) => (
          <button key={tipo.id} className="presup-card" onClick={() => setSelected(tipo)}>
            <span className="presup-icon">🪟</span>
            <span className="presup-label">{tipo.NOMBRE}</span>
          </button>
        ))}
      </div>
    </>
  );
}
