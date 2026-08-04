// Stats namespace — read-only account analytics (scope `read`). Overview and
// top are served from the server-side landing cache (see `cache.stale`);
// generations is a live aggregate memoized ~60s per window.

import type { Http } from './http';
import type { StatsGenerations, StatsOverview, StatsTop } from './types';

export interface StatsGenerationsOptions {
  /** Window in days — 30 (default) or 90 (anything else is a 400). */
  days?: 30 | 90;
  signal?: AbortSignal;
}

export interface StatsNamespace {
  /** Storage bytes, counters, streak, smart-collection counts and per-tool
   *  recents. Cache-backed: `cache.stale` means a background refresh was
   *  kicked — re-fetch shortly for fresher numbers. */
  overview(signal?: AbortSignal): Promise<StatsOverview>;
  /** Generation volume + spend over a 30/90-day window, split by day, tool
   *  and source (machine = SDK/MCP/raw REST vs studio = web). */
  generations(opts?: StatsGenerationsOptions): Promise<StatsGenerations>;
  /** Most-used references (with suggested tool + config), styles and
   *  keywords. Cache-backed like `overview`. */
  top(signal?: AbortSignal): Promise<StatsTop>;
}

export function createStats(http: Http): StatsNamespace {
  return {
    overview: (signal) =>
      http.request('GET', '/v1/stats/overview', { idempotent: true, signal }),

    generations: (opts = {}) =>
      http.request('GET', '/v1/stats/generations', {
        idempotent: true,
        signal: opts.signal,
        query: { days: opts.days },
      }),

    top: (signal) =>
      http.request('GET', '/v1/stats/top', { idempotent: true, signal }),
  };
}
