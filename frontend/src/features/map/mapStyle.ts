// Stadia Maps is already this app's routing provider (providers/routing/
// valhalla.py) — it also hosts map tiles on the same free account, so the
// terrain basemap below adds no new paid service. Tile requests from
// localhost/127.0.0.1 work keyless (Stadia's dev allowance); a hosted
// deployment needs a domain-restricted STADIA_API_KEY (Stadia dashboard)
// set as VITE_STADIA_API_KEY, or Stadia starts rejecting the requests.
const STADIA_API_KEY = import.meta.env.VITE_STADIA_API_KEY as string | undefined;

function stadiaStyleUrl(style: string): string {
  const key = STADIA_API_KEY ? `?api_key=${STADIA_API_KEY}` : "";
  return `https://tiles.stadiamaps.com/styles/${style}.json${key}`;
}

/** Same terrain style in both themes, by design — the map's colours are
 * meant to match exactly, not switch to a separate cool-toned dark vector
 * style the way the rest of the UI switches (route casings/heatmap
 * contrast still key off theme directly in RouteLayer/HeatmapLayer,
 * frontend/README.md Section 9.8 — just not through this function). */
export function basemapStyleUrl(): string {
  return stadiaStyleUrl("stamen_terrain");
}
