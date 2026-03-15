export default function FormField({ label, field, form, setForm, placeholder }) {
  const value = form[field] ?? "";
  const isPhoto = field === "artfoto";

  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input
        className="form-input"
        value={value}
        onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
        placeholder={placeholder}
      />
      {isPhoto && value && (
        <div className="img-preview-wrap">
          <img
            src={value}
            alt="Preview"
            className="img-preview"
            onError={e => { e.target.style.display = "none"; }}
            onLoad={e  => { e.target.style.display = "block"; }}
          />
        </div>
      )}
    </div>
  );
}
