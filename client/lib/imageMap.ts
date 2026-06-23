const clubImages: Record<string, string> = {
  aalekh: "/assets/clubs/aalekh.jpg",
  aero: "/assets/clubs/aero.jpg",
  autosports: "/assets/clubs/autosports.jpg",
  codechef: "/assets/clubs/codechef.jpg",
  dsc: "/assets/clubs/dsc.jpg",
  "digital-design": "/assets/clubs/digital-design.jpg",
  drama: "/assets/clubs/drama.jpg",
  "foreign-language": "/assets/clubs/foreign-language.jpg",
  girlscript: "/assets/clubs/girlscript.jpg",
  goonj: "/assets/clubs/goonj.jpg",
  "ignited-minds": "/assets/clubs/ignited-minds.jpg",
  "menace-dance": "/assets/clubs/menace-dance.jpg",
  mozilla: "/assets/clubs/mozilla.jpg",
  prakruti: "/assets/clubs/prakruti.jpg",
  robotics: "/assets/clubs/robotics.jpg",
  rotaract: "/assets/clubs/rotaract.jpg",
  spark: "/assets/clubs/spark.jpg",
  sports: "/assets/clubs/sports.jpg",
  srujan: "/assets/clubs/srujan.jpg",
  "spiritual-minds": "/assets/clubs/spiritual-minds.jpg",
  shutterbugs: "/assets/clubs/shutterbugs.jpg",
  maths: "/assets/clubs/maths.jpg",
  yoga: "/assets/clubs/yoga.jpg",
  vertex: "/assets/clubs/vertex.jpg",
};

const categoryGradients: Record<string, string> = {
  technical: "from-sky-200 via-blue-100 to-sky-50",
  cultural: "from-purple-200 via-pink-100 to-purple-50",
  recreational: "from-emerald-200 via-teal-100 to-emerald-50",
};

const categoryColors: Record<string, { bg: string; text: string }> = {
  technical: { bg: "#e0f2fe", text: "#0369a1" },
  cultural: { bg: "#f3e8ff", text: "#6d28d9" },
  recreational: { bg: "#dcfce7", text: "#047857" },
};

export function getClubImage(slugOrId: string): string {
  return clubImages[slugOrId] || `/assets/clubs/default.jpg`;
}

export function getFallbackGradient(category: string): string {
  return categoryGradients[category] || categoryGradients.technical;
}

export function getCategoryColors(category: string) {
  return categoryColors[category] || categoryColors.technical;
}

export function generateFallbackSVG(
  name: string,
  category: string = "technical"
): string {
  const colors = getCategoryColors(category);
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${colors.bg};stop-opacity:0.9" />
          <stop offset="100%" style="stop-color:${colors.bg};stop-opacity:0.6" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#grad)" rx="16"/>
      <text x="200" y="160" font-family="system-ui,sans-serif" font-size="64" font-weight="700" fill="${colors.text}" text-anchor="middle" dominant-baseline="middle">${initials}</text>
    </svg>
  `)}`;
}
