export const mapDivision = (div) => {
  const value = String(div || "").trim().toUpperCase();
  if (value === "C") return "A";
  if (value === "D") return "B";
  return value;
};

export const isDivisionAllowed = (div) => ["A", "B", "C", "D"].includes(String(div || "").trim().toUpperCase());
