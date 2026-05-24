import { useEffect, useMemo, useState } from "react";
import {
  Braces,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  GitBranch,
  Pause,
  Play,
  RotateCcw,
  Route,
} from "lucide-react";
import { runBacktracking, backtrackingTasks } from "./algorithms/backtracking";
import { runBellmanFord } from "./algorithms/bellmanFord";
import { runDijkstra } from "./algorithms/dijkstra";
import { bellmanTasks, dijkstraTask } from "./algorithms/weightedTasks";
import {
  edgeKey,
  formatDistance,
  type AlgorithmMode,
  type BacktrackingRun,
  type BacktrackingStep,
  type BacktrackingTask,
  type GraphNode,
  type WeightedEdge,
  type WeightedRun,
  type WeightedStep,
  type WeightedTask,
} from "./algorithms/types";

const modeCopy: Record<
  AlgorithmMode,
  {
    title: string;
    eyebrow: string;
    description: string;
    icon: typeof Route;
  }
> = {
  dijkstra: {
    title: "Dijkstra",
    eyebrow: "Weighted paths",
    description: "Минимальная стоимость, когда все ребра неотрицательные.",
    icon: Route,
  },
  bellman: {
    title: "Bellman-Ford",
    eyebrow: "Negative edges",
    description: "Релаксации, отрицательные ребра и проверка циклов.",
    icon: GitBranch,
  },
  backtracking: {
    title: "Backtracking",
    eyebrow: "Decision space",
    description: "Выбор, проверка, откат и сохранение решений.",
    icon: Braces,
  },
};

function App() {
  const [mode, setMode] = useState<AlgorithmMode>("dijkstra");
  const [bellmanTaskId, setBellmanTaskId] = useState(bellmanTasks[0].id);
  const [backtrackingTaskId, setBacktrackingTaskId] = useState(backtrackingTasks[0].id);
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  const weightedTask = useMemo(() => {
    if (mode === "dijkstra") {
      return dijkstraTask;
    }

    return bellmanTasks.find((task) => task.id === bellmanTaskId) ?? bellmanTasks[0];
  }, [bellmanTaskId, mode]);

  const backtrackingTask = useMemo(
    () => backtrackingTasks.find((task) => task.id === backtrackingTaskId) ?? backtrackingTasks[0],
    [backtrackingTaskId],
  );

  const weightedRun = useMemo<WeightedRun | null>(() => {
    if (mode === "dijkstra") {
      return runDijkstra(dijkstraTask);
    }

    if (mode === "bellman") {
      return runBellmanFord(weightedTask);
    }

    return null;
  }, [mode, weightedTask]);

  const backtrackingRun = useMemo<BacktrackingRun | null>(() => {
    if (mode !== "backtracking") {
      return null;
    }

    return runBacktracking(backtrackingTask);
  }, [backtrackingTask, mode]);

  const steps = mode === "backtracking" ? backtrackingRun?.steps ?? [] : weightedRun?.steps ?? [];
  const currentStep = steps[Math.min(stepIndex, Math.max(steps.length - 1, 0))];
  const progress = steps.length > 1 ? (stepIndex / (steps.length - 1)) * 100 : 0;

  useEffect(() => {
    setStepIndex(0);
    setPlaying(false);
  }, [bellmanTaskId, backtrackingTaskId, mode]);

  useEffect(() => {
    if (!playing) {
      return;
    }

    const timer = window.setInterval(() => {
      setStepIndex((current) => Math.min(current + 1, Math.max(steps.length - 1, 0)));
    }, 920);

    return () => window.clearInterval(timer);
  }, [playing, steps.length]);

  useEffect(() => {
    if (stepIndex >= steps.length - 1) {
      setPlaying(false);
    }
  }, [stepIndex, steps.length]);

  const selectMode = (nextMode: AlgorithmMode) => setMode(nextMode);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <div className="brand-mark">
            <CircleDot size={18} />
          </div>
          <div>
            <p className="eyebrow">Discrete Math</p>
            <h1>Algorithms Lab</h1>
          </div>
        </div>

        <nav className="mode-switch" aria-label="Algorithm sections">
          {(Object.keys(modeCopy) as AlgorithmMode[]).map((item) => {
            const Icon = modeCopy[item].icon;
            return (
              <button
                key={item}
                className={item === mode ? "mode-button active" : "mode-button"}
                type="button"
                onClick={() => selectMode(item)}
              >
                <Icon size={18} />
                <span>{modeCopy[item].title}</span>
              </button>
            );
          })}
        </nav>
      </header>

      <main className="workbench">
        <TaskRail
          mode={mode}
          weightedTask={weightedTask}
          backtrackingTask={backtrackingTask}
          bellmanTaskId={bellmanTaskId}
          backtrackingTaskId={backtrackingTaskId}
          onBellmanTask={setBellmanTaskId}
          onBacktrackingTask={setBacktrackingTaskId}
        />

        <section className="stage-panel" aria-live="polite">
          <div className="stage-heading">
            <div>
              <p className="eyebrow">{modeCopy[mode].eyebrow}</p>
              <h2>{mode === "backtracking" ? backtrackingTask.title : weightedTask.title}</h2>
              <p>{mode === "backtracking" ? backtrackingTask.question : weightedTask.question}</p>
            </div>
            <div className="step-counter">
              <span>{String(Math.min(stepIndex + 1, steps.length)).padStart(2, "0")}</span>
              <small>/ {String(steps.length).padStart(2, "0")}</small>
            </div>
          </div>

          {mode === "backtracking" && backtrackingRun ? (
            <BacktrackingStage run={backtrackingRun} step={currentStep as BacktrackingStep | undefined} index={stepIndex} />
          ) : weightedRun ? (
            <GraphStage run={weightedRun} step={currentStep as WeightedStep | undefined} />
          ) : null}
        </section>

        <aside className="inspector">
          <Playback
            playing={playing}
            progress={progress}
            stepIndex={stepIndex}
            totalSteps={steps.length}
            onPlay={() => setPlaying((value) => !value)}
            onPrev={() => setStepIndex((value) => Math.max(0, value - 1))}
            onNext={() => setStepIndex((value) => Math.min(steps.length - 1, value + 1))}
            onReset={() => {
              setPlaying(false);
              setStepIndex(0);
            }}
          />

          {mode === "backtracking" && backtrackingRun ? (
            <BacktrackingInspector run={backtrackingRun} step={currentStep as BacktrackingStep | undefined} />
          ) : weightedRun ? (
            <WeightedInspector run={weightedRun} step={currentStep as WeightedStep | undefined} />
          ) : null}
        </aside>
      </main>
    </div>
  );
}

