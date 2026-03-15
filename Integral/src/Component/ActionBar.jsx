export default function ActionBar({ selected, onNew, onEdit, onDelete, search, onSearch }) {
  return (
    <div className="action-bar">
      <button className="btn-action btn-nuevo" onClick={onNew}>＋ Nuevo</button>
      <button className="btn-action btn-editar" onClick={onEdit} disabled={!selected}>✏️ Editar</button>
      <button className="btn-action btn-eliminar" onClick={onDelete} disabled={!selected}>🗑 Eliminar</button>

      <div className="search-wrap">
        <span className="search-icon">🔍</span>
        <input
          className="search-input"
          type="text"
          placeholder="Buscar..."
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
        {search && (
          <button className="search-clear" onClick={() => onSearch("")}>✕</button>
        )}
      </div>

      {selected && (
        <span className="selected-info">
          Seleccionado: <span>{selected.nombre ?? selected.articulo}</span>
        </span>
      )}
    </div>
  );
}
