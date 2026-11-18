import { useEffect, useState } from "react";
import { useHealthCheck, useHeatmap, useTripPlan } from "@/api/hooks";
import { ApiError, type TripPlanRequest } from "@/api/types";
import { ErrorBanner, WakingUpBanner } from "@/lib/Banner";
import { ChevronLeftIcon, MoonIcon, PlayIcon, SunIcon, TruckIcon } from "@/lib/icons";
import { formatLoad } from "@/lib/format";
import { SectionHeader } from "@/lib/SectionHeader";
import { sortByRank } from "@/lib/routeOrder";
import { useUiStore } from "@/state/uiStore";
import { ForecastSlider } from "@/features/forecast/ForecastSlider";
import { TripMap } from "@/features/map/TripMap";
import { MiniTripSummary } from "@/features/trip-form/MiniTripSummary";
import { RankingExplainer } from "@/features/trip-form/RankingExplainer";
import { TripErrorModal } from "@/features/trip-form/TripErrorModal";
import { TripForm, type TripFormPrefill, type TripSubmitValues } from "@/features/trip-form/TripForm";
import { TryExamplesModal } from "@/features/trip-form/TryExamples";
import { RouteDetailsModal } from "@/features/routes/RouteDetailsModal";
import { PlanningProgress } from "@/features/routes/PlanningProgress";
import { RouteList } from "@/features/routes/RouteList";
import { TripSummaryKpis } from "@/features/routes/TripSummaryKpis";
import { WeatherProviderToggle } from "@/features/weather-provider/WeatherProviderToggle";

const LETTERS = ["A", "B", "C", "D", "E"];

