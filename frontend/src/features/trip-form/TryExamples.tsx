import { AnimatePresence, motion } from "framer-motion";
import { CloseIcon } from "@/lib/icons";
import { scaleFade } from "@/lib/motion";
import type { TripSubmitValues } from "./TripForm";

const EXAMPLES: { label: string; load: string; note: string; values: TripSubmitValues }[] = [
  {
    label: "Chicago → Denver",
    load: "42,000 lb",
    note: "storm on I-80",
    values: {
      origin: { lat: 41.8781, lon: -87.6298, label: "Chicago, IL" },
      destination: { lat: 39.7392, lon: -104.9903, label: "Denver, CO" },
      departureTimeIso: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      loadWeightLb: 42_000,
      intervalMiles: 25,
    },
  },
  {
    label: "Dallas → Oklahoma City",
    load: "30,000 lb",
    note: "short trip",
    values: {
      origin: { lat: 32.7767, lon: -96.797, label: "Dallas, TX" },
      destination: { lat: 35.4676, lon: -97.5164, label: "Oklahoma City, OK" },
      departureTimeIso: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      loadWeightLb: 30_000,
      intervalMiles: 10,
    },
  },
  {
    label: "Salt Lake City → Denver",
    load: "44,000 lb",
    note: "mountain snow",
    values: {
      origin: { lat: 40.7608, lon: -111.891, label: "Salt Lake City, UT" },
      destination: { lat: 39.7392, lon: -104.9903, label: "Denver, CO" },
      departureTimeIso: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      loadWeightLb: 44_000,
      intervalMiles: 25,
    },
  },
  {
    label: "Amarillo → Denver",
    load: "48,000 lb",
    note: "high-wind plains, heavy load",
    values: {
      origin: { lat: 35.222, lon: -101.8313, label: "Amarillo, TX" },
      destination: { lat: 39.7392, lon: -104.9903, label: "Denver, CO" },
      departureTimeIso: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      loadWeightLb: 48_000,
      intervalMiles: 25,
    },
  },
];

interface TryExamplesModalProps {
  onSelect: (values: TripSubmitValues) => void;
  onClose: () => void;
}

/** 4 canned trips — picking one fills the form AND immediately plans the
 * trip (unlike the old inline list, which only filled the fields and left
 * submitting to the user). A one-click way to see a full result, e.g. for a
 * demo or a reviewer who doesn't want to hand-type an origin/destination. */
export function TryExamplesModal({ onSelect, onClose }: TryExamplesModalProps) {
  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.5)" }}
        onClick={onClose}
      >
        <motion.div
          variants={scaleFade}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md rounded-[20px] p-6"
          style={{ background: "var(--surface)", boxShadow: "var(--shadow)" }}
          role="dialog"
          aria-modal="true"
          aria-label="Try an example trip"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="m-0 text-lg font-bold" style={{ color: "var(--ink)" }}>
                Try an example
              </h2>
              <p className="m-0 mt-1 text-sm" style={{ color: "var(--muted)" }}>
                Picks a trip, fills the form, and plans it right away.
              </p>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="h-9 w-9 flex-none rounded-[10px]"
              style={{ border: "1px solid var(--line)", color: "var(--ink)" }}
            >
              <CloseIcon className="mx-auto" size={16} />
            </button>
          </div>

          <div className="mt-5 flex flex-col gap-2.5">
            {EXAMPLES.map((example) => (
              <button
                key={example.label}
                type="button"
                onClick={() => onSelect(example.values)}
                className="rounded-xl px-3.5 py-3 text-left text-sm"
                style={{ border: "1px solid var(--line)", background: "var(--surface-2)", color: "var(--ink)" }}
              >
                {example.label} · <b style={{ color: "var(--accent)" }}>{example.load}</b>{" "}
                <span style={{ color: "var(--muted)" }}>· {example.note}</span>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
