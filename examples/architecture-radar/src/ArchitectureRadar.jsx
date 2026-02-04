import { useState } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";

export const Card = ({ children, className = "" }) => (
  <div className={className} style={{ border: "1px solid #ccc", padding: 8 }}>
    {children}
  </div>
);

export const CardContent = ({ children, className = "" }) => (
  <div className={className}>{children}</div>
);

export const Button = ({ children, onClick }) => (
  <button
    onClick={onClick}
    style={{
      padding: "6px 10px",
      border: "1px solid #999",
      background: "#eee",
      cursor: "pointer",
    }}
  >
    {children}
  </button>
);

export const Checkbox = ({ checked, onCheckedChange }) => (
  <input type="checkbox" checked={checked} onChange={onCheckedChange} />
);

// ---- DIMENSION REGISTRY -----------------------------------------
// Dimensions are optional and toggleable. Artifacts may omit any axis.
const dimensionRegistry = {
  LocalReasoning: { enabled: true },
  GlobalConfiguration: { enabled: true },
  InversionOfControl: { enabled: true },
  DependencyExplicitness: { enabled: true },
  StateCentralization: { enabled: true },
  TemporalImplicitness: { enabled: false },
};

const dimensions = Object.keys(dimensionRegistry);

// ---- ARTIFACT DEFINITIONS --------------------------------------
const artifacts = {
  "react-core": {
    LocalReasoning: 7,
    GlobalConfiguration: 2,
    InversionOfControl: 3,
    DependencyExplicitness: 7,
    StateCentralization: 3,
    TemporalImplicitness: 4,
  },

  "angular-core": {
    LocalReasoning: 4,
    GlobalConfiguration: 7,
    InversionOfControl: 8,
    DependencyExplicitness: 4,
    StateCentralization: 6,
    TemporalImplicitness: 7,
  },

  "spring-core": {
    LocalReasoning: 3,
    GlobalConfiguration: 8,
    InversionOfControl: 8,
    DependencyExplicitness: 3,
    StateCentralization: 7,
    TemporalImplicitness: 8,
  },

  redux: {
    LocalReasoning: -2,
    GlobalConfiguration: 1,
    InversionOfControl: 0,
    DependencyExplicitness: 1,
    StateCentralization: 4,
    TemporalImplicitness: 2,
  },

  context: {
    LocalReasoning: -1,
    GlobalConfiguration: 0,
    InversionOfControl: 0,
    DependencyExplicitness: 0,
    StateCentralization: 2,
    TemporalImplicitness: 1,
  },

  autowiring: {
    LocalReasoning: -2,
    GlobalConfiguration: 2,
    InversionOfControl: 2,
    DependencyExplicitness: -2,
    StateCentralization: 1,
    TemporalImplicitness: 2,
  },
};

// ---- PRESETS ----------------------------------------------------
const presets = {
  React: ["react-core"],
  "React + Context": ["react-core", "context"],
  "React + Redux": ["react-core", "redux"],
  Angular: ["angular-core"],
  Spring: ["spring-core"],
};

// ---- VECTOR AGGREGATION ----------------------------------------
function computeVector(selectedArtifacts, activeDimensions) {
  const base = Object.fromEntries(activeDimensions.map((d) => [d, 0]));

  selectedArtifacts.forEach((key) => {
    const delta = artifacts[key];
    if (!delta) return;
    activeDimensions.forEach((d) => {
      base[d] += delta[d] || 0;
    });
  });

  return activeDimensions.map((d) => ({
    axis: d,
    value: Math.max(0, Math.min(10, base[d])),
  }));
}

// ---- UI ---------------------------------------------------------
export default function ArchitectureRadar() {
  const [activePreset, setActivePreset] = useState("React");
  const [extras, setExtras] = useState([]);
  const [activeAxes, setActiveAxes] = useState(
    Object.entries(dimensionRegistry)
      .filter(([_, cfg]) => cfg.enabled)
      .map(([k]) => k)
  );

  const activeArtifacts = [...(presets[activePreset] || []), ...extras];
  const data = computeVector(activeArtifacts, activeAxes);

  function toggleExtra(key) {
    setExtras((prev) =>
      prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]
    );
  }

  function toggleAxis(axis) {
    setActiveAxes((prev) =>
      prev.includes(axis) ? prev.filter((x) => x !== axis) : [...prev, axis]
    );
  }

  return (
    <div className="p-6 grid gap-6 max-w-3xl">
      <Card className="rounded-2xl shadow">
        <CardContent className="p-4 grid gap-4">
          <div className="flex gap-2 flex-wrap">
            {Object.keys(presets).map((p) => (
              <Button
                key={p}
                onClick={() => {
                  setActivePreset(p);
                  setExtras([]);
                }}
              >
                {p}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {Object.keys(artifacts)
              .filter((a) => !presets[activePreset]?.includes(a))
              .map((a) => (
                <label key={a} className="flex items-center gap-2">
                  <Checkbox
                    checked={extras.includes(a)}
                    onCheckedChange={() => toggleExtra(a)}
                  />
                  {a}
                </label>
              ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {dimensions.map((axis) => (
              <label key={axis} className="flex items-center gap-2">
                <Checkbox
                  checked={activeAxes.includes(axis)}
                  onCheckedChange={() => toggleAxis(axis)}
                />
                {axis}
              </label>
            ))}
          </div>

          <RadarChart width={500} height={400} data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey="axis" />
            <PolarRadiusAxis domain={[0, 10]} />
            <Radar dataKey="value" fillOpacity={0.6} />
          </RadarChart>
        </CardContent>
      </Card>
    </div>
  );
}
