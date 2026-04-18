import { useState } from "react";
import ScreenHeader from "../Component/ScreenHeader";
import Clientes from "./Clientes";
import Productos from "./Productos";
import MamparasTipos from "./MamparasTipos";
import TiposVanitory from "./TiposVanitory";
import TiposEscritorio from "./TiposEscritorio";
import TiposDespensero from "./TiposDespensero";
import Formulas from "./Formulas";
import Margen from "./Margen";
import PresupuestosMamparasTabla from "./PresupuestosMamparasTabla";
import Colocacion from "./Colocacion";
import Asociaciones from "./Asociaciones";
import AsociacionesForm from "./AsociacionesForm";
import Lista from "./Lista";
import Proveedores from "./Proveedores"; // ← nuevo

const TABLAS = [
  { id: "clientes", label: "Clientes", icon: "👥", color: "#eb56d7" },
  { id: "productos", label: "Productos", icon: "🛒", color: "#ff6b6b" },
  {
    id: "mamparas-tipos",
    label: "Tipos de Mampara",
    icon: "🪟",
    color: "#c77dff",
  },
  {
    id: "vanitory-tipos",
    label: "Tipos de Vanitory",
    icon: "🛁",
    color: "#00b4d8",
  },
  {
    id: "escritorio-tipos",
    label: "Tipos de Escritorio",
    icon: "🖥️",
    color: "#f4a261",
  },
  {
    id: "despensero-tipos",
    label: "Tipos de Despensero",
    icon: "🗄️",
    color: "#2ec4b6",
  },
  { id: "formulas", label: "Fórmulas", icon: "🧮", color: "#e63946" },
  { id: "margen", label: "Márgenes", icon: "📊", color: "#2a9d8f" },
  {
    id: "presupuestos-mamparas-tabla",
    label: "Presupuestos Mamparas",
    icon: "📋",
    color: "#4361ee",
  },
  { id: "colocacion", label: "Colocación", icon: "📐", color: "#f77f00" },
  { id: "asociaciones", label: "Asociaciones", icon: "🔗", color: "#6a994e" },
  {
    id: "asociaciones-form",
    label: "Asoc. Fórmulas",
    icon: "🧮",
    color: "#e63946",
  },
  { id: "lista", label: "Lista Margen", icon: "📊", color: "#20b2aa" },
  { id: "proveedores", label: "Proveedores", icon: "🏭", color: "#7b5ea7" }, // ← nuevo
];

