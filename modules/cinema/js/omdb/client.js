// OMDb, keyed by IMDb id. It supplies the scores and certifications TMDB has no field for.

import { OMDB_API_KEY, OMDB_BASE, OMDB_TTL_MS } from "../config.js";
import { getJSON } from "../core/http.js";
import * as cache from "../core/cache.js";

// OMDb answers in strings and writes "N/A" wherever it has nothing.
function text(value) {
  const clean = String(value == null ? "" : value).trim();
  return !clean || clean === "N/A" ? "" : clean;
}

// The first numeric run, so "7.6/10", "85%" and "$389,813,101" all read correctly.
function number(value) {
  const match = text(value).replace(/,/g, "").match(/\d+(?:\.\d+)?/);
  return match ? Number.parseFloat(match[0]) : null;
}

function scoreFrom(ratings, source) {
  const match = (ratings || []).find(entry =>
    String(entry.Source || "").toLowerCase().includes(source));
  return match ? number(match.Value) : null;
}

function shape(payload) {
  return {
    imdb: number(payload.imdbRating),
    imdb_votes: number(payload.imdbVotes),
    tomatoes: scoreFrom(payload.Ratings, "rotten"),
    metacritic: number(payload.Metascore),
    awards: text(payload.Awards),
    box_office: number(payload.BoxOffice)
  };
}

// A bonus, never a dependency: a title still opens in full when OMDb is down or has never heard of it.
export async function ratingsFor(imdbId) {
  if (!imdbId || !OMDB_API_KEY) return null;

  const key = `omdb:${imdbId}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;

  let payload;
  try {
    payload = await getJSON(
      `${OMDB_BASE}/?i=${encodeURIComponent(imdbId)}&plot=short&apikey=${encodeURIComponent(OMDB_API_KEY)}`,
      { timeout: 8000, attempts: 1 }
    );
  } catch {
    return null;
  }

  if (!payload || payload.Response === "False") return null;
  return cache.set(key, shape(payload), OMDB_TTL_MS);
}
