import React from "react";

function StatusPill({ status }) {
  const normalized = String(status || "unknown").toLowerCase();
  
  let type = "inactive";
  if (["safe", "active", "completed"].includes(normalized)) type = "safe";
  if (["warning", "drowsy", "distracted", "unread", "pending"].includes(normalized)) type = "warning";
  if (["critical", "terminated"].includes(normalized)) type = "critical";
  if (["acknowledged"].includes(normalized)) type = "acknowledged";

  // Use exact status as class if it exists in CSS
  const className = `status-pill ${normalized} ${type}`;
  
  return <span className={className}>{status}</span>;
}

export default StatusPill;
