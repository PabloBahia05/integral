export default function ActionBar({ selected, onNew, onEdit, onDelete }) {
  return (
    <div className="action-bar">
      <button className="btn-action btn-nuevo" onClick={onNew}>＋ Nuevo</button>
      <button className="btn-action btn-editar" onClick={onEdit} disabled={!selected}>✏️ Editar</button>
      <button className="btn-action btn-eliminar" onClick={onDelete} disabled={!selected}>🗑 Eliminar</button>
      {selected && (
        <span className="selected-info">
          Seleccionado: <span>{selected.nombre}</span>
        </span>
      )}
    </div>
  );
}
