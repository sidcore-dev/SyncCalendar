import type { OverlapWindow } from "./overlap";
import { getPlaceholderWeather } from "./weather";
import type { Budget, SlotBlock } from "./types";

export interface Activity {
  id: string;
  name: string;
  emoji: string;
  description: string;
  minGroup: number;
  maxGroup: number;
  budget: Budget;
  setting: "indoor" | "outdoor" | "either";
  bestBlocks: SlotBlock[];
  weatherPreference: "any" | "clear" | "rain";
}

export interface ScoredActivity extends Activity {
  matchScore: number;
}

const BUDGET_RANK: Record<Budget, number> = { free: 0, low: 1, medium: 2, high: 3 };

/**
 * Static placeholder catalog. Scored against group size, budget, indoor/outdoor
 * fit, time of day, and placeholder weather — this is the seam where a future
 * AI-suggestions feature would plug in instead.
 */
export const ACTIVITY_CATALOG: Activity[] = [
  {
    id: "picnic",
    name: "Picnic in the park",
    emoji: "🧺",
    description: "Blankets, snacks, and no schedule — just good weather and good company.",
    minGroup: 2,
    maxGroup: 15,
    budget: "free",
    setting: "outdoor",
    bestBlocks: ["afternoon"],
    weatherPreference: "clear",
  },
  {
    id: "hike",
    name: "Hiking trail meetup",
    emoji: "🥾",
    description: "A scenic trail, fresh air, and a reason to finally use those hiking boots.",
    minGroup: 2,
    maxGroup: 10,
    budget: "free",
    setting: "outdoor",
    bestBlocks: ["morning", "afternoon"],
    weatherPreference: "clear",
  },
  {
    id: "game-night",
    name: "Board game night",
    emoji: "🎲",
    description: "Someone's living room, snacks, and a stack of games nobody remembers the rules to.",
    minGroup: 3,
    maxGroup: 8,
    budget: "free",
    setting: "indoor",
    bestBlocks: ["evening"],
    weatherPreference: "any",
  },
  {
    id: "coffee-walk",
    name: "Coffee & a walk",
    emoji: "☕",
    description: "Low-key catch-up energy — grab a coffee and wander.",
    minGroup: 2,
    maxGroup: 6,
    budget: "low",
    setting: "either",
    bestBlocks: ["morning"],
    weatherPreference: "any",
  },
  {
    id: "potluck",
    name: "Potluck dinner",
    emoji: "🍲",
    description: "Everyone brings a dish, nobody has to cook for the whole group.",
    minGroup: 4,
    maxGroup: 12,
    budget: "low",
    setting: "indoor",
    bestBlocks: ["evening"],
    weatherPreference: "any",
  },
  {
    id: "trivia",
    name: "Trivia night",
    emoji: "🧠",
    description: "Pick a bar with a trivia night and pretend you know what year the Berlin Wall fell.",
    minGroup: 3,
    maxGroup: 8,
    budget: "low",
    setting: "indoor",
    bestBlocks: ["evening"],
    weatherPreference: "any",
  },
  {
    id: "board-game-cafe",
    name: "Board game café",
    emoji: "☕",
    description: "A café with a wall of games and no rush to leave your table.",
    minGroup: 2,
    maxGroup: 8,
    budget: "low",
    setting: "indoor",
    bestBlocks: ["afternoon", "evening"],
    weatherPreference: "any",
  },
  {
    id: "bowling",
    name: "Bowling",
    emoji: "🎳",
    description: "Bad shoes, gutter balls, and surprisingly competitive energy.",
    minGroup: 3,
    maxGroup: 12,
    budget: "medium",
    setting: "indoor",
    bestBlocks: ["afternoon", "evening"],
    weatherPreference: "any",
  },
  {
    id: "movie-night",
    name: "Movie theater outing",
    emoji: "🎬",
    description: "Big screen, big popcorn, minimal decision-making required.",
    minGroup: 2,
    maxGroup: 10,
    budget: "medium",
    setting: "indoor",
    bestBlocks: ["evening"],
    weatherPreference: "any",
  },
  {
    id: "museum",
    name: "Museum or gallery day",
    emoji: "🖼️",
    description: "Wander some exhibits, argue about modern art, grab lunch after.",
    minGroup: 2,
    maxGroup: 10,
    budget: "medium",
    setting: "indoor",
    bestBlocks: ["morning", "afternoon"],
    weatherPreference: "any",
  },
  {
    id: "mini-golf",
    name: "Mini golf",
    emoji: "⛳",
    description: "Low stakes, high trash talk.",
    minGroup: 2,
    maxGroup: 12,
    budget: "medium",
    setting: "either",
    bestBlocks: ["afternoon", "evening"],
    weatherPreference: "any",
  },
  {
    id: "escape-room",
    name: "Escape room",
    emoji: "🔐",
    description: "Sixty minutes to figure out who's actually good under pressure.",
    minGroup: 3,
    maxGroup: 8,
    budget: "medium",
    setting: "indoor",
    bestBlocks: ["afternoon", "evening"],
    weatherPreference: "any",
  },
  {
    id: "beach-day",
    name: "Beach day",
    emoji: "🏖️",
    description: "Sun, sand, and someone always forgets the sunscreen.",
    minGroup: 2,
    maxGroup: 15,
    budget: "medium",
    setting: "outdoor",
    bestBlocks: ["morning", "afternoon"],
    weatherPreference: "clear",
  },
  {
    id: "food-truck-crawl",
    name: "Food truck crawl",
    emoji: "🌮",
    description: "Skip the sit-down reservation and graze your way through a food truck lineup.",
    minGroup: 2,
    maxGroup: 12,
    budget: "medium",
    setting: "outdoor",
    bestBlocks: ["afternoon", "evening"],
    weatherPreference: "clear",
  },
  {
    id: "karaoke",
    name: "Karaoke night",
    emoji: "🎤",
    description: "A private room, questionable song choices, zero judgment.",
    minGroup: 3,
    maxGroup: 10,
    budget: "medium",
    setting: "indoor",
    bestBlocks: ["evening"],
    weatherPreference: "any",
  },
  {
    id: "rooftop",
    name: "Rooftop hangout",
    emoji: "🌆",
    description: "Drinks with a skyline view — best on a clear evening.",
    minGroup: 3,
    maxGroup: 12,
    budget: "high",
    setting: "outdoor",
    bestBlocks: ["evening"],
    weatherPreference: "clear",
  },
  {
    id: "cooking-class",
    name: "Group cooking class",
    emoji: "👩‍🍳",
    description: "Learn to make pasta from scratch, then eat all the evidence.",
    minGroup: 3,
    maxGroup: 10,
    budget: "high",
    setting: "indoor",
    bestBlocks: ["afternoon", "evening"],
    weatherPreference: "any",
  },
];

