import { useState, useEffect } from "react";

export function useCrud(endpoint, name = "Registro", addLog = () => {}) {
  const API = "http://localhost:3001";

  const [data, setData] = useState([]);
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cargar datos iniciales
  const fetchData = async () => {
    try {
      const res = await fetch(`${API}/${endpoint}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(`Error cargando ${endpoint}`, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // CREAR / EDITAR
  const onSave = async (item) => {
    try {
      const exists = data.find((r) => r.id === item.id);

      if (exists) {
        await fetch(`${API}/${endpoint}/${item.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });

        addLog(`✏️ ${name} actualizado: ${item.nombre}`);
      } else {
        await fetch(`${API}/${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });

        addLog(`💾 ${name} guardado: ${item.nombre}`);
      }

      fetchData();
      setModal(null);
      setSelected(null);
    } catch (err) {
      console.error("Error guardando", err);
    }
  };

  // ELIMINAR
  const onDelete = async (id) => {
    try {
      await fetch(`${API}/${endpoint}/${id}`, {
        method: "DELETE",
      });

      addLog(`🗑 ${name} eliminado`);

      fetchData();
      setSelected(null);
      setModal(null);
    } catch (err) {
      console.error("Error eliminando", err);
    }
  };

  // SELECCIONAR
  const onSelect = (row) => {
    setSelected((prev) => (prev?.id === row?.id ? null : row));
  };

  const onOpenModal = (type) => setModal(type);
  const onCloseModal = () => setModal(null);

  return {
    data,
    loading,
    selected,
    modal,
    onSave,
    onDelete,
    onSelect,
    onOpenModal,
    onCloseModal,
    refresh: fetchData,
  };
}
