function RiskPill({ level }) {
  const normalized = String(level || "unknown").toLowerCase();
  const safeLevel = ["low", "medium", "high", "critical"].includes(normalized)
    ? normalized
    : "unknown";
  const className = `risk-pill ${safeLevel}`;
  const label = safeLevel === "unknown" ? "N/A" : safeLevel;
  return <span className={className}>{label}</span>;
}

export default RiskPill;
