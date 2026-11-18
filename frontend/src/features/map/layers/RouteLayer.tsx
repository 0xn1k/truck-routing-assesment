import { useMemo } from "react";
import { Layer, Source } from "react-map-gl/maplibre";
import type { RouteResult } from "@/api/types";
import { riskColorResolved } from "@/lib/risk";
import { cssVar } from "@/lib/theme";
import { CHECKPOINT_LAYER_ID } from "./CheckpointLayer";

/** A MapLibre `line-gradient` expression that recolours the route itself
 * along its length by each checkpoint's actual risk — e.g. green where it's
 * Low, orange/red where High/Severe — instead of one flat colour with risk
 * only visible on the small checkpoint dots. Requires the route's source to
 * set `lineMetrics: true` (below) so `["line-progress"]` is available. */
function riskGradient(route: RouteResult): (string | number)[] {
  const total = route.distance_mi;
  const sorted = [...route.checkpoints].sort((a, b) => a.mile - b.mile);
  let last = -1;
  const stops: [number, string][] = sorted.map((cp) => {
    let t = total > 0 ? cp.mile / total : 0;
    t = Math.min(1, Math.max(0, t));
    if (t <= last) t = Math.min(1, last + 0.0001); // line-gradient stops must strictly increase
    last = t;
    return [t, riskColorResolved(cp.risk)];
  });
  if (stops.length === 0) return ["interpolate", ["linear"], ["line-progress"], 0, cssVar("--accent")];
  if (stops[0][0] > 0) stops.unshift([0, stops[0][1]]);
  if (stops[stops.length - 1][0] < 1) stops.push([1, stops[stops.length - 1][1]]);
  return ["interpolate", ["linear"], ["line-progress"], ...stops.flat()];
}

interface RouteLayerProps {
  routes: RouteResult[];
  selectedRouteId: string;
  /** Re-renders paint colours when the theme toggles — MapLibre paint
   * properties need resolved colour strings, not CSS var(). */
  themeVersion: string;
}

/** Dark casing under a coloured line — selected route wider and in accent,
 * others thinner and grey (frontend/README.md Section 9.8).
 *
 * Z-order is driven entirely by `beforeId`, not by JSX order: react-map-gl's
 * <Layer> only calls map.moveLayer() when its `beforeId` prop VALUE changes
 * between renders — re-rendering routes in a different JSX order does
 * nothing once the underlying MapLibre layers already exist. So:
 *   - the selected route's layers anchor to CHECKPOINT_LAYER_ID (always on
 *     top of every other route, directly below the checkpoint dots —
 *     NOT `beforeId: undefined`, which means "move to the very top of the
 *     whole style" and hid the checkpoint dots under the route line);
 *   - every unselected route's layers anchor to the SELECTED route's
 *     casing id, so they sit directly below whichever route is selected.
 * Both of those targets change value exactly when selection changes,
 * which is what makes moveLayer actually fire on every switch.
 *
 * Creation-order hazard: MapLibre's addLayer() throws if `beforeId` names a
 * layer that doesn't exist yet. CHECKPOINT_LAYER_ID is guaranteed to exist
 * because TripMap.tsx mounts CheckpointLayer before this component; the
 * selected route's casing is guaranteed to exist before any unselected
 * route references it because `ordered` below always processes the
 * selected route first. */
export function RouteLayer({ routes, selectedRouteId, themeVersion }: RouteLayerProps) {
  // eslint-disable-next-line react-hooks/exhaustive-deps -- re-resolve colours on theme change
  const casingColor = useMemo(() => cssVar("--casing"), [themeVersion]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const accentColor = useMemo(() => cssVar("--accent"), [themeVersion]);
  // Fixed, not theme-dependent: the map's basemap is the same warm terrain
  // style in both light and dark page themes now (mapStyle.ts), so an
  // unselected route needs a colour that reads against THAT (always cream/
  // green terrain), not against the page background. A light, theme-matched
  // grey (the old --route-other) nearly disappeared on the cream map.
  const otherColor = "#4a3b26";
  const otherCasingColor = "#faf6ef";

  const selectedCasingId = `route-${selectedRouteId}-casing`;
  const ordered = useMemo(
    () => [...routes].sort((a, b) => Number(b.id === selectedRouteId) - Number(a.id === selectedRouteId)),
    [routes, selectedRouteId],
  );

  return (
    <>
      {ordered.map((route) => {
        const selected = route.id === selectedRouteId;
        const beforeId = selected ? CHECKPOINT_LAYER_ID : selectedCasingId;
        const geojson: GeoJSON.Feature = {
          type: "Feature",
          properties: {},
          geometry: route.geometry,
        };
        return (
          <Source
            key={route.id}
            id={`route-${route.id}`}
            type="geojson"
            data={geojson}
            lineMetrics
          >
            <Layer
              id={`route-${route.id}-casing`}
              type="line"
              beforeId={beforeId}
              layout={{ "line-cap": "round", "line-join": "round" }}
              paint={{
                "line-color": selected ? casingColor : otherCasingColor,
                "line-width": selected ? 12 : 7,
                "line-opacity": selected ? 1 : 0.85,
              }}
            />
            <Layer
              id={`route-${route.id}-line`}
              type="line"
              beforeId={beforeId}
              layout={{ "line-cap": "round", "line-join": "round" }}
              paint={
                selected
                  ? {
                      // Bold and coloured by actual risk along its length —
                      // green where Low, escalating toward red/purple at
                      // High/Severe/No-Travel checkpoints, same palette the
                      // checkpoint dots and heatmap use.
                      "line-color": accentColor,
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      "line-gradient": riskGradient(route) as any,
                      "line-width": 7,
                    }
                  : {
                      // Unselected routes stay flat (no risk gradient, so
                      // they don't compete with the selected route's
                      // colouring) but dark/solid enough to still read
                      // clearly against the cream terrain basemap.
                      "line-color": otherColor,
                      "line-width": 4.5,
                      "line-opacity": 0.9,
                    }
              }
            />
          </Source>
        );
      })}
    </>
  );
}