export default function VerTablas({
  clientes,
  clientesCRUD,
  selectedCliente,
  productos,
  productosCRUD,
  selectedProducto,
  mamparasTipos,
  mamparasTiposCRUD,
  selectedMamparaTipo,
  tiposVanitory,
  tiposVanitoryRUD,
  selectedTipoVanitory,
  tiposEscritorio,
  tiposEscritorioRUD,
  selectedTipoEscritorio,
  tiposDespensero,
  tiposDespenseroRUD,
  selectedTipoDespensero,
  formulas,
  formulasCRUD,
  selectedFormula,
  margen,
  margenCRUD,
  selectedMargen,
  presupuestosMamparas,
  presupuestosMamparasCRUD,
  selectedPresupuestoMampara,
  colocaciones,
  colocacionesCRUD,
  selectedColocacion,
  asociaciones,
  asociacionesCRUD,
  selectedAsociacion,
  asociacionesForm,
  asociacionesFormCRUD,
  selectedAsociacionForm,
  listas,
  onSaveLista,
  onDeleteLista,
  // ── proveedores ──
  proveedores,
  proveedoresCRUD,
  selectedProveedor,
}) {
  const [tablaActiva, setTablaActiva] = useState(null);
  const [modal, setModal] = useState(null);
  const [selectedLista, setSelectedLista] = useState(null);

  const volver = () => {
    setTablaActiva(null);
    setModal(null);
  };

  const back = (
    <button className="ver-tablas-back" onClick={volver}>
      ← Volver a tablas
    </button>
  );

  const localCRUD = (crud) => ({
    ...crud,
    onOpenModal: (m) => setModal(m),
    onCloseModal: () => setModal(null),
  });

  if (tablaActiva === "clientes")
    return (
      <div>
        {back}
        <Clientes
          clientes={clientes}
          selected={selectedCliente}
          modal={modal}
          {...localCRUD(clientesCRUD)}
        />
      </div>
    );
  if (tablaActiva === "productos")
    return (
      <div>
        {back}
        <Productos
          productos={productos}
          selected={selectedProducto}
          modal={modal}
          {...localCRUD(productosCRUD)}
        />
      </div>
    );
  if (tablaActiva === "mamparas-tipos")
    return (
      <div>
        {back}
        <MamparasTipos
          mamparasTipos={mamparasTipos}
          selected={selectedMamparaTipo}
          modal={modal}
          {...localCRUD(mamparasTiposCRUD)}
        />
      </div>
    );
  if (tablaActiva === "vanitory-tipos")
    return (
      <div>
        {back}
        <TiposVanitory
          tiposVanitory={tiposVanitory ?? []}
          selected={selectedTipoVanitory}
          modal={modal}
          {...localCRUD(tiposVanitoryRUD ?? {})}
        />
      </div>
    );
  if (tablaActiva === "escritorio-tipos")
    return (
      <div>
        {back}
        <TiposEscritorio
          tiposEscritorio={tiposEscritorio ?? []}
          selected={selectedTipoEscritorio}
          modal={modal}
          {...localCRUD(tiposEscritorioRUD ?? {})}
        />
      </div>
    );
  if (tablaActiva === "despensero-tipos")
    return (
      <div>
        {back}
        <TiposDespensero
          tiposDespensero={tiposDespensero ?? []}
          selected={selectedTipoDespensero}
          modal={modal}
          {...localCRUD(tiposDespenseroRUD ?? {})}
        />
      </div>
    );
  if (tablaActiva === "formulas")
    return (
      <div>
        {back}
        <Formulas
          formulas={formulas ?? []}
          selected={selectedFormula}
          modal={modal}
          {...localCRUD(formulasCRUD ?? {})}
        />
      </div>
    );
  if (tablaActiva === "margen")
    return (
      <div>
        {back}
        <Margen
          margen={margen ?? []}
          selected={selectedMargen}
          modal={modal}
          {...localCRUD(margenCRUD ?? {})}
        />
      </div>
    );
  if (tablaActiva === "presupuestos-mamparas-tabla")
    return (
      <div>
        {back}
        <PresupuestosMamparasTabla
          presupuestos={presupuestosMamparas ?? []}
          selected={selectedPresupuestoMampara}
          modal={modal}
          {...localCRUD(presupuestosMamparasCRUD ?? {})}
          onSelect={(row) => presupuestosMamparasCRUD?.onSelect?.(row)}
        />
      </div>
    );
  if (tablaActiva === "colocacion")
    return (
      <div>
        {back}
        <Colocacion
          colocaciones={colocaciones ?? []}
          productos={productos ?? []}
          selected={selectedColocacion}
          modal={modal}
          {...localCRUD(colocacionesCRUD ?? {})}
          onSelect={(row) => colocacionesCRUD?.onSelect?.(row)}
        />
      </div>
    );

  if (tablaActiva === "asociaciones")
    return (
      <div>
        {back}
        <Asociaciones
          asociaciones={asociaciones ?? []}
          productos={productos ?? []}
          selected={selectedAsociacion}
          modal={modal}
          {...localCRUD(asociacionesCRUD ?? {})}
          onSelect={(row) => asociacionesCRUD?.onSelect?.(row)}
        />
      </div>
    );

  if (tablaActiva === "asociaciones-form")
    return (
      <div>
        {back}
        <AsociacionesForm
          asociacionesForm={asociacionesForm ?? []}
          productos={productos ?? []}
          selected={selectedAsociacionForm}
          modal={modal}
          {...localCRUD(asociacionesFormCRUD ?? {})}
          onSelect={(row) => asociacionesFormCRUD?.onSelect?.(row)}
        />
      </div>
    );

  if (tablaActiva === "lista")
    return (
      <div>
        {back}
        <Lista
          listas={listas ?? []}
          selected={selectedLista}
          modal={modal}
          onSave={onSaveLista}
          onDelete={onDeleteLista}
          onOpenModal={(m) => setModal(m)}
          onCloseModal={() => setModal(null)}
          onSelect={(row) =>
            setSelectedLista(row?.id === selectedLista?.id ? null : row)
          }
        />
      </div>
    );

  // ── proveedores ──
  if (tablaActiva === "proveedores")
    return (
      <div>
        {back}
        <Proveedores
          proveedores={proveedores ?? []}
          selected={selectedProveedor}
          modal={modal}
          {...localCRUD(proveedoresCRUD ?? {})}
          onSelect={(row) => proveedoresCRUD?.onSelect?.(row)}
        />
      </div>
    );

  return (
    <>
      <ScreenHeader
        icon="🗃️"
        title="Ver Tablas"
        subtitle="Seleccioná una tabla para gestionar"
      />
      <div className="presup-grid">
        {TABLAS.map((tabla) => (
          <button
            key={tabla.id}
            className="presup-card ver-tablas-card"
            style={{ "--card-accent": tabla.color }}
            onClick={() => setTablaActiva(tabla.id)}
          >
            <span className="presup-icon">{tabla.icon}</span>
            <span className="presup-label">{tabla.label}</span>
          </button>
        ))}
      </div>
    </>
  );
}
