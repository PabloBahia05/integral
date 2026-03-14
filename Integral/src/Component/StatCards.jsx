export default function StatCards({ stats }) {
  return (
    <div className="stats-row">
      {stats.map(({ label, value }) => (
        <div className="stat-card" key={label}>
          <div className="stat-num">{value}</div>
          <div className="stat-label">{label}</div>
        </div>
      ))}
    </div>
  );
}