export default function App() {
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  const selectedRouteId = useUiStore((s) => s.selectedRouteId);
  const setSelectedRouteId = useUiStore((s) => s.setSelectedRouteId);
  const sliderHour = useUiStore((s) => s.sliderHour);
  const detailsModalRouteId = useUiStore((s) => s.detailsModalRouteId);
  const openDetails = useUiStore((s) => s.openDetails);
  const closeDetails = useUiStore((s) => s.closeDetails);
  const formExpanded = useUiStore((s) => s.formExpanded);
  const setFormExpanded = useUiStore((s) => s.setFormExpanded);

  const health = useHealthCheck();
  const tripPlan = useTripPlan();
  const [lastRequest, setLastRequest] = useState<TripPlanRequest | null>(null);
  const [prefill, setPrefill] = useState<TripFormPrefill | null>(null);
  const [errorDismissed, setErrorDismissed] = useState(false);
  const [examplesOpen, setExamplesOpen] = useState(false);
  const heatmap = useHeatmap(tripPlan.data?.plan_id ?? null);

  useEffect(() => {
    if (tripPlan.data && !selectedRouteId) {
      setSelectedRouteId(tripPlan.data.recommended_route_id);
    }
  }, [tripPlan.data, selectedRouteId, setSelectedRouteId]);

  function submitTrip(values: TripSubmitValues) {
    const request: TripPlanRequest = {
      origin: values.origin,
      destination: values.destination,
      departure_time: values.departureTimeIso,
      load_weight_lb: values.loadWeightLb,
      interval_miles: values.intervalMiles,
    };
    setLastRequest(request);
    setSelectedRouteId(null);
    setErrorDismissed(false);
    tripPlan.mutate(request);
  }

  // Unlike manually editing the form, picking an example fills the visible
  // fields AND plans the trip immediately — the point of "try an example"
  // is a one-click result, not a form-filling shortcut you still have to
  // submit yourself.
  function selectExample(values: TripSubmitValues) {
    setPrefill({ values, token: Date.now() });
    setExamplesOpen(false);
    submitTrip(values);
  }

  const isCollapsed = Boolean(lastRequest) && !formExpanded;
  const plan = tripPlan.data;
  const rankedRoutes = plan ? sortByRank(plan.routes) : [];
  const recommendedRoute = plan?.routes.find((r) => r.id === plan.recommended_route_id);
  const recommendedLetter = recommendedRoute
    ? LETTERS[rankedRoutes.findIndex((r) => r.id === recommendedRoute.id)]
    : "";
  const detailsRoute = plan?.routes.find((r) => r.id === detailsModalRouteId);
  const detailsLetter = detailsRoute
    ? LETTERS[rankedRoutes.findIndex((r) => r.id === detailsRoute.id)]
    : "";

  const isWakingUp = health.isLoading || (health.isError && health.fetchStatus === "fetching");

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <header
        className="flex flex-wrap items-center justify-between gap-4 px-4 py-3.5 sm:px-7"
        style={{ background: "var(--surface)", borderBottom: "1px solid var(--line)" }}
      >
        <div className="flex min-w-0 items-center gap-3.5">
          <span
            className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-[13px]"
            style={{ background: "var(--accent)", color: "var(--on-accent)" }}
          >
            <TruckIcon size={24} />
          </span>
          <div className="min-w-0">
            <div className="text-xl font-bold tracking-tight" style={{ color: "var(--ink)" }}>
              StormHaul
            </div>
            <div className="text-sm" style={{ color: "var(--muted)" }}>
              Weather-aware truck routing
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          {lastRequest && (
            <span
              className="whitespace-nowrap rounded-full px-3.5 py-2 text-[13px] font-semibold"
              style={{ background: "var(--accent-tint)", color: "var(--accent)" }}
            >
              {formatLoad(lastRequest.load_weight_lb)} load · weather every{" "}
              {lastRequest.interval_miles} mi
            </span>
          )}
          <WeatherProviderToggle />
          <button
            type="button"
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            onClick={toggleTheme}
            className="flex h-11 w-11 items-center justify-center rounded-xl"
            style={{ border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)" }}
          >
            {theme === "dark" ? <SunIcon size={18} /> : <MoonIcon size={17} />}
          </button>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1680px] flex-wrap items-start gap-6 px-4 py-5 sm:px-7 sm:py-6">
        <div
          className={`flex w-full flex-col gap-3 desktop:flex-none ${
            isCollapsed ? "desktop:w-[200px]" : "desktop:w-[340px]"
          }`}
        >
          {!isCollapsed && (
            <button
              type="button"
              onClick={() => setExamplesOpen(true)}
              className="flex w-full items-center gap-3 rounded-[14px] p-3.5 text-left transition-transform hover:scale-[1.015]"
              style={{
                background: "var(--accent-tint)",
                border: "1px solid var(--accent)",
                boxShadow: "var(--shadow)",
              }}
            >
              <span
                className="flex h-10 w-10 flex-none items-center justify-center rounded-full"
                style={{ background: "var(--accent)", color: "var(--on-accent)" }}
              >
                <PlayIcon size={15} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold" style={{ color: "var(--accent)" }}>
                  Try an example
                </span>
                <span className="block truncate text-xs" style={{ color: "var(--muted)" }}>
                  See a full planned trip in one click
                </span>
              </span>
              <span className="flex-none text-lg" style={{ color: "var(--accent)" }}>
                →
              </span>
            </button>
          )}
          <aside
            aria-label="Trip details"
            className="w-full rounded-[20px] p-4 sm:p-6"
            style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
          >
            <div className="flex items-center justify-between gap-2">
              <h2
                className="m-0 text-[12.5px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: "var(--muted)" }}
              >
                Trip details
              </h2>
              {/* Collapsing only makes sense once there's a planned trip to
                  summarize in its place — before that, the sidebar is just
                  the form, nothing to collapse to. */}
              {lastRequest && !isCollapsed && (
                <button
                  type="button"
                  onClick={() => setFormExpanded(false)}
                  aria-label="Collapse trip details"
                  className="flex h-7 w-7 flex-none items-center justify-center rounded-md"
                  style={{ color: "var(--muted)" }}
                >
                  <ChevronLeftIcon size={15} />
                </button>
              )}
            </div>

          {isCollapsed && lastRequest && (
            <div className="mt-4.5">
              <MiniTripSummary request={lastRequest} onExpand={() => setFormExpanded(true)} />
            </div>
          )}
          {/* Hidden rather than unmounted when collapsed — TripForm owns its
              own values in local state (not lifted to App), so swapping it
              out via a conditional would reset From/To/etc. back to blank
              on every re-expand. */}
          <div className={`mt-4.5 ${isCollapsed ? "hidden" : ""}`}>
            <TripForm onSubmit={submitTrip} isSubmitting={tripPlan.isPending} prefill={prefill} />
          </div>

          {isWakingUp && (
            <div className="mt-5">
              <WakingUpBanner />
            </div>
          )}


          {!isCollapsed && (
            <>
              <div className="my-5 h-px" style={{ background: "var(--line)" }} />
              <RankingExplainer />
            </>
          )}
        </aside>
        </div>

        {examplesOpen && (
          <TryExamplesModal onSelect={selectExample} onClose={() => setExamplesOpen(false)} />
        )}

        <main className="min-w-0 flex-1 flex flex-col gap-5">
          {!plan && !tripPlan.isPending && (
            // Sized to roughly match the results area that replaces it (trip
            // summary + route list + map) once a plan loads, so the empty
            // state reads as "this is where your results will appear", not
            // just a small unrelated notice.
            <div
              className="flex min-h-[320px] flex-col items-center justify-center gap-5 rounded-[20px] px-4 py-10 text-center sm:min-h-[460px] sm:px-6 sm:py-16"
              style={{ border: "1px dashed var(--line)", background: "var(--surface-2)" }}
            >
              <span
                className="flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{ background: "var(--accent-tint)", color: "var(--accent)" }}
              >
                <TruckIcon size={30} />
              </span>
              <div aria-hidden="true" className="flex items-center gap-2">
                {Array.from({ length: 7 }).map((_, i) => (
                  <span
                    key={i}
                    className="h-[3px] w-6 rounded-full"
                    style={{ background: "var(--line)" }}
                  />
                ))}
              </div>
              <div>
                <div className="text-[18px] font-bold" style={{ color: "var(--ink)" }}>
                  Compare 3 routes for your trip
                </div>
                <div
                  className="mx-auto mt-2 max-w-sm text-[13.5px] leading-relaxed"
                  style={{ color: "var(--muted)" }}
                >
                  Enter From, To, departure and load, then choose "Find the safest route" — or try
                  one of the examples. Your 3 ranked routes, weather risk, and the live map will
                  show up right here.
                </div>
              </div>
            </div>
          )}

          {tripPlan.isPending && <PlanningProgress />}

          {plan && recommendedRoute && (
            <>
              <TripSummaryKpis
                route={recommendedRoute}
                letter={recommendedLetter}
                departureIso={lastRequest!.departure_time}
              />

              <RouteList
                plan={plan}
                selectedRouteId={selectedRouteId ?? plan.recommended_route_id}
                onSelectRoute={setSelectedRouteId}
                onOpenDetails={openDetails}
              />

              <section
                aria-label="Route map"
                className="flex min-w-0 flex-col gap-3 rounded-[20px] p-4 sm:p-6"
                style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
              >
                <SectionHeader>Route map</SectionHeader>
                {/* MapLibre reads this wrapper's rendered size to compute
                    camera bounds — a flex-1 div with no definite-height
                    ancestor resolves to its content's intrinsic size
                    instead of the visible area, which threw fitBounds
                    off badly. A fixed height keeps the measurement (and
                    the fit) correct regardless of what else is on the
                    page. Shorter on mobile so the map doesn't eat the
                    whole viewport above everything else. */}
                <div className="h-[360px] sm:h-[520px]">
                  <TripMap
                    routes={plan.routes}
                    selectedRouteId={selectedRouteId ?? plan.recommended_route_id}
                    recommendedRouteId={plan.recommended_route_id}
                    departureIso={lastRequest!.departure_time}
                    heatmapGrid={heatmap.data}
                    sliderHour={sliderHour}
                    showHeatmap={Boolean(heatmap.data)}
                    originLabel={lastRequest!.origin.label}
                    destinationLabel={lastRequest!.destination.label}
                    onOpenDetails={openDetails}
                  />
                </div>
                {heatmap.data && <ForecastSlider departureIso={lastRequest!.departure_time} />}
                {heatmap.isError && (
                  <ErrorBanner message="Weather data is unavailable right now. The heatmap couldn't be loaded." />
                )}
              </section>
            </>
          )}
        </main>
      </div>

      {detailsRoute && (
        <RouteDetailsModal route={detailsRoute} letter={detailsLetter} onClose={closeDetails} />
      )}

      {tripPlan.isError && !errorDismissed && (
        <TripErrorModal
          message={
            tripPlan.error instanceof ApiError
              ? tripPlan.error.message
              : "The request failed. Please try again."
          }
          onRetry={() => lastRequest && tripPlan.mutate(lastRequest)}
          onClose={() => setErrorDismissed(true)}
        />
      )}
    </div>
  );
}