type TaskRailProps = {
  mode: AlgorithmMode;
  weightedTask: WeightedTask;
  backtrackingTask: BacktrackingTask;
  bellmanTaskId: string;
  backtrackingTaskId: string;
  onBellmanTask: (id: string) => void;
  onBacktrackingTask: (id: string) => void;
};

function TaskRail({
  mode,
  weightedTask,
  backtrackingTask,
  bellmanTaskId,
  backtrackingTaskId,
  onBellmanTask,
  onBacktrackingTask,
}: TaskRailProps) {
  const tasks =
    mode === "bellman"
      ? bellmanTasks
      : mode === "backtracking"
        ? backtrackingTasks
        : [dijkstraTask];

  return (
    <aside className="task-rail">
      <p className="eyebrow">{modeCopy[mode].description}</p>
      <h2>{mode === "backtracking" ? backtrackingTask.shortTitle : weightedTask.shortTitle}</h2>
      <p className="rail-note">
        {mode === "dijkstra"
          ? "Python-ноутбук переписан на TypeScript с теми же данными."
          : mode === "bellman"
            ? "Все 9 задач из PDF заведены как отдельные сценарии."
            : "Все 5 задач из PDF решаются через один backtracking-движок."}
      </p>

      <div className="task-list">
        {tasks.map((task) => {
          const active =
            mode === "dijkstra" ||
            (mode === "bellman" && task.id === bellmanTaskId) ||
            (mode === "backtracking" && task.id === backtrackingTaskId);

          return (
            <button
              key={task.id}
              type="button"
              disabled={mode === "dijkstra"}
              className={active ? "task-button active" : "task-button"}
              onClick={() => {
                if (mode === "bellman") {
                  onBellmanTask(task.id);
                }
                if (mode === "backtracking") {
                  onBacktrackingTask(task.id);
                }
              }}
            >
              <span>{task.shortTitle}</span>
              <small>{task.subtitle}</small>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function Playback({
  playing,
  progress,
  stepIndex,
  totalSteps,
  onPlay,
  onPrev,
  onNext,
  onReset,
}: {
  playing: boolean;
  progress: number;
  stepIndex: number;
  totalSteps: number;
  onPlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onReset: () => void;
}) {
  return (
    <section className="panel playback-panel">
      <div className="progress-track" aria-label="Step progress">
        <span style={{ width: `${progress}%` }} />
      </div>
      <div className="playback-row">
        <button type="button" className="icon-button" onClick={onReset} aria-label="Reset">
          <RotateCcw size={17} />
        </button>
        <button type="button" className="icon-button" onClick={onPrev} disabled={stepIndex === 0} aria-label="Previous step">
          <ChevronLeft size={18} />
        </button>
        <button type="button" className="play-button" onClick={onPlay} aria-label={playing ? "Pause" : "Play"}>
          {playing ? <Pause size={19} /> : <Play size={19} />}
        </button>
        <button
          type="button"
          className="icon-button"
          onClick={onNext}
          disabled={stepIndex >= totalSteps - 1}
          aria-label="Next step"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </section>
  );
}

function GraphStage({ run, step }: { run: WeightedRun; step?: WeightedStep }) {
  const activeEdge = edgeKey(step?.activeEdge);
  const pathEdges = new Set(
    (step?.path ?? run.path ?? [])
      .slice(0, -1)
      .map((node, index, path) => `${node}->${path[index + 1]}`),
  );
  const cycleEdges = new Set(
    (step?.negativeCycle ?? run.negativeCycle ?? [])
      .slice(0, -1)
      .map((node, index, cycle) => `${node}->${cycle[index + 1]}`),
  );

  return (
    <div className="graph-wrap">
      <svg className="graph-canvas" viewBox="0 0 100 100" role="img" aria-label={run.task.title}>
        <defs>
          <marker id="arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
            <path d="M0,0 L7,3.5 L0,7 Z" className="arrow-head" />
          </marker>
        </defs>
        {run.task.edges.map((edge) => (
          <GraphEdge
            key={`${edge.from}-${edge.to}-${edge.weight}`}
            edge={edge}
            nodes={run.task.nodes}
            edges={run.task.edges}
            active={edgeKey(edge) === activeEdge}
            highlighted={pathEdges.has(edgeKey(edge))}
            cycle={cycleEdges.has(edgeKey(edge))}
          />
        ))}

        {run.task.nodes.map((node) => {
          const active = step?.activeNode === node.id;
          const settled = step?.settledNodes?.includes(node.id);
          const inPath = (step?.path ?? run.path ?? []).includes(node.id);
          const inCycle = (step?.negativeCycle ?? run.negativeCycle ?? []).includes(node.id);

          return (
            <g key={node.id} className={["graph-node", active && "active", settled && "settled", inPath && "in-path", inCycle && "in-cycle"].filter(Boolean).join(" ")}>
              <circle cx={node.x} cy={node.y} r="5.2" />
              <text x={node.x} y={node.y + 1.2}>
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function GraphEdge({
  edge,
  nodes,
  edges,
  active,
  highlighted,
  cycle,
}: {
  edge: WeightedEdge;
  nodes: GraphNode[];
  edges: WeightedEdge[];
  active: boolean;
  highlighted: boolean;
  cycle: boolean;
}) {
  const from = nodes.find((node) => node.id === edge.from)!;
  const to = nodes.find((node) => node.id === edge.to)!;
  const hasReverse = edges.some((item) => item.from === edge.to && item.to === edge.from);
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const startX = from.x + (dx / length) * 6.4;
  const startY = from.y + (dy / length) * 6.4;
  const endX = to.x - (dx / length) * 7.5;
  const endY = to.y - (dy / length) * 7.5;
  const labelX = (startX + endX) / 2;
  const labelY = (startY + endY) / 2;
  const curveOffset = hasReverse ? 9 : 0;
  const normalX = (-dy / length) * curveOffset;
  const normalY = (dx / length) * curveOffset;
  const path = hasReverse
    ? `M ${startX} ${startY} Q ${labelX + normalX} ${labelY + normalY} ${endX} ${endY}`
    : `M ${startX} ${startY} L ${endX} ${endY}`;
  const textX = labelX + normalX * 0.6;
  const textY = labelY + normalY * 0.6;

  return (
    <g className={["graph-edge", active && "active", edge.weight < 0 && "negative", highlighted && "highlighted", cycle && "cycle"].filter(Boolean).join(" ")}>
      <path d={path} markerEnd="url(#arrow)" />
      <text x={textX} y={textY}>
        {edge.weight}
      </text>
    </g>
  );
}

function WeightedInspector({ run, step }: { run: WeightedRun; step?: WeightedStep }) {
  const distances = step?.distances ?? run.distances;
  const parents = step?.parents ?? run.parents;

  return (
    <>
      <section className="panel">
        <p className="eyebrow">Current step</p>
        <h3>{step?.title ?? "Старт"}</h3>
        <p className="detail-text">{step?.detail}</p>
      </section>

      <section className="panel">
        <p className="eyebrow">Distance table</p>
        <div className="distance-table">
          {run.task.nodes.map((node) => (
            <div key={node.id} className={step?.changedNode === node.id ? "distance-row changed" : "distance-row"}>
              <span>{node.label}</span>
              <strong>{formatDistance(distances[node.id])}</strong>
              <small>{parents[node.id] ?? "—"}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">Expected output</p>
        <ul className="clean-list">
          {run.task.expected.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>
    </>
  );
}

function BacktrackingStage({
  run,
  step,
  index,
}: {
  run: BacktrackingRun;
  step?: BacktrackingStep;
  index: number;
}) {
  const grid = "grid" in run.task.payload ? run.task.payload.grid : null;

  return (
    <div className="backtracking-stage">
      {grid ? <MazeView grid={grid} step={step} /> : <StateView task={run.task} step={step} />}
      <DecisionTrail steps={run.steps} activeIndex={index} />
    </div>
  );
}

function StateView({ task, step }: { task: BacktrackingTask; step?: BacktrackingStep }) {
  return (
    <div className="state-view">
      <div>
        <p className="eyebrow">Input</p>
        <h3>{task.inputLabel}</h3>
      </div>
      <div className="state-output">
        <p className="eyebrow">Current state</p>
        <strong>{step?.state || "[]"}</strong>
      </div>
      {step?.candidate ? (
        <div className="candidate-chip">
          <span>candidate</span>
          <strong>{step.candidate}</strong>
        </div>
      ) : null}
    </div>
  );
}

function MazeView({ grid, step }: { grid: number[][]; step?: BacktrackingStep }) {
  const path = new Set(step?.mazePath ?? []);
  const visited = new Set(step?.mazeVisited ?? []);
  const candidate = step?.candidate?.replace(/[()]/g, "");

  return (
    <div className="maze-view" style={{ gridTemplateColumns: `repeat(${grid[0].length}, 1fr)` }}>
      {grid.flatMap((row, r) =>
        row.map((cell, c) => {
          const key = `${r},${c}`;
          const classes = [
            "maze-cell",
            cell === 1 && "wall",
            visited.has(key) && "visited",
            path.has(key) && "path",
            candidate === key && "active",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <div key={key} className={classes}>
              {cell === 1 ? "1" : "0"}
            </div>
          );
        }),
      )}
    </div>
  );
}

function DecisionTrail({ steps, activeIndex }: { steps: BacktrackingStep[]; activeIndex: number }) {
  const visible = steps.slice(Math.max(0, activeIndex - 34), activeIndex + 1);

  return (
    <div className="decision-trail">
      {visible.map((step) => (
        <div
          key={step.id}
          className={step.id === steps[activeIndex]?.id ? `decision-node active ${step.action}` : `decision-node ${step.action}`}
          style={{ marginLeft: `${Math.min(step.depth, 8) * 18}px` }}
        >
          <span>{step.title}</span>
          <small>{step.state || "∅"}</small>
        </div>
      ))}
    </div>
  );
}

function BacktrackingInspector({ run, step }: { run: BacktrackingRun; step?: BacktrackingStep }) {
  const visibleSolutions = step?.solutions ?? [];

  return (
    <>
      <section className="panel">
        <p className="eyebrow">Current step</p>
        <h3>{step?.title ?? "Старт"}</h3>
        <p className="detail-text">{step?.detail}</p>
      </section>

      <section className="panel">
        <p className="eyebrow">Solutions</p>
        <p className="result-summary">{run.summary}</p>
        <div className="solution-cloud">
          {(visibleSolutions.length > 0 ? visibleSolutions : ["пока нет найденных решений"]).map((solution) => (
            <span key={solution}>{solution}</span>
          ))}
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">Expected output</p>
        <ul className="clean-list">
          {run.task.expected.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>
    </>
  );
}

export default App;
