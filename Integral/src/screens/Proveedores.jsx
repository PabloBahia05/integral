import { useState } from "react";
import ScreenHeader from "../Component/ScreenHeader";

const EMPTY = {
  provnombre: "",
  fantasia: "",
  domicilio: "",
  localidad: "",
  telefono: "",
  telefono1: "",
  wapp: "",
  ubicacion: "",
  cuit: "",
  tipo_fact: "",
  descuento: "",
};

const TIPO_COLORS = {
  A: { bg: "#1a3a2a", color: "#4ade80", border: "#166534" },
  B: { bg: "#1e2a4a", color: "#60a5fa", border: "#1d4ed8" },
  C: { bg: "#3a1a2a", color: "#f472b6", border: "#9d174d" },
  E: { bg: "#3a2a1a", color: "#fb923c", border: "#c2410c" },
};

function Initials({ name }) {
  const words = (name || "?").trim().split(" ");
  const initials = words.length >= 2
    ? words[0][0] + words[1][0]
    : words[0].slice(0, 2);
  const colors = ["#2563eb", "#7c3aed", "#0891b2", "#059669", "#d97706"];
  const color = colors[name?.charCodeAt(0) % colors.length] || colors[0];
  return (
    <div style={{
      width: 36, height: 36, borderRadius: "50%",
      background: color + "22", border: `1.5px solid ${color}55`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: "0.7rem", fontWeight: 700, color, flexShrink: 0,
      letterSpacing: "0.05em", textTransform: "uppercase",
    }}>
      {initials.toUpperCase()}
    </div>
  );
}

function TipoBadge({ tipo }) {
  if (!tipo) return <span style={{ color: "#475569", fontSize: "0.75rem" }}>—</span>;
  const s = TIPO_COLORS[tipo] || { bg: "#1e293b", color: "#94a3b8", border: "#334155" };
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      borderRadius: 6, padding: "2px 10px", fontSize: "0.75rem", fontWeight: 700,
      letterSpacing: "0.08em",
    }}>
      {tipo}
    </span>
  );
}

const inputStyle = {
  padding: "0.5rem 0.75rem",
  borderRadius: 8,
  border: "1px solid #1e3a5f",
  background: "#070f1a",
  color: "#e2e8f0",
  fontSize: "0.875rem",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
  transition: "border-color 0.2s",
};

const FIELDS = [
  { label: "Nombre *", name: "provnombre", placeholder: "Razón social", col: "1 / -1" },
  { label: "Nombre Fantasía", name: "fantasia", placeholder: "Nombre comercial" },
  { label: "Localidad", name: "localidad", placeholder: "" },
  { label: "Domicilio", name: "domicilio", placeholder: "" },
  { label: "CUIT", name: "cuit", placeholder: "20-12345678-9" },
  { label: "Teléfono", name: "telefono", placeholder: "" },
  { label: "Teléfono 2", name: "telefono1", placeholder: "" },
  { label: "WhatsApp", name: "wapp", placeholder: "" },
  { label: "Ubicación", name: "ubicacion", placeholder: "URL o descripción", col: "1 / -1" },
  { label: "Descuento (%)", name: "descuento", placeholder: "0.00" },
];

