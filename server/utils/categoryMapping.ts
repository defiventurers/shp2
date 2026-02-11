const RAW_TO_CATEGORY: Record<string, string> = {
  TABLET: "TABLETS",
  TABLETS: "TABLETS",
  CAPSULE: "CAPSULES",
  CAPSULES: "CAPSULES",
  SYRUP: "SYRUPS",
  SYRUPS: "SYRUPS",
  INJECTION: "INJECTIONS",
  INJECTIONS: "INJECTIONS",
  "DIABETIC INJECTION": "INJECTIONS",
  "DIABETIC INJECTIONS": "INJECTIONS",
  TOPICAL: "TOPICALS",
  TOPICALS: "TOPICALS",
  DROP: "DROPS",
  DROPS: "DROPS",
  POWDER: "POWDERS",
  POWDERS: "POWDERS",
  MOUTHWASH: "MOUTHWASH",
  INHALER: "INHALERS",
  INHALERS: "INHALERS",
  DEVICE: "DEVICES",
  DEVICES: "DEVICES",
  SCRUB: "SCRUBS",
  SCRUBS: "SCRUBS",
  SOLUTION: "SOLUTIONS",
  SOLUTIONS: "SOLUTIONS",
  OTHERS: "NO CATEGORY",
  OTHER: "NO CATEGORY",
  "NO CATEGORY": "NO CATEGORY",
  "": "NO CATEGORY",
};

export function normalizeToken(value: string | null | undefined): string {
  return (value || "")
    .trim()
    .toUpperCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

export function resolveCategoryNameFromRaw(
  sourceFile: string | null | undefined,
  category: string | null | undefined,
): string {
  const sourceToken = normalizeToken(sourceFile);
  const categoryToken = normalizeToken(category);

  return (
    RAW_TO_CATEGORY[sourceToken] ||
    RAW_TO_CATEGORY[categoryToken] ||
    (categoryToken && RAW_TO_CATEGORY[categoryToken.replace(/S$/, "")]) ||
    "NO CATEGORY"
  );
}

export function sourceTokensForCategory(categoryName: string): string[] {
  const target = normalizeToken(categoryName);
  const entries = Object.entries(RAW_TO_CATEGORY)
    .filter(([, mapped]) => mapped === target)
    .map(([raw]) => raw)
    .filter(Boolean);

  if (!entries.includes(target)) entries.push(target);
  return Array.from(new Set(entries));
}
