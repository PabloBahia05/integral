import { useState, useEffect } from "react";
import ScreenHeader from "../Component/ScreenHeader";
import PresupuestoVanitory from "./PresupuestoVanitory";

const API = "http://localhost:3001";

const OTROS_ITEMS = [
  { id: "cocina",     label: "Cocina",     icon: "🍳" },
  { id: "placares",   label: "Placares",   icon: "🚪" },
  { id: "despensero", label: "Despensero", icon: "🗄️" },
  { id: "escritorio", label: "Escritorio", icon: "🖥️" },
];

export default function PresupuestoMuebles({ onSelectItem }) {
  const [subScreen, setSubScreen]     = useState(null); // null | "vanitory-modelos" | "vanitory-presup"
  const [tiposVanitory, setTiposVanitory] = useState([]);
  const [modeloSeleccionado, setModeloSeleccionado] = useState(null);
  const [loading, setLoading]         = useState(false);

  // Cargar tipos de vanitory al entrar a esa sección
  useEffect(() => {
    if (subScreen !== "vanitory-modelos") return;
    setLoading(true);
    fetch(`${API}/vanitory-tipos`)
      .then(r => r.json())
      .then(d => setTiposVanitory(Array.isArray(d) ? d : []))
      .catch(() => setTiposVanitory([]))
      .finally(() => setLoading(false));
  }, [subScreen]);

  // ── Pantalla presupuesto vanitory ──
  if (subScreen === "vanitory-presup" && modeloSeleccionado) {
    return (
      <PresupuestoVanitory
        modelo={modeloSeleccionado}
        onVolver={() => { setSubScreen("vanitory-modelos"); setModeloSeleccionado(null); }}
      />
    );
  }

  // ── Selector de modelos vanitory ──
  if (subScreen === "vanitory-modelos") {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Source+Sans+3:wght@300;400;600&display=swap');
          .van-layout { min-height: 100vh; background: #e8f0f7; padding: 40px 24px; }
          .van-back { background: none; border: none; cursor: pointer; color: #4a8ab5; font-size: 13px;
            font-family: 'Rajdhani', sans-serif; font-weight: 700; letter-spacing: 0.08em;
            margin-bottom: 24px; display: flex; align-items: center; gap: 6px; padding: 0; }
          .van-back:hover { color: #0f2944; }
          .van-title { font-family: 'Rajdhani', sans-serif; font-size: 22px; font-weight: 700;
            color: #0f2944; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 8px; }
          .van-subtitle { font-size: 13px; color: #4a8ab5; margin-bottom: 32px; }
          .van-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; max-width: 900px; }
          .van-card {
            background: #fff; border-radius: 12px; overflow: hidden;
            box-shadow: 0 2px 12px rgba(15,41,68,0.08); border: 2px solid transparent;
            cursor: pointer; transition: all 0.18s; display: flex; flex-direction: column;
          }
          .van-card:hover { border-color: #2d7fc1; transform: translateY(-3px); box-shadow: 0 6px 24px rgba(45,127,193,0.18); }
          .van-card-img { width: 100%; height: 160px; object-fit: cover; background: #f0f6fb; }
          .van-card-img-empty { width: 100%; height: 160px; background: #f0f6fb;
            display: flex; align-items: center; justify-content: center; font-size: 48px; }
          .van-card-body { padding: 14px 16px; flex: 1; display: flex; flex-direction: column; gap: 4px; }
          .van-card-nombre { font-family: 'Rajdhani', sans-serif; font-size: 15px; font-weight: 700;
            color: #0f2944; letter-spacing: 0.04em; }
          .van-card-desc { font-size: 12px; color: #6a8aa0; line-height: 1.4; }
          .van-card-material { font-size: 11px; color: #2d7fc1; font-weight: 600; margin-top: 4px; }
          .van-card-armar {
            background: #0f2944; color: #fff; border: none; border-radius: 12px;
            padding: 0; cursor: pointer; transition: all 0.18s;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            min-height: 220px; box-shadow: 0 2px 12px rgba(15,41,68,0.08);
          }
          .van-card-armar:hover { background: #1a3d5c; transform: translateY(-3px); box-shadow: 0 6px 24px rgba(15,41,68,0.22); }
          .van-card-armar-icon { font-size: 40px; margin-bottom: 10px; }
          .van-card-armar-label { font-family: 'Rajdhani', sans-serif; font-size: 18px; font-weight: 700;
            letter-spacing: 0.1em; text-transform: uppercase; }
          .van-card-armar-sub { font-size: 11px; color: #7ab2d4; margin-top: 4px; }
        `}</style>

        <div className="van-layout">
          <button className="van-back" onClick={() => setSubScreen(null)}>
            ← Volver a muebles
          </button>
          <div className="van-title">🛁 Vanitory</div>
          <div className="van-subtitle">Elegí un modelo o armá uno personalizado</div>

          {loading ? (
            <div style={{ color: "#4a8ab5", fontStyle: "italic" }}>⏳ Cargando modelos...</div>
          ) : (
            <div className="van-grid">
              {/* Modelos desde BD */}
              {tiposVanitory.map((tipo) => (
                <div
                  key={tipo.id}
                  className="van-card"
                  onClick={() => { setModeloSeleccionado(tipo); setSubScreen("vanitory-presup"); }}
                >
                  {tipo.foto && tipo.foto !== "null" ? (
                    <img className="van-card-img" src={tipo.foto} alt={tipo.nombre} />
                  ) : (
                    <div className="van-card-img-empty">🛁</div>
                  )}
                  <div className="van-card-body">
                    <div className="van-card-nombre">{tipo.nombre}</div>
                    {tipo.descripcion && <div className="van-card-desc">{tipo.descripcion}</div>}
                    {tipo.codtipvan   && <div className="van-card-material">🔖 {tipo.codtipvan}</div>}
                  </div>
                </div>
              ))}

              {/* Botón ARMAR personalizado */}
              <button
                className="van-card-armar"
                onClick={() => { setModeloSeleccionado({ id: null, NOMBRE: "Personalizado", custom: true }); setSubScreen("vanitory-presup"); }}
              >
                <span className="van-card-armar-icon">🔧</span>
                <span className="van-card-armar-label">Armar</span>
                <span className="van-card-armar-sub">Modelo personalizado</span>
              </button>
            </div>
          )}
        </div>
      </>
    );
  }

  // ── Panel principal de muebles ──
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Source+Sans+3:wght@300;400;600&display=swap');
        .presup-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px,1fr)); gap: 16px; margin-top: 24px; max-width: 700px; }
        .presup-card { background: #fff; border-radius: 10px; padding: 28px 20px;
          display: flex; flex-direction: column; align-items: center; gap: 10px;
          border: 2px solid transparent; cursor: pointer; transition: all 0.18s;
          box-shadow: 0 2px 10px rgba(15,41,68,0.07); }
        .presup-card:hover { border-color: #2d7fc1; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(45,127,193,0.15); }
        .presup-icon { font-size: 36px; }
        .presup-label { font-family: 'Rajdhani', sans-serif; font-size: 14px; font-weight: 700;
          color: #0f2944; letter-spacing: 0.08em; text-transform: uppercase; }
      `}</style>

      <ScreenHeader icon="🪵" title="Presupuesto Muebles" subtitle="Seleccioná un tipo de mueble" />

      <div className="presup-grid">
        {/* Vanitory — abre selector de modelos */}
        <button className="presup-card" onClick={() => setSubScreen("vanitory-modelos")}>
          <span className="presup-icon">🛁</span>
          <span className="presup-label">Vanitory</span>
        </button>

        {/* Resto de items */}
        {OTROS_ITEMS.map((item) => (
          <button key={item.id} className="presup-card" onClick={() => onSelectItem?.(item)}>
            <span className="presup-icon">{item.icon}</span>
            <span className="presup-label">{item.label}</span>
          </button>
        ))}
      </div>
    </>
  );
}
