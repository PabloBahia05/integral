export default function PresupuestoAmoblamiento({ onBuscar, onNuevo, onVolver }) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@700;800&display=swap');

        .pam-root {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 70vh;
          gap: 0;
        }

        .pam-eyebrow {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #6699bb;
          margin-bottom: 10px;
        }

        .pam-title {
          font-family: 'Syne', sans-serif;
          font-size: 36px;
          font-weight: 800;
          color: #0a3a5c;
          letter-spacing: -0.5px;
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .pam-subtitle {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          color: #8aabb8;
          margin-bottom: 52px;
          letter-spacing: 0.08em;
        }

        .pam-cards {
          display: flex;
          gap: 24px;
        }

        .pam-card {
          width: 200px;
          padding: 36px 28px;
          background: #fff;
          border: 1.5px solid #a0cce8;
          border-radius: 4px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          cursor: pointer;
          transition: all 0.18s ease;
          position: relative;
          overflow: hidden;
        }

        .pam-card::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0;
          width: 0; height: 3px;
          background: var(--card-color);
          transition: width 0.2s ease;
        }

        .pam-card:hover {
          border-color: var(--card-color);
          transform: translateY(-3px);
          box-shadow: 0 8px 28px var(--card-shadow);
        }

        .pam-card:hover::after { width: 100%; }
        .pam-card:active { transform: translateY(0) scale(0.97); }

        .pam-card-icon {
          font-size: 40px;
          line-height: 1;
        }

        .pam-card-label {
          font-family: 'Space Mono', monospace;
          font-size: 13px;
          font-weight: 700;
          color: #0a3a5c;
          text-align: center;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .pam-card-desc {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: #8aabb8;
          text-align: center;
          letter-spacing: 0.02em;
          line-height: 1.5;
        }

        .pam-back {
          margin-top: 40px;
          background: none;
          border: none;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          color: #8aabb8;
          cursor: pointer;
          letter-spacing: 0.08em;
          transition: color 0.15s;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .pam-back:hover { color: #0a3a5c; }
      `}</style>

      <div className="pam-root">
        <p className="pam-eyebrow">Módulo de presupuestación</p>
        <h1 className="pam-title">
          <span>🪑</span>
          Amoblamiento
        </h1>
        <p className="pam-subtitle">¿Qué querés hacer?</p>

        <div className="pam-cards">
          {/* BUSCAR */}
          <div
            className="pam-card"
            style={{ "--card-color": "#4361ee", "--card-shadow": "#4361ee33" }}
            onClick={onBuscar}
          >
            <span className="pam-card-icon">🔍</span>
            <span className="pam-card-label">Buscar</span>
            <span className="pam-card-desc">Consultá presupuestos<br/>existentes</span>
          </div>

          {/* NUEVO */}
          <div
            className="pam-card"
            style={{ "--card-color": "#7b61ff", "--card-shadow": "#7b61ff33" }}
            onClick={onNuevo}
          >
            <span className="pam-card-icon">✏️</span>
            <span className="pam-card-label">Nuevo</span>
            <span className="pam-card-desc">Creá un presupuesto<br/>de amoblamiento</span>
          </div>
        </div>

        <button className="pam-back" onClick={onVolver}>
          ← Volver al panel
        </button>
      </div>
    </>
  );
}
