export default function ActionButton({ label, icon, color, isActive, onClick }) {
  return (
    <button
      className={`btn${isActive ? " active" : ""}`}
      style={{ "--accent": color }}
      onClick={onClick}
    >
      <span className="icon">{icon}</span>
      {label}
    </button>
  );
}
