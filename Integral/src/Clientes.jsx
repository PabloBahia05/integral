export default function Clientes({ onBack }) {
  return (
    <>
      <style>{`
        .clientes-body {
          background: #ffd6e7;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Space Mono', monospace;
        }

        .clientes-wrapper {
          width: 480px;
          padding: 48px 40px;
          background: #fff0f6;
          border: 1px solid #ffaac8;
          border-radius: 4px;
          position: relative;
          overflow: hidden;
          text-align: center;
        }

        .clientes-wrapper::before {
          content: '';
          position: absolute;
          top: -120px; right: -120px;
          width: 300px; height: 300px;
          background: radial-gradient(circle, #ff69a520 0%, transparent 70%);
          pointer-events: none;
        }

        .clientes-title {
          font-family: 'Syne', sans-serif;
          font-size: 36px;
          font-weight: 800;
          color: #a0205a;
          letter-spacing: -0.5px;
          margin-bottom: 10px;
        }

        .clientes-subtitle {
          font-size: 11px;
          color: #e899bb;
          letter-spacing: 3px;
          text-transform: uppercase;
          margin-bottom: 40px;
        }

        .back-btn {
          margin-top: 32px;
          padding: 12px 28px;
          background: #ffffff;
          border: 1px solid #ffaac8;
          border-radius: 3px;
          color: #a0205a;
          font-family: 'Space Mono', monospace;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .back-btn:hover {
          background: #ffaac8;
          color: #fff;
          transform: translateY(-1px);
        }
      `}</style>

      <div className="clientes-body">
        <div className="clientes-wrapper">
          <h1 className="clientes-title">Clientes</h1>
          <p className="clientes-subtitle">Gestión de clientes</p>
          <button className="back-btn" onClick={onBack}>← Volver al panel</button>
        </div>
      </div>
    </>
  );
}
