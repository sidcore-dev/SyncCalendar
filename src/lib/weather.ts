// Placeholder weather source. There's no real forecast API wired up yet — this
// deterministically derives a "forecast" from the date string so the same date
// always shows the same condition (useful for demos and for the activity
// scoring algorithm). Swap this module out for a real weather API later
// without touching any call sites.

export type WeatherCondition = "sunny" | "cloudy" | "rainy";

export interface PlaceholderWeather {
  condition: WeatherCondition;
  tempF: number;
  emoji: string;
  label: string;
}

const CONDITIONS: { condition: WeatherCondition; emoji: string; label: string }[] = [
  { condition: "sunny", emoji: "☀️", label: "Sunny" },
  { condition: "sunny", emoji: "☀️", label: "Sunny" },
  { condition: "cloudy", emoji: "⛅", label: "Partly cloudy" },
  { condition: "cloudy", emoji: "☁️", label: "Overcast" },
  { condition: "rainy", emoji: "🌧️", label: "Light rain" },
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getPlaceholderWeather(dateISO: string): PlaceholderWeather {
  const hash = hashString(dateISO);
  const pick = CONDITIONS[hash % CONDITIONS.length];
  const tempF = 58 + (hash % 30); // roughly 58-87F, deterministic per date
  return { ...pick, tempF };
}
