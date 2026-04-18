import React, { useState, useEffect, useRef } from "react";
import DataTable from "../Component/DataTable";
import Modal from "../Component/Modal";
import ActionBar from "../Component/ActionBar";
import ScreenHeader from "../Component/ScreenHeader";
import ConfirmDelete from "../Component/ConfirmDelete";

const COLUMNS = [
  { key: "id",          label: "ID" },
  { key: "codform",     label: "Código fórmula" },
  { key: "codart",      label: "Artículo vinculado" },
  { key: "descripcion", label: "Descripción" },
  { key: "formula",     label: "Fórmula" },
];

const EMPTY = { codform: "", codart: "", descripcion: "", formula: "" };

const CAMPOS_ARTICULO = [
  { key: "precio",   label: "Precio" },
  { key: "margen",   label: "Margen (tabla Márgenes)" },
  { key: "ancho",    label: "Ancho" },
  { key: "alto",     label: "Alto" },
  { key: "cantidad", label: "Cantidad" },
];

// ── Selector de artículo + campo para insertar variable en la fórmula ──
function InsertarVariable({ formulaRef, setForm, rubro, artsDeFamilia }) {
  const [artElegido, setArtElegido]     = useState(null);
  const [campoElegido, setCampoElegido] = useState("precio");

  // Reset when rubro changes
  useEffect(() => { setArtElegido(null); }, [rubro]);

  const insertar = () => {
    if (!artElegido) return;
    const variable = `${campoElegido}_${artElegido.codart}`;
    const el = formulaRef.current;
    if (el) {
      const start = el.selectionStart ?? el.value.length;
      const end   = el.selectionEnd   ?? el.value.length;
      setForm(p => ({
        ...p,
        formula: p.formula.slice(0, start) + variable + p.formula.slice(end)
      }));
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + variable.length, start + variable.length);
      }, 10);
    } else {
      setForm(p => ({ ...p, formula: p.formula + variable }));
    }
    setArtElegido(null);
    setCampoElegido("precio");
  };

  return (
    <div style={{
      background: "#f0f6fb", border: "1px solid #a0cce8", borderRadius: 6,
      padding: "12px 14px", marginBottom: 10
    }}>
      <div style={{ fontSize: 11, color: "#4a8ab5", letterSpacing: "1px",
        textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>
        ➕ Insertar dato de artículo en fórmula
      </div>

      {!rubro && (
        <p style={{ fontSize: 12, color: "#b0c0d0", fontStyle: "italic", marginBottom: 0 }}>
          Seleccioná un rubro arriba para elegir el artículo.
        </p>
      )}

      {rubro && (
        <>
          {/* Paso 1: elegir artículo de el rubro */}
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 10, color: "#6699bb", letterSpacing: "1px",
              textTransform: "uppercase", display: "block", marginBottom: 4 }}>
              1. Elegí el artículo
            </label>
            <select
              className="form-input"
              value={artElegido?.codart ?? ""}
              onChange={(e) => {
                const art = artsDeFamilia.find(a => a.codart === e.target.value);
                setArtElegido(art ?? null);
              }}
              style={{ cursor: "pointer", marginBottom: 0 }}
            >
              <option value="">— Seleccioná un artículo —</option>
              {artsDeFamilia.map(a => (
                <option key={a.codart} value={a.codart}>
                  {a.codart} — {a.articulo}
                  {a.precio ? ` ($${Number(a.precio).toLocaleString("es-AR")})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Paso 2: elegir campo + botón insertar */}
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 10, color: "#6699bb", letterSpacing: "1px",
                textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                2. Qué dato querés usar
              </label>
              <select
                className="form-input"
                value={campoElegido}
                onChange={(e) => setCampoElegido(e.target.value)}
                style={{ cursor: "pointer", marginBottom: 0 }}
                disabled={!artElegido}
              >
                {CAMPOS_ARTICULO.map(c => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={insertar}
              disabled={!artElegido}
              style={{
                padding: "10px 16px", borderRadius: 4, border: "none",
                background: artElegido ? "#2277bb" : "#ccc",
                color: "#fff", cursor: artElegido ? "pointer" : "not-allowed",
                fontFamily: "monospace", fontSize: 13, fontWeight: 700,
                whiteSpace: "nowrap", height: 42
              }}
            >
              Insertar → {artElegido ? `${campoElegido}_${artElegido.codart}` : "variable"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Selector para anidar otra fórmula ────────────────────────────────────────
function InsertarFormula({ formulaRef, setForm, formulas, codformActual }) {
  const [elegida, setElegida] = useState("");

  const insertar = () => {
    if (!elegida) return;
    const variable = `FORM_${elegida}`;
    const el = formulaRef.current;
    if (el) {
      const start = el.selectionStart ?? el.value.length;
      const end   = el.selectionEnd   ?? el.value.length;
      setForm(p => ({
        ...p,
        formula: p.formula.slice(0, start) + variable + p.formula.slice(end)
      }));
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + variable.length, start + variable.length);
      }, 10);
    } else {
      setForm(p => ({ ...p, formula: p.formula + variable }));
    }
    setElegida("");
  };

  // Excluir la fórmula actual para evitar referencia circular directa
  const disponibles = formulas.filter(f => f.codform !== codformActual);

  return (
    <div style={{
      background: "#f0fbf4", border: "1px solid #7ecba1", borderRadius: 6,
      padding: "12px 14px", marginBottom: 10
    }}>
      <div style={{ fontSize: 11, color: "#1a7a44", letterSpacing: "1px",
        textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>
        🔗 Anidar otra fórmula
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 10, color: "#2d8a55", letterSpacing: "1px",
            textTransform: "uppercase", display: "block", marginBottom: 4 }}>
            Elegí la fórmula a incluir
          </label>
          <select
            className="form-input"
            value={elegida}
            onChange={e => setElegida(e.target.value)}
            style={{ cursor: "pointer", marginBottom: 0 }}
          >
            <option value="">— Seleccioná una fórmula —</option>
            {disponibles.map(f => (
              <option key={f.codform} value={f.codform}>
                {f.codform}{f.codart ? ` (${f.codart})` : ""} — {f.formula.length > 40 ? f.formula.slice(0, 40) + "…" : f.formula}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={insertar}
          disabled={!elegida}
          style={{
            padding: "10px 16px", borderRadius: 4, border: "none",
            background: elegida ? "#1a7a44" : "#ccc",
            color: "#fff", cursor: elegida ? "pointer" : "not-allowed",
            fontFamily: "monospace", fontSize: 13, fontWeight: 700,
            whiteSpace: "nowrap", height: 42
          }}
        >
          Insertar → {elegida ? `FORM_${elegida}` : "fórmula"}
        </button>
      </div>
      {elegida && (
        <div style={{ marginTop: 8, fontSize: 11, color: "#2d8a55", fontStyle: "italic" }}>
          Se insertará <code style={{ background: "#d4f0e0", padding: "1px 5px", borderRadius: 3 }}>FORM_{elegida}</code> — el backend la resolverá al calcular.
        </div>
      )}
    </div>
  );
}

// ── Insertar margen del artículo vinculado (codart del form) ─────────────────
function InsertarMargen({ formulaRef, setForm, codart }) {
  const [margenInfo, setMargenInfo] = useState(null);
  const [cargando, setCargando]     = useState(false);

  useEffect(() => {
    if (!codart) { setMargenInfo(null); return; }
    setCargando(true);
    fetch(`http://localhost:3001/margen/buscar?q=${encodeURIComponent(codart)}`)
      .then(r => r.json())
      .then(data => {
        // Buscar coincidencia exacta de CODART
        const exacto = Array.isArray(data) ? data.find(d => d.CODART === codart) : null;
        setMargenInfo(exacto ?? null);
      })
      .catch(() => setMargenInfo(null))
      .finally(() => setCargando(false));
  }, [codart]);

  const insertar = () => {
    if (!codart) return;
    const variable = `margen_${codart}`;
    const el = formulaRef.current;
    if (el) {
      const start = el.selectionStart ?? el.value.length;
      const end   = el.selectionEnd   ?? el.value.length;
      setForm(p => ({
        ...p,
        formula: p.formula.slice(0, start) + variable + p.formula.slice(end)
      }));
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + variable.length, start + variable.length);
      }, 10);
    } else {
      setForm(p => ({ ...p, formula: p.formula + variable }));
    }
  };

  return (
    <div style={{
      background: "#f5f0fb", border: "1px solid #c0a8e8", borderRadius: 6,
      padding: "12px 14px", marginBottom: 10
    }}>
      <div style={{ fontSize: 11, color: "#7a4ab5", letterSpacing: "1px",
        textTransform: "uppercase", fontWeight: 700, marginBottom: 10 }}>
        📊 Insertar margen de artículo en fórmula
      </div>

      {!codart ? (
        <p style={{ fontSize: 12, color: "#b0a0cc", fontStyle: "italic" }}>
          Seleccioná un artículo vinculado arriba para ver su margen.
        </p>
      ) : cargando ? (
        <p style={{ fontSize: 12, color: "#9966cc" }}>Buscando margen...</p>
      ) : margenInfo ? (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, fontSize: 13, color: "#3a0a5c" }}>
            <strong>{margenInfo.ARTICULO}</strong>
            <span style={{ color: "#9966cc", marginLeft: 8, fontSize: 11 }}>{margenInfo.CODART}</span>
            <span style={{
              marginLeft: 10, background: "#ede8f8", border: "1px solid #c0a8e8",
              borderRadius: 3, padding: "2px 8px", color: "#7a4ab5",
              fontFamily: "monospace", fontSize: 12
            }}>
              Margen: {margenInfo.MARGEN}
            </span>
          </div>
          <button
            type="button"
            onClick={insertar}
            style={{
              padding: "9px 14px", borderRadius: 4, border: "none",
              background: "#7a4ab5", color: "#fff", cursor: "pointer",
              fontFamily: "monospace", fontSize: 12, fontWeight: 700,
              whiteSpace: "nowrap"
            }}
          >
            Insertar → margen_{codart}
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <p style={{ fontSize: 12, color: "#b0a0cc", fontStyle: "italic", flex: 1 }}>
            El artículo <strong>{codart}</strong> no tiene margen en la tabla Márgenes.
          </p>
          <button
            type="button"
            onClick={insertar}
            style={{
              padding: "9px 14px", borderRadius: 4, border: "none",
              background: "#9966cc", color: "#fff", cursor: "pointer",
              fontFamily: "monospace", fontSize: 12, fontWeight: 700,
              whiteSpace: "nowrap"
            }}
          >
            Insertar → margen_{codart}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function Formulas({ formulas, onSave, onDelete, selected, onSelect, modal, onOpenModal, onCloseModal }) {
  const [form, setForm]                 = useState(EMPTY);
  const [error, setError]               = useState("");
  const [search, setSearch]             = useState("");
  const [familias, setFamilias]         = useState([]);
  const [rubros, setRubros]             = useState([]);
  const [artsPorRubro, setArtsPorRubro] = useState([]);
  const [familiaElegida, setFamiliaElegida] = useState("");
  const [rubroElegido, setRubroElegido] = useState("");
  const formulaRef = useRef(null);
  const [verifResult, setVerifResult] = useState(null);

  const verificarFormula = async () => {
    if (!form.formula.trim()) {
      setVerifResult({ ok: false, error: "La fórmula está vacía." });
      return;
    }
    setVerifResult(null);
    // Valores de prueba para verificar
    const variables = { ancho: 100, alto: 200, cantidad: 1, colocacion: 5000 };
    const codart_modelo = form.codart || null;
    try {
      const res = await fetch("http://localhost:3001/formulas/verificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formula: form.formula, variables, codart_modelo }),
      });
      const data = await res.json();
      if (!res.ok) {
        setVerifResult({ ok: false, error: data.error ?? "Error desconocido." });
      } else {
        setVerifResult({ ok: true, resultado: data.resultado, preciosUsados: data.variables });
      }
    } catch {
      setVerifResult({ ok: false, error: "No se pudo conectar con el servidor." });
    }
  };

  // Cargar familias y rubros al abrir modal
  useEffect(() => {
    if (modal === "nuevo" || modal === "editar") {
      fetch("http://localhost:3001/articulos/familias-todas")
        .then(r => r.json())
        .then(data => setFamilias(Array.isArray(data) ? data : []))
        .catch(() => {});
      fetch("http://localhost:3001/articulos/rubros")
        .then(r => r.json())
        .then(data => setRubros(Array.isArray(data) ? data : []))
        .catch(() => {});
      if (modal === "nuevo") {
        setFamiliaElegida("");
        setRubroElegido("");
        setArtsPorRubro([]);
      }
    }
  }, [modal]);

  const elegirFamilia = (familia) => {
    setFamiliaElegida(familia);
    setRubroElegido("");
    setArtsPorRubro([]);
    setForm(p => ({ ...p, codart: "" }));
    if (familia) {
      fetch(`http://localhost:3001/articulos/rubros-por-familia?familia=${encodeURIComponent(familia)}`)
        .then(r => r.json())
        .then(data => setRubros(Array.isArray(data) ? data : []))
        .catch(() => {});
    } else {
      // Sin familia → recargar todos los rubros
      fetch("http://localhost:3001/articulos/rubros")
        .then(r => r.json())
        .then(data => setRubros(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  };

  const elegirRubro = (rubro) => {
    setRubroElegido(rubro);
    setForm(p => ({ ...p, codart: "" }));
    if (!rubro) { setArtsPorRubro([]); return; }
    fetch(`http://localhost:3001/articulos/por-rubro?rubro=${encodeURIComponent(rubro)}`)
      .then(r => r.json())
      .then(data => setArtsPorRubro(Array.isArray(data) ? data : []))
      .catch(() => {});
  };

  const filtered = formulas.filter((f) => {
    const q = search.toLowerCase();
    return (
      (f.codform     ?? "").toLowerCase().includes(q) ||
      (f.codart      ?? "").toLowerCase().includes(q) ||
      (f.descripcion ?? "").toLowerCase().includes(q) ||
      (f.formula     ?? "").toLowerCase().includes(q)
    );
  });

  const openNew = () => {
    setForm(EMPTY);
    setError("");
    setFamiliaElegida("");
    setRubroElegido("");
    setArtsPorRubro([]);
    onOpenModal("nuevo");
  };

  const openEdit = async () => {
    if (!selected) return;
    setForm({
      codform:     selected.codform     ?? "",
      codart:      selected.codart      ?? "",
      descripcion: selected.descripcion ?? "",
      formula:     selected.formula     ?? "",
    });
    setError("");
    setFamiliaElegida("");
    setRubroElegido("");
    setArtsPorRubro([]);
    onOpenModal("editar");

    // Si tiene codart, buscar su rubro y familia para precargar los dropdowns
    if (selected.codart) {
      try {
        const res = await fetch(`http://localhost:3001/articulos/rubro-de?codart=${encodeURIComponent(selected.codart)}`);
        const data = await res.json();
        if (data.rubro) {
          setRubroElegido(data.rubro);
          // Cargar artículos de ese rubro
          const res2 = await fetch(`http://localhost:3001/articulos/por-rubro?rubro=${encodeURIComponent(data.rubro)}`);
          const arts = await res2.json();
          setArtsPorRubro(Array.isArray(arts) ? arts : []);
        }
        if (data.familia) {
          setFamiliaElegida(data.familia);
          // Filtrar rubros por esa familia
          const res3 = await fetch(`http://localhost:3001/articulos/rubros-por-familia?familia=${encodeURIComponent(data.familia)}`);
          const rubsFam = await res3.json();
          if (Array.isArray(rubsFam) && rubsFam.length > 0) setRubros(rubsFam);
        }
      } catch { /* silencioso */ }
    }
  };

  const handleSubmit = async () => {
    if (!form.codform.trim()) { setError("El código es obligatorio."); return; }
    if (!form.formula.trim()) { setError("La fórmula es obligatoria."); return; }

    if (modal === "nuevo") {
      try {
        const res = await fetch("http://localhost:3001/formulas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (res.status === 409) { setError(data.error); return; }
        if (!res.ok) { setError(data.error ?? "Error al guardar."); return; }
        onSave({ ...form, id: data.id, _skipPost: true });
        onCloseModal();
        setForm(EMPTY);
      } catch { setError("Error de conexión con el servidor."); }
    } else {
      onSave({ ...form, id: selected.id });
      onCloseModal();
      setForm(EMPTY);
      setVerifResult(null);
    }
  };

  return (
    <>
      <ScreenHeader icon="🧮" title="Fórmulas" subtitle="Gestión de fórmulas de cálculo" />

      <ActionBar
        selected={selected} onNew={openNew} onEdit={openEdit}
        onDelete={() => selected && onOpenModal("eliminar")}
        search={search} onSearch={setSearch}
      />

      <DataTable columns={COLUMNS} rows={filtered} selectedId={selected?.id} onSelect={onSelect} />

      {(modal === "nuevo" || modal === "editar") && (
        <Modal
          title={modal === "nuevo" ? "Nueva fórmula" : "Editar fórmula"}
          onClose={onCloseModal}
        >
          {error && <p className="form-error">{error}</p>}

          {/* Código */}
          <div className="form-group">
            <label className="form-label">Código fórmula *</label>
            <input
              className="form-input"
              placeholder="Ej: FPF, FCORR, FBOX"
              value={form.codform}
              onChange={(e) => setForm(p => ({ ...p, codform: e.target.value }))}
            />
          </div>

          {/* Descripción */}
          <div className="form-group">
            <label className="form-label">Descripción</label>
            <input
              className="form-input"
              placeholder="Ej: Costo de paneles laterales, Herraje corredera simple..."
              value={form.descripcion}
              onChange={(e) => setForm(p => ({ ...p, descripcion: e.target.value }))}
            />
          </div>

          {/* Familia → Rubro → Codart cascada */}
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Familia del artículo</label>
              <select
                className="form-input"
                value={familiaElegida}
                onChange={(e) => elegirFamilia(e.target.value)}
                style={{ cursor: "pointer" }}
              >
                <option value="">— Todas las familias —</option>
                {familias.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Rubro del artículo</label>
              <select
                className="form-input"
                value={rubroElegido}
                onChange={(e) => elegirRubro(e.target.value)}
                style={{ cursor: "pointer" }}
              >
                <option value="">— Seleccioná un rubro —</option>
                {rubros.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Artículo vinculado (codart)</label>
            {rubroElegido ? (
              <select
                className="form-input"
                value={form.codart}
                onChange={(e) => setForm(p => ({ ...p, codart: e.target.value }))}
                style={{ cursor: "pointer" }}
              >
                <option value="">— Seleccioná un artículo —</option>
                {/* Opción genérica: aplica a todos los artículos del rubro */}
                <option value={`RUBRO:${rubroElegido}`}>
                  🔹 Genérico — todo el rubro {rubroElegido}
                </option>
                {artsPorRubro.map(a => (
                  <option key={a.codart} value={a.codart}>
                    {a.codart} — {a.articulo}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className="form-input"
                placeholder="Seleccioná un rubro arriba o ingresá el código manualmente"
                value={form.codart}
                onChange={(e) => setForm(p => ({ ...p, codart: e.target.value }))}
              />
            )}
            {/* Indicador cuando se eligió la opción genérica */}
            {form.codart?.startsWith("RUBRO:") && (
              <div style={{
                marginTop: 6, padding: "6px 10px", borderRadius: 4,
                background: "#e8f4fd", border: "1px solid #90caf9",
                fontSize: 11, color: "#1565c0"
              }}>
                ℹ️ Esta fórmula aplica a <strong>todos los artículos del rubro {form.codart.slice(6)}</strong> que no tengan una fórmula específica.
              </div>
            )}
          </div>

          {/* Fórmula con insertor de variables */}
          <div className="form-group">
            <label className="form-label">Fórmula *</label>
            <InsertarVariable
              formulaRef={formulaRef}
              setForm={setForm}
              rubro={rubroElegido}
              artsDeFamilia={artsPorRubro}
            />
            <InsertarMargen formulaRef={formulaRef} setForm={setForm} codart={form.codart} />
            <InsertarFormula
              formulaRef={formulaRef}
              setForm={setForm}
              formulas={formulas}
              codformActual={form.codform}
            />
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                ref={formulaRef}
                className="form-input"
                placeholder="Ej: ancho * alto * precio_KITMP000"
                value={form.formula}
                onChange={(e) => { setForm(p => ({ ...p, formula: e.target.value })); setVerifResult(null); }}
                style={{ flex: 1, marginBottom: 0 }}
              />
              <button
                type="button"
                onClick={verificarFormula}
                style={{
                  padding: "10px 16px", borderRadius: 4, border: "1.5px solid #2277bb",
                  background: "#fff", color: "#2277bb", cursor: "pointer",
                  fontFamily: "monospace", fontSize: 13, fontWeight: 700,
                  whiteSpace: "nowrap"
                }}
              >
                ✓ Verificar
              </button>
            </div>

            {/* Resultado de verificación */}
            {verifResult && (
              <div style={{
                marginTop: 8, padding: "10px 14px", borderRadius: 5, fontSize: 12,
                background: verifResult.ok ? "#e8f8f0" : "#fdf0f0",
                border: `1px solid ${verifResult.ok ? "#6dcc99" : "#f0a0a0"}`,
                color: verifResult.ok ? "#1a7a44" : "#c0392b",
              }}>
                {verifResult.ok ? (
                  <>
                    <strong>✅ Fórmula válida</strong><br/>
                    Resultado con valores de prueba
                    (ancho=100, alto=200, cantidad=1, colocacion=5000):<br/>
                    <strong style={{ fontSize: 15 }}>= {verifResult.resultado}</strong>
                    {verifResult.preciosUsados && Object.keys(verifResult.preciosUsados).length > 0 && (
                      <div style={{ marginTop: 6, fontSize: 11, color: "#2d7a50" }}>
                        Precios usados de BD: {Object.entries(verifResult.preciosUsados)
                          .filter(([k]) => k.startsWith("precio_") && k !== "precio_vidrio" && k !== "precio")
                          .map(([k, v]) => `${k} = $${Number(v).toLocaleString("es-AR")}`)
                          .join(" · ")}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <strong>❌ Error en la fórmula</strong><br/>
                    {verifResult.error}
                  </>
                )}
              </div>
            )}
            <div style={{ marginTop: 8, padding: "10px 12px", background: "#f0f6fb",
              border: "1px solid #c0d8ee", borderRadius: 5, fontSize: 11, lineHeight: 1.8, color: "#4a6a80" }}>
              <strong style={{ color: "#0a3a5c" }}>Variables del usuario</strong> (valores ingresados en el presupuesto):<br/>
              <code style={{ background: "#e0eef8", padding: "1px 5px", borderRadius: 3, marginRight: 4 }}>ancho</code>
              <code style={{ background: "#e0eef8", padding: "1px 5px", borderRadius: 3, marginRight: 4 }}>alto</code>
              <code style={{ background: "#e0eef8", padding: "1px 5px", borderRadius: 3, marginRight: 4 }}>cantidad</code>
              <code style={{ background: "#e0eef8", padding: "1px 5px", borderRadius: 3 }}>colocacion</code>
              <br/>
              <strong style={{ color: "#0a3a5c" }}>Variables de artículo</strong> (datos traídos de la BD):<br/>
              <code style={{ background: "#e0eef8", padding: "1px 5px", borderRadius: 3, marginRight: 4 }}>precio_CODART</code>
              <code style={{ background: "#e0eef8", padding: "1px 5px", borderRadius: 3, marginRight: 4 }}>ancho_CODART</code>
              <code style={{ background: "#e0eef8", padding: "1px 5px", borderRadius: 3 }}>alto_CODART</code>
              <br/>
              <strong style={{ color: "#1a7a44" }}>Fórmulas anidadas</strong> (referencias a otras fórmulas):<br/>
              <code style={{ background: "#d4f0e0", padding: "1px 5px", borderRadius: 3, marginRight: 4 }}>FORM_CODFORMULA</code>
              <span style={{ fontSize: 10, color: "#2d8a55" }}>el resultado de esa fórmula se reemplaza aquí</span>
              <br/>
              <strong style={{ color: "#c0392b" }}>⚠️ Importante:</strong> usá minúsculas y <code style={{ background: "#e0eef8", padding: "1px 4px", borderRadius: 3 }}>*</code> para multiplicar.<br/>
              <strong style={{ color: "#2d7fc1" }}>Ejemplo anidado:</strong>{" "}
              <code style={{ background: "#dff0fb", padding: "2px 7px", borderRadius: 3, color: "#0a3a5c" }}>
                FORM_FBASE + FORM_FMATERIAL * cantidad
              </code>
            </div>
          </div>

          <div className="form-actions">
            <button className="btn-cancel" onClick={onCloseModal}>Cancelar</button>
            <button className="btn-save" onClick={handleSubmit}>
              {modal === "nuevo" ? "Guardar" : "Actualizar"}
            </button>
          </div>
        </Modal>
      )}

      {modal === "eliminar" && (
        <ConfirmDelete item={selected} onConfirm={onDelete} onClose={onCloseModal} />
      )}
    </>
  );
}
