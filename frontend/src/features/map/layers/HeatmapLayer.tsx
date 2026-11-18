import { useMemo } from "react";
import { Layer, Source } from "react-map-gl/maplibre";
import type { HeatmapGrid } from "@/api/types";
import { RISK_LEVELS } from "@/lib/risk";
import { cssVar } from "@/lib/theme";

interface HeatmapLayerProps {
  grid: HeatmapGrid;
  hour: number;
  themeVersion: string;
  /** The layer id this must render directly below — the selected route's
   * casing (see TripMap.tsx). NOT CHECKPOINT_LAYER_ID: the heatmap loads
   * asynchronously, well after the route layers already exist, and
   * anchoring to the same target as the routes meant whichever one's
   * layer was (re-)inserted more recently won the spot closer to the
   * checkpoints — which was almost always the heatmap, since it mounts
   * later. That put the colour wash on TOP of the route line instead of
   * under it. Anchoring to the route's own casing guarantees the heatmap
   * always ends up below every route, not just below the checkpoints. */
  beforeId: string;
}

/** Each grid point's colour comes directly from its OWN risk level — the
 * same RISK_LEVELS / --risk-N palette CheckpointLayer uses, so the heatmap
 * never disagrees with the checkpoint pins on the same map. This deliberately
 * does NOT use MapLibre's `heatmap` layer type: that type sums kernel
 * density from every nearby point, which made a uniformly Low-risk corridor
 * render solid red/orange (density from ~225 overlapping points stacking
 * past the colour ramp's low stops) and made sparse points vanish entirely
 * once zoomed in past the grid's point spacing. A `circle` layer colours
 * each point independently, so "Low" always reads as a visible mild green,
 * not a density artifact. */
export function HeatmapLayer({ grid, hour, themeVersion, beforeId }: HeatmapLayerProps) {
  const geojson: GeoJSON.FeatureCollection = useMemo(() => {
    const riskRow = grid.risk_levels[hour] ?? [];
    return {
      type: "FeatureCollection",
      features: grid.points.map(([lat, lon], index) => ({
        type: "Feature" as const,
        properties: { risk: riskRow[index] ?? 0 },
        geometry: { type: "Point" as const, coordinates: [lon, lat] },
      })),
    };
  }, [grid, hour]);

  const colorExpression = useMemo(
    () => [
      "step",
      ["get", "risk"],
      cssVar("--risk-0"),
      ...RISK_LEVELS.slice(1).flatMap((level) => [
        RISK_LEVELS.indexOf(level),
        cssVar(`--risk-${RISK_LEVELS.indexOf(level)}`),
      ]),
    ],
    // themeVersion forces a recompute on theme toggle even though cssVar()
    // reads the DOM directly rather than referencing the variable itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [themeVersion],
  );

  return (
    <Source id="heatmap-source" type="geojson" data={geojson}>
      <Layer
        id="heatmap"
        type="circle"
        beforeId={beforeId}
        paint={{
          // Fixed pixel radii leave gaps between grid points once you zoom
          // in past the continental view the grid spacing (core/heatmap.py,
          // degrees not pixels) was tuned for — scale radius with zoom so
          // neighbouring points still touch and blend into a corridor wash.
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 24, 10, 80],
          "circle-blur": 0.75,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          "circle-color": colorExpression as any,
          // Kept deliberately subtle now that the selected route's own line
          // is coloured by risk (RouteLayer.tsx's line-gradient) — that's
          // the precise signal; this corridor wash is background context
          // for the rest of the 48h forecast, not meant to compete with it.
          "circle-opacity": ["interpolate", ["linear"], ["get", "risk"], 0, 0.12, 4, 0.55],
        }}
      />
    </Source>
  );
}
