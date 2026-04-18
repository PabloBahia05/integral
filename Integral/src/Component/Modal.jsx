import { useRef, useEffect, useState, useCallback } from "react";

/**
 * Modal draggable — arrastrar desde el header con el mouse (o touch).
 * Drop-in replacement del Modal original: mismas props (title, onClose, children).
 */
export default function Modal({ title, onClose, children }) {
  const dialogRef = useRef(null);

  // Posición del diálogo relativa al centro de la pantalla
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const origin = useRef({ mx: 0, my: 0, dx: 0, dy: 0 });

  /* ── Resetear posición cuando el modal se abre ── */
  useEffect(() => {
    setPos({ x: 0, y: 0 });
  }, []);

  /* ── Iniciar drag ── */
  const onMouseDown = useCallback((e) => {
    // Solo botón primario; ignorar clicks en botones dentro del header
    if (e.button !== 0) return;
    if (e.target.closest("button")) return;
    e.preventDefault();
    dragging.current = true;
    origin.current = { mx: e.clientX, my: e.clientY, dx: pos.x, dy: pos.y };
  }, [pos]);

  /* ── Mover ── */
  useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current) return;
      const dx = e.clientX - origin.current.mx;
      const dy = e.clientY - origin.current.my;
      setPos({ x: origin.current.dx + dx, y: origin.current.dy + dy });
    };
    const onUp = () => { dragging.current = false; };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  /* ── Cerrar con Escape ── */
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(10,25,47,0.45)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        /* el overlay NO captura clicks para no bloquear el drag fuera del modal */
        pointerEvents: "none",
      }}
    >
      <div
        ref={dialogRef}
        style={{
          pointerEvents: "auto",
          background: "#fff",
          borderRadius: "10px",
          boxShadow: "0 8px 40px rgba(10,25,47,0.22)",
          width: "min(760px, 96vw)",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          transform: `translate(${pos.x}px, ${pos.y}px)`,
          /* sin transition durante el drag para evitar lag */
          userSelect: dragging.current ? "none" : "auto",
        }}
      >
        {/* ── Header draggable ── */}
        <div
          onMouseDown={onMouseDown}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px 14px",
            borderBottom: "1.5px solid #e8f0f7",
            background: "#f7fafd",
            cursor: "grab",
            flexShrink: 0,
          }}
        >
          <h2 style={{
            margin: 0,
            fontSize: "17px",
            fontWeight: 800,
            color: "#0f2944",
            fontFamily: "'Rajdhani', sans-serif",
            letterSpacing: "0.02em",
            userSelect: "none",
          }}>
            {title}
          </h2>

          {/* Indicador visual de drag */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{
              fontSize: "11px",
              color: "#8aabb8",
              fontFamily: "monospace",
              userSelect: "none",
              letterSpacing: "0.05em",
            }}>
              ✥ mover
            </span>
            <button
              onClick={onClose}
              title="Cerrar"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "20px",
                color: "#6a8aa0",
                lineHeight: 1,
                padding: "2px 4px",
                borderRadius: "4px",
                transition: "color 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.color = "#c0392b"}
              onMouseLeave={e => e.currentTarget.style.color = "#6a8aa0"}
            >
              ×
            </button>
          </div>
        </div>

        {/* ── Contenido scrolleable ── */}
        <div style={{
          padding: "20px 24px",
          overflowY: "auto",
          flex: 1,
        }}>
          {children}
        </div>
      </div>
    </div>
  );
}
