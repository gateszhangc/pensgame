const fs = require("node:fs/promises");
const path = require("node:path");

const TEAM_ABBREV = "PIT";
const TEAM_NAME = "Pittsburgh Penguins";
const DATA_URL = "https://api-web.nhle.com/v1/club-schedule-season";
const OUTPUT_PATH = path.join(__dirname, "..", "assets", "data", "penguins-schedule.json");

const phaseLabels = {
  1: "Preseason",
  2: "Regular Season",
  3: "Playoffs"
};

function resolveSeason(now = new Date()) {
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth() + 1;
  const startYear = currentMonth >= 7 ? currentYear : currentYear - 1;
  return `${startYear}${startYear + 1}`;
}

function formatSeasonLabel(season) {
  return `${season.slice(0, 4)}-${season.slice(6)}`;
}

function formatEasternTime(startTimeUTC, gameScheduleState) {
  if (!startTimeUTC || gameScheduleState === "TBD") {
    return "TBD";
  }

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short"
  });

  return formatter.format(new Date(startTimeUTC));
}

function formatGameDateLabel(startTimeUTC) {
  if (!startTimeUTC) {
    return "Date pending";
  }

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    month: "short",
    day: "numeric"
  });

  return formatter.format(new Date(startTimeUTC));
}

function normalizeState(gameState) {
  const map = {
    CRIT: "Live",
    FINAL: "Final",
    FUT: "Upcoming",
    LIVE: "Live",
    OFF: "Live",
    PRE: "Pre-game"
  };

  return map[gameState] || gameState || "Unknown";
}

function pickBroadcasts(tvBroadcasts = []) {
  return Array.from(new Set(tvBroadcasts.map((entry) => entry.network).filter(Boolean)));
}

function normalizeGame(game) {
  const isHome = game.homeTeam?.abbrev === TEAM_ABBREV;
  const pensTeam = isHome ? game.homeTeam : game.awayTeam;
  const opponentTeam = isHome ? game.awayTeam : game.homeTeam;
  const startTimestamp = game.startTimeUTC ? Date.parse(game.startTimeUTC) : null;
  const gameState = normalizeState(game.gameState);
  const ticketsUrl = game.ticketsLink || null;

  if (!pensTeam || !opponentTeam) {
    throw new Error(`Missing Penguins team data for game ${game.id}`);
  }

  return {
    id: game.id,
    date: game.gameDate,
    dateLabel: formatGameDateLabel(game.startTimeUTC),
    startTimeUTC: game.startTimeUTC || null,
    startTimestamp,
    displayTimeET: formatEasternTime(game.startTimeUTC, game.gameScheduleState),
    phase: phaseLabels[game.gameType] || "Other",
    state: gameState,
    rawState: game.gameState || null,
    isHome,
    venue: game.venue?.default || "Venue pending",
    opponentName: `${opponentTeam.placeName?.default || ""} ${opponentTeam.commonName?.default || ""}`.trim(),
    opponentAbbrev: opponentTeam.abbrev,
    broadcasts: pickBroadcasts(game.tvBroadcasts),
    gamecenterUrl: game.gameCenterLink ? `https://www.nhl.com${game.gameCenterLink}` : null,
    ticketsUrl,
    pensScore: Number.isFinite(pensTeam.score) ? pensTeam.score : null,
    opponentScore: Number.isFinite(opponentTeam.score) ? opponentTeam.score : null,
    seriesGameNumber: game.seriesStatus?.gameNumberOfSeries || null,
    summaryLine:
      game.gameState === "FINAL" && Number.isFinite(pensTeam.score) && Number.isFinite(opponentTeam.score)
        ? `${TEAM_ABBREV} ${pensTeam.score} - ${opponentTeam.score} ${opponentTeam.abbrev}`
        : `${isHome ? "vs." : "at"} ${opponentTeam.abbrev}`,
    locationTag: isHome ? "Home" : "Away"
  };
}

function selectFeaturedGame(schedule, now = Date.now()) {
  const sorted = [...schedule].sort((left, right) => {
    return (left.startTimestamp || 0) - (right.startTimestamp || 0);
  });

  const nextGame = sorted.find((game) => {
    return game.startTimestamp !== null && game.startTimestamp >= now && game.rawState !== "FINAL";
  });

  if (nextGame) {
    return {
      ...nextGame,
      contextLabel: "Next game"
    };
  }

  const latestGame = [...sorted].reverse().find((game) => game.startTimestamp !== null);

  return latestGame
    ? {
        ...latestGame,
        contextLabel: "Latest result"
      }
    : null;
}

async function fetchSeasonSchedule(season) {
  const response = await fetch(`${DATA_URL}/${TEAM_ABBREV}/${season}`, {
    headers: {
      accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`NHL schedule request failed with ${response.status}`);
  }

  const payload = await response.json();

  if (!Array.isArray(payload.games)) {
    throw new Error("NHL schedule payload did not include a games array");
  }

  return payload;
}

async function main() {
  const season = process.env.PENSGAME_SEASON || resolveSeason();

  try {
    const payload = await fetchSeasonSchedule(season);
    const schedule = payload.games.map(normalizeGame);

    if (!schedule.length) {
      throw new Error(`No Penguins games returned for season ${season}`);
    }

    const featuredGame = selectFeaturedGame(schedule);

    const output = {
      generatedAt: new Date().toISOString(),
      season,
      seasonLabel: formatSeasonLabel(season),
      team: {
        abbrev: TEAM_ABBREV,
        name: TEAM_NAME
      },
      featuredGame,
      schedule
    };

    await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
    await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`, "utf8");
    console.log(`Wrote Penguins schedule for ${season} to ${OUTPUT_PATH}`);
  } catch (error) {
    console.error(`Failed to refresh Penguins schedule: ${error.message}`);
    process.exitCode = 1;
  }
}

main();
