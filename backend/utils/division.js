export const ALLOWED_DIVISIONS = ["A", "B", "C", "D"];
export const STORED_DIVISIONS = ["A", "B"];

export const mapDivision = (division) => {
  const value = String(division || "").trim().toUpperCase();
  if (value === "C") return "A";
  if (value === "D") return "B";
  return value;
};

export const getMappedDisplayDivisions = (storedDivision) => {
  const normalized = mapDivision(storedDivision);
  if (normalized === "A") return ["A", "C"];
  if (normalized === "B") return ["B", "D"];
  return [];
};
