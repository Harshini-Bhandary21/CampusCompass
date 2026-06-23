export type ClassValue = string | number | boolean | undefined | null | { [key: string]: any };

export function cn(...inputs: ClassValue[]): string {
  const classes: string[] = [];

  for (const input of inputs) {
    if (!input) continue;

    if (typeof input === "string" || typeof input === "number") {
      classes.push(String(input));
    } else if (typeof input === "object") {
      for (const [key, value] of Object.entries(input)) {
        if (value) {
          classes.push(key);
        }
      }
    }
  }

  return classes.join(" ");
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function getCategoryColor(category: string): string {
  switch (category) {
    case "technical":
      return "from-blue-500 to-cyan-500";
    case "cultural":
      return "from-purple-500 to-pink-500";
    case "recreational":
      return "from-emerald-500 to-teal-500";
    default:
      return "from-blue-500 to-purple-500";
  }
}

export function getCategoryBg(category: string): string {
  switch (category) {
    case "technical":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "cultural":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "recreational":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}