interface ScoreParams {
  groupSize: number;
  budget: Budget;
  bestWindow: OverlapWindow | null;
}

export function scoreActivities(
  { groupSize, budget, bestWindow }: ScoreParams,
  catalog: Activity[] = ACTIVITY_CATALOG
): ScoredActivity[] {
  const weather = bestWindow ? getPlaceholderWeather(bestWindow.date) : null;
  const isClear = weather?.condition === "sunny";
  const isRainy = weather?.condition === "rainy";
  const block = bestWindow?.blocks[0];

  return catalog
    .map((activity) => {
      let score = 0;

      if (groupSize >= activity.minGroup && groupSize <= activity.maxGroup) {
        score += 30;
      } else {
        const distance =
          groupSize < activity.minGroup
            ? activity.minGroup - groupSize
            : groupSize - activity.maxGroup;
        score += Math.max(0, 15 - distance * 5);
      }

      const budgetDistance = Math.abs(BUDGET_RANK[budget] - BUDGET_RANK[activity.budget]);
      score += Math.max(0, 20 - budgetDistance * 10);

      if (activity.setting === "either") score += 10;
      else if (activity.setting === "outdoor" && isClear) score += 20;
      else if (activity.setting === "outdoor" && isRainy) score -= 15;
      else if (activity.setting === "indoor" && isRainy) score += 15;
      else if (activity.setting === "indoor") score += 5;

      if (block && activity.bestBlocks.includes(block)) score += 15;

      if (activity.weatherPreference === "clear" && isClear) score += 10;
      if (activity.weatherPreference === "rain" && isRainy) score += 10;

      return { ...activity, matchScore: Math.round(score) };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}
