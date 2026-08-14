export const PRODUCT_CATEGORIES = [
  { value: "general", label: "General" },
  { value: "hombre", label: "Hombre" },
  { value: "mujer", label: "Mujer" },
  { value: "calzado", label: "Calzado" },
  { value: "accesorios", label: "Accesorios" },
  { value: "otros", label: "Otros" },
];

export const PRODUCT_SUBCATEGORIES = [
  "Zapatillas",
  "Remeras",
  "Pantalones",
  "Shorts",
  "Buzos",
  "Camperas",
  "Vestidos",
  "Tops",
  "Mochilas",
  "Auriculares",
  "Botellas",
  "Otros",
];

export function cleanText(value, max = 10000) {
  return String(value ?? "").trim().slice(0, max);
}

export function parseCommaList(value, maxItems = 20) {
  const seen = new Set();
  return cleanText(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => {
      const key = item.toLocaleLowerCase("es-AR");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, maxItems);
}

export function extractHashtags(description, maxItems = 20) {
  const matches = cleanText(description).match(/#[\p{L}\p{N}_-]+/gu) || [];
  const seen = new Set();

  return matches
    .map((tag) => tag.slice(1).toLocaleLowerCase("es-AR").slice(0, 80))
    .filter(Boolean)
    .filter((tag) => {
      if (seen.has(tag)) return false;
      seen.add(tag);
      return true;
    })
    .slice(0, maxItems);
}

export function buildVariantKey(size, color) {
  const normalizedSize = cleanText(size, 80).toLocaleLowerCase("es-AR");
  const normalizedColor = cleanText(color, 80).toLocaleLowerCase("es-AR");
  return `${normalizedSize}|${normalizedColor}`;
}

export function normalizeRating(value) {
  const rating = Number(value);
  return Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : null;
}
