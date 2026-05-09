const PST_TIMEZONE = "Asia/Karachi";

export function formatDateTimeUS(timestamp) {
  if (!timestamp) {
    return "-";
  }

  if (
    typeof timestamp === "string" &&
    /^\d{1,2}\/\d{1,2}\/\d{4},\s\d{1,2}:\d{2}:\d{2}\s(?:AM|PM)$/i.test(timestamp)
  ) {
    return timestamp;
  }

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("en-US", {
    timeZone: PST_TIMEZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
}

export function formatDisplayValue(value) {
  if (value === null || value === undefined) {
    return "-";
  }

  if (typeof value === "number") {
    return value === 0 ? "-" : String(value);
  }

  if (typeof value === "string") {
    return value.trim() === "" ? "-" : value;
  }

  return String(value);
}
