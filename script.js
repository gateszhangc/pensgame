const scheduleUrl = "assets/data/penguins-schedule.json";

const escapeHtml = (value) => {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
};

const formatGeneratedAt = (value) => {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York"
  }).format(new Date(value));
};

const formatMonthLabel = (game) => {
  const source = game.startTimeUTC || `${game.date}T12:00:00Z`;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "America/New_York"
  }).format(new Date(source));
};

const renderMetaCards = (payload) => {
  const homeGames = payload.schedule.filter((game) => game.isHome).length;
  const awayGames = payload.schedule.length - homeGames;

  document.querySelector("[data-generated-at]").textContent = formatGeneratedAt(payload.generatedAt);
  document.querySelector("[data-season-label]").textContent = payload.seasonLabel;
  document.querySelector("[data-game-count]").textContent = String(payload.schedule.length);
  document.querySelector("[data-split]").textContent = `${homeGames} / ${awayGames}`;
};

const renderFeaturedGame = (game) => {
  const ticketsLink = document.querySelector("[data-featured-tickets]");
  const gamecenterLink = document.querySelector("[data-featured-gamecenter]");

  document.querySelector("[data-featured-context]").textContent = game.contextLabel;
  document.querySelector("[data-featured-matchup]").textContent = game.isHome
    ? `PIT vs ${game.opponentAbbrev}`
    : `PIT at ${game.opponentAbbrev}`;
  document.querySelector("[data-featured-title]").textContent = game.opponentName;
  document.querySelector("[data-featured-location]").textContent = game.locationTag;
  document.querySelector("[data-featured-phase]").textContent = game.phase;
  document.querySelector("[data-featured-state]").textContent = game.state;
  document.querySelector("[data-featured-date]").textContent = game.dateLabel;
  document.querySelector("[data-featured-time]").textContent = game.displayTimeET;
  document.querySelector("[data-featured-venue]").textContent = game.venue;
  document.querySelector("[data-featured-broadcasts]").textContent = game.broadcasts.length
    ? game.broadcasts.join(", ")
    : "Check official listings";

  const summary = game.state === "Final" ? `Final score: ${game.summaryLine}` : `Quick view: ${game.summaryLine}`;
  document.querySelector("[data-featured-summary]").textContent = summary;

  if (game.gamecenterUrl) {
    gamecenterLink.href = game.gamecenterUrl;
  }

  if (game.ticketsUrl) {
    ticketsLink.href = game.ticketsUrl;
    ticketsLink.hidden = false;
  } else {
    ticketsLink.href = "https://www.nhl.com/penguins/schedule";
    ticketsLink.textContent = "Official schedule";
  }
};

const renderSchedule = (schedule) => {
  const groups = schedule.reduce((bucket, game) => {
    const label = formatMonthLabel(game);

    if (!bucket.has(label)) {
      bucket.set(label, []);
    }

    bucket.get(label).push(game);
    return bucket;
  }, new Map());

  const html = Array.from(groups.entries())
    .map(([monthLabel, games]) => {
      const cards = games
        .map((game) => {
          const ticketLink = game.ticketsUrl
            ? `<a href="${escapeHtml(game.ticketsUrl)}" target="_blank" rel="noreferrer noopener">Tickets</a>`
            : "";
          const gamecenterLink = game.gamecenterUrl
            ? `<a href="${escapeHtml(game.gamecenterUrl)}" target="_blank" rel="noreferrer noopener">GameCenter</a>`
            : "";
          const scoreLine = game.state === "Final" ? escapeHtml(game.summaryLine) : escapeHtml(game.displayTimeET);
          const venueLine = `${escapeHtml(game.locationTag)} at ${escapeHtml(game.venue)}`;
          const broadcastLine = game.broadcasts.length ? escapeHtml(game.broadcasts.join(", ")) : "Official listings";

          return `
            <article class="schedule-card">
              <div class="schedule-topline">
                <span class="schedule-date">${escapeHtml(game.dateLabel)}</span>
              </div>
              <h4>${game.isHome ? "vs." : "at"} ${escapeHtml(game.opponentAbbrev)}</h4>
              <p class="schedule-summary">${scoreLine}</p>
              <div class="schedule-meta">
                <span class="chip">${escapeHtml(game.locationTag)}</span>
                <span class="chip chip-ghost">${escapeHtml(game.phase)}</span>
                <span class="chip chip-ice">${escapeHtml(game.state)}</span>
              </div>
              <p>${venueLine}</p>
              <p>Broadcasts: ${broadcastLine}</p>
              <div class="schedule-links">
                ${gamecenterLink}
                ${ticketLink}
              </div>
            </article>
          `;
        })
        .join("");

      return `
        <section class="month-group">
          <div class="month-heading">
            <h3>${escapeHtml(monthLabel)}</h3>
          </div>
          <div class="schedule-grid">
            ${cards}
          </div>
        </section>
      `;
    })
    .join("");

  document.querySelector("[data-schedule-groups]").innerHTML = html;
};

const injectStructuredData = (payload) => {
  const events = payload.schedule.slice(0, 5).map((game) => {
    return {
      "@context": "https://schema.org",
      "@type": "SportsEvent",
      name: game.isHome ? `Pittsburgh Penguins vs ${game.opponentName}` : `${game.opponentName} vs Pittsburgh Penguins`,
      startDate: game.startTimeUTC,
      eventStatus:
        game.state === "Final" ? "https://schema.org/EventCompleted" : "https://schema.org/EventScheduled",
      location: {
        "@type": "Place",
        name: game.venue
      },
      competitor: [
        {
          "@type": "SportsTeam",
          name: "Pittsburgh Penguins"
        },
        {
          "@type": "SportsTeam",
          name: game.opponentName
        }
      ],
      url: game.gamecenterUrl || "https://www.nhl.com/penguins/schedule"
    };
  });

  const tag = document.createElement("script");
  tag.type = "application/ld+json";
  tag.textContent = JSON.stringify(events, null, 2);
  document.head.appendChild(tag);
};

const setFooterYear = () => {
  document.querySelector("[data-footer-year]").textContent = String(new Date().getFullYear());
};

const renderError = () => {
  document.body.dataset.state = "error";
  document.querySelector("[data-featured-context]").textContent = "Schedule unavailable";
  document.querySelector("[data-featured-title]").textContent = "Use the official Penguins schedule";
  document.querySelector("[data-featured-summary]").textContent =
    "The local schedule file did not load. The official team schedule remains linked below.";
  document.querySelector("[data-schedule-groups]").innerHTML = `
    <div class="loading-card">
      <p>
        Schedule data is unavailable right now. Open the
        <a href="https://www.nhl.com/penguins/schedule" target="_blank" rel="noreferrer noopener">official Penguins schedule</a>.
      </p>
    </div>
  `;
};

async function main() {
  setFooterYear();

  try {
    const response = await fetch(scheduleUrl, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Schedule request failed with ${response.status}`);
    }

    const payload = await response.json();

    renderMetaCards(payload);

    if (payload.featuredGame) {
      renderFeaturedGame(payload.featuredGame);
    }

    renderSchedule(payload.schedule);
    injectStructuredData(payload);
    document.body.dataset.state = "ready";
  } catch (error) {
    console.error(error.message);
    renderError();
  }
}

main();