export default function Proveedores({
  proveedores = [],
  selected,
  modal,
  onAdd,
  onEdit,
  onDelete,
  onSelect,
  onOpenModal,
  onCloseModal,
}) {
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState("");
  const [focusedField, setFocusedField] = useState(null);

  const abrirCrear = () => { setForm(EMPTY); onOpenModal("crear"); };
  const abrirEditar = (prov) => { setForm({ ...prov }); onSelect(prov); onOpenModal("editar"); };
  const abrirEliminar = (prov) => { onSelect(prov); onOpenModal("eliminar"); };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleGuardar = () => {
    if (!form.provnombre?.trim()) return alert("El nombre del proveedor es obligatorio.");
    const payload = { ...form, cuit: form.cuit || null };
    if (modal === "crear") onAdd(payload);
    else onEdit({ ...selected, ...payload });
    onCloseModal();
  };
  const handleEliminar = () => { onDelete(selected); onCloseModal(); };

  const filtrados = proveedores.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.provnombre?.toLowerCase().includes(q) ||
      p.fantasia?.toLowerCase().includes(q) ||
      p.localidad?.toLowerCase().includes(q) ||
      p.cuit?.toString().includes(q)
    );
  });

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <ScreenHeader icon="🏭" title="Proveedores" subtitle="Gestión de proveedores" />

      {/* Toolbar */}
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", margin: "1.5rem 0 1rem" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 420 }}>
          <span style={{
            position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
            color: "#475569", fontSize: "1rem", pointerEvents: "none",
          }}>🔍</span>
          <input
            style={{
              ...inputStyle,
              paddingLeft: "2.25rem",
              background: "#0a1628",
              border: "1px solid #1e3a5f",
              borderRadius: 10,
            }}
            placeholder="Buscar por nombre, fantasía, localidad o CUIT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ color: "#475569", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
          {filtrados.length} proveedor{filtrados.length !== 1 ? "es" : ""}
        </div>
        <button
          onClick={abrirCrear}
          style={{
            background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "0.6rem 1.25rem",
            fontSize: "0.875rem",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex", alignItems: "center", gap: "0.4rem",
            boxShadow: "0 4px 15px rgba(37,99,235,0.35)",
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>＋</span> Nuevo proveedor
        </button>
      </div>

      {/* Tabla */}
      <div style={{
        background: "#0a1628",
        border: "1px solid #1e3a5f",
        borderRadius: 14,
        overflow: "hidden",
        boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#0d1f3c", borderBottom: "1px solid #1e3a5f" }}>
              {["Proveedor", "Localidad", "Contacto", "CUIT", "Tipo Fact.", "Descuento", "Acciones"].map((h) => (
                <th key={h} style={{
                  padding: "0.85rem 1rem",
                  textAlign: "left",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "#475569",
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "3rem", color: "#334155" }}>
                  <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🏭</div>
                  <div style={{ fontSize: "0.9rem" }}>No hay proveedores registrados</div>
                </td>
              </tr>
            ) : (
              filtrados.map((prov, i) => (
                <tr
                  key={prov.id}
                  onClick={() => onSelect(prov?.id === selected?.id ? null : prov)}
                  style={{
                    borderBottom: "1px solid #0f2240",
                    background: selected?.id === prov.id ? "#0f2a4a" : "transparent",
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => { if (selected?.id !== prov.id) e.currentTarget.style.background = "#0d1f3a"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = selected?.id === prov.id ? "#0f2a4a" : "transparent"; }}
                >
                  <td style={{ padding: "0.85rem 1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                      <Initials name={prov.provnombre} />
                      <div>
                        <div style={{ color: "#e2e8f0", fontWeight: 600, fontSize: "0.875rem" }}>{prov.provnombre}</div>
                        {prov.fantasia && <div style={{ color: "#475569", fontSize: "0.75rem", marginTop: 1 }}>{prov.fantasia}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "0.85rem 1rem", color: "#94a3b8", fontSize: "0.85rem" }}>
                    {prov.localidad || <span style={{ color: "#334155" }}>—</span>}
                  </td>
                  <td style={{ padding: "0.85rem 1rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      {prov.telefono && <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>📞 {prov.telefono}</span>}
                      {prov.wapp && <span style={{ color: "#4ade80", fontSize: "0.8rem" }}>💬 {prov.wapp}</span>}
                      {!prov.telefono && !prov.wapp && <span style={{ color: "#334155", fontSize: "0.8rem" }}>—</span>}
                    </div>
                  </td>
                  <td style={{ padding: "0.85rem 1rem", color: "#64748b", fontSize: "0.82rem", fontFamily: "monospace" }}>
                    {prov.cuit || <span style={{ color: "#334155" }}>—</span>}
                  </td>
                  <td style={{ padding: "0.85rem 1rem" }}>
                    <TipoBadge tipo={prov.tipo_fact} />
                  </td>
                  <td style={{ padding: "0.85rem 1rem", color: "#94a3b8", fontSize: "0.85rem" }}>
                    {prov.descuento != null && prov.descuento !== ""
                      ? <span style={{ color: "#4ade80", fontWeight: 600 }}>{prov.descuento}%</span>
                      : <span style={{ color: "#334155" }}>—</span>}
                  </td>
                  <td style={{ padding: "0.85rem 1rem" }}>
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      <button
                        title="Editar"
                        onClick={(e) => { e.stopPropagation(); abrirEditar(prov); }}
                        style={{
                          background: "#1e3a5f", border: "1px solid #2563eb33",
                          color: "#60a5fa", borderRadius: 8,
                          width: 32, height: 32, cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "0.85rem", transition: "all 0.15s",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = "#2563eb"; e.currentTarget.style.color = "#fff"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "#1e3a5f"; e.currentTarget.style.color = "#60a5fa"; }}
                      >✏️</button>
                      <button
                        title="Eliminar"
                        onClick={(e) => { e.stopPropagation(); abrirEliminar(prov); }}
                        style={{
                          background: "#3a1a1a", border: "1px solid #7f1d1d44",
                          color: "#f87171", borderRadius: 8,
                          width: 32, height: 32, cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "0.85rem", transition: "all 0.15s",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = "#dc2626"; e.currentTarget.style.color = "#fff"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "#3a1a1a"; e.currentTarget.style.color = "#f87171"; }}
                      >🗑️</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Crear / Editar */}
      {(modal === "crear" || modal === "editar") && (
        <div
          onClick={onCloseModal}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,10,25,0.75)",
            backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#0a1628",
              border: "1px solid #1e3a5f",
              borderRadius: 16,
              padding: "2rem",
              width: "min(680px, 95vw)",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 25px 80px rgba(0,0,0,0.6)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: "1px solid #1e3a5f" }}>
              <div style={{ fontSize: "1.5rem" }}>🏭</div>
              <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#e2e8f0" }}>
                {modal === "crear" ? "Nuevo Proveedor" : "Editar Proveedor"}
              </h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              {FIELDS.map(({ label, name, placeholder, col }) => (
                <label key={name} style={{ display: "flex", flexDirection: "column", gap: "0.35rem", gridColumn: col }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: focusedField === name ? "#60a5fa" : "#475569", letterSpacing: "0.05em", textTransform: "uppercase", transition: "color 0.2s" }}>
                    {label}
                  </span>
                  <input
                    name={name}
                    value={form[name]}
                    onChange={handleChange}
                    placeholder={placeholder}
                    onFocus={() => setFocusedField(name)}
                    onBlur={() => setFocusedField(null)}
                    style={{
                      ...inputStyle,
                      borderColor: focusedField === name ? "#2563eb" : "#1e3a5f",
                      boxShadow: focusedField === name ? "0 0 0 3px rgba(37,99,235,0.15)" : "none",
                    }}
                  />
                </label>
              ))}
              <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: focusedField === "tipo_fact" ? "#60a5fa" : "#475569", letterSpacing: "0.05em", textTransform: "uppercase", transition: "color 0.2s" }}>
                  Tipo Facturación
                </span>
                <select
                  name="tipo_fact"
                  value={form.tipo_fact}
                  onChange={handleChange}
                  onFocus={() => setFocusedField("tipo_fact")}
                  onBlur={() => setFocusedField(null)}
                  style={{
                    ...inputStyle,
                    borderColor: focusedField === "tipo_fact" ? "#2563eb" : "#1e3a5f",
                    cursor: "pointer",
                  }}
                >
                  <option value="">— Seleccionar —</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="E">E</option>
                </select>
              </label>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.75rem", paddingTop: "1rem", borderTop: "1px solid #1e3a5f" }}>
              <button
                onClick={onCloseModal}
                style={{ background: "transparent", border: "1px solid #1e3a5f", color: "#64748b", borderRadius: 10, padding: "0.6rem 1.2rem", fontSize: "0.875rem", cursor: "pointer", fontWeight: 500 }}
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
                style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)", color: "#fff", border: "none", borderRadius: 10, padding: "0.6rem 1.5rem", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 15px rgba(37,99,235,0.4)" }}
              >
                {modal === "crear" ? "Crear proveedor" : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Eliminar */}
      {modal === "eliminar" && selected && (
        <div
          onClick={onCloseModal}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,10,25,0.75)",
            backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#0a1628",
              border: "1px solid #7f1d1d66",
              borderRadius: 16,
              padding: "2rem",
              width: "min(400px, 95vw)",
              boxShadow: "0 25px 80px rgba(0,0,0,0.6)",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>⚠️</div>
              <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.1rem", color: "#f87171", fontWeight: 700 }}>Eliminar proveedor</h2>
              <p style={{ color: "#64748b", fontSize: "0.875rem", margin: 0 }}>
                ¿Estás seguro que querés eliminar a{" "}
                <strong style={{ color: "#e2e8f0" }}>{selected.provnombre}</strong>?
                <br />Esta acción no se puede deshacer.
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={onCloseModal}
                style={{ flex: 1, background: "transparent", border: "1px solid #1e3a5f", color: "#64748b", borderRadius: 10, padding: "0.65rem", fontSize: "0.875rem", cursor: "pointer", fontWeight: 500 }}
              >
                Cancelar
              </button>
              <button
                onClick={handleEliminar}
                style={{ flex: 1, background: "linear-gradient(135deg, #dc2626, #b91c1c)", color: "#fff", border: "none", borderRadius: 10, padding: "0.65rem", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 15px rgba(220,38,38,0.4)" }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
