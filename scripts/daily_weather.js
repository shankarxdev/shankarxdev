import { readFile, writeFile } from "node:fs/promises";

// Defaults (you can override via workflow env vars)
const lat = process.env.WEATHER_LAT ?? "43.7105";
const lon = process.env.WEATHER_LON ?? "-79.7266";
const city = process.env.WEATHER_CITY ?? "Toronto, Canada";

const url =
  "https://api.open-meteo.com/v1/forecast" +
  `?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}` +
  "&current=temperature_2m,wind_speed_10m" +
  "&temperature_unit=celsius&wind_speed_unit=kmh";

const res = await fetch(url, {
  headers: {
    "User-Agent": "shankarxdev-daily-weather (GitHub Actions)",
  },
});

if (!res.ok) {
  throw new Error(`Weather fetch failed: ${res.status} ${res.statusText}`);
}

const data = await res.json();
const cur = data?.current ?? {};

const temp = cur.temperature_2m;
const wind = cur.wind_speed_10m;

// Always changes -> ensures a daily commit when scheduled.
const now = new Date().toISOString().replace("T", " ").replace("Z", " UTC");

const readmeSection =
  `<sub>🌤️ <strong>${city}</strong> — ${temp}°C · wind ${wind} km/h · updated ${now}</sub>`;

// Update README section (if markers exist)
const start = "<!--START_SECTION:daily_weather-->";
const end = "<!--END_SECTION:daily_weather-->";

try {
  const readme = await readFile("README.md", "utf8");
  const startIdx = readme.indexOf(start);
  const endIdx = readme.indexOf(end);

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const before = readme.slice(0, startIdx + start.length);
    const after = readme.slice(endIdx);
    const updated = `${before}\n  ${readmeSection}\n${after}`;
    await writeFile("README.md", updated, "utf8");
  }
} catch {
  // If README doesn't exist or can't be read, do nothing.
}
