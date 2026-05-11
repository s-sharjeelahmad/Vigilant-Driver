import React from "react";

function RiskPill({ level }) {
  const normalized = String(level || "unknown").toLowerCase();
  
  let type = "inactive";
  if (normalized === "low") type = "safe";
  if (normalized === "medium") type = "warning";
  if (normalized === "high" || normalized === "critical") type = "critical";
  
  const className = `status-pill ${type}`;
  const label = normalized === "unknown" ? "N/A" : normalized;
  
  return <span className={className}>{label}</span>;
}

export default RiskPill;
