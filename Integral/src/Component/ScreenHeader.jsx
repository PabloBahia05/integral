export default function ScreenHeader({ icon, title, subtitle }) {
  return (
    <div className="screen-header">
      <h1 className="screen-title">{icon} {title}</h1>
      <p className="screen-subtitle">{subtitle}</p>
    </div>
  );
}
