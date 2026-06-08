import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Braces,
  ChevronLeft,
  ChevronRight,
  Disc3,
  Drum,
  GitBranch,
  Guitar,
  Image,
  Layers,
  Pause,
  Piano,
  Play,
  Parentheses,
  RotateCcw,
  Route,
  Shuffle,
  Sigma,
  Waypoints,
  type LucideIcon,
} from "lucide-react";
import { runBacktracking, backtrackingTasks } from "./algorithms/backtracking";
import { runBellmanFord } from "./algorithms/bellmanFord";
import { runDijkstra } from "./algorithms/dijkstra";
import { bellmanTasks, dijkstraTask } from "./algorithms/weightedTasks";
import {
  edgeKey,
  formatDistance,
  type AlgorithmMode,
  type BacktrackingKind,
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

const nodeIcons: Record<string, LucideIcon> = {
  книга: BookOpen,
  пластинка: Disc3,
  постер: Image,
  гитара: Guitar,
  барабан: Drum,
  пианино: Piano,
};

const backtrackingTaskMeta: Record<
  BacktrackingKind,
  {
    label: string;
    icon: LucideIcon;
  }
> = {
  permutations: {
    label: "Перестановки",
    icon: Shuffle,
  },
  subsets: {
    label: "Подмножества",
    icon: Layers,
  },
  maze: {
    label: "Лабиринт",
    icon: Waypoints,
  },
  parentheses: {
    label: "Скобки",
    icon: Parentheses,
  },
  "combination-sum": {
    label: "Суммы",
    icon: Sigma,
  },
};

function getGraphViewBox(nodes: GraphNode[]) {
  const padding = 9;
  const minX = Math.min(...nodes.map((node) => node.x)) - padding;
  const maxX = Math.max(...nodes.map((node) => node.x)) + padding;
  const minY = Math.min(...nodes.map((node) => node.y)) - padding;
  const maxY = Math.max(...nodes.map((node) => node.y)) + padding;
  const width = maxX - minX;
  const height = maxY - minY;
  const size = Math.max(width, height);
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  return `${centerX - size / 2} ${centerY - size / 2} ${size} ${size}`;
}

function getStatusLines({
  mode,
  weightedTask,
  backtrackingTask,
  steps,
  stepIndex,
  totalSteps,
}: {
  mode: AlgorithmMode;
  weightedTask: WeightedTask;
  backtrackingTask: BacktrackingTask;
  steps: Array<WeightedStep | BacktrackingStep>;
  stepIndex: number;
  totalSteps: number;
}) {
  const task = mode === "backtracking" ? backtrackingTask : weightedTask;
  const visibleSteps = steps.slice(0, Math.min(stepIndex + 1, totalSteps));
  const currentOutput = stepIndex >= totalSteps - 1 ? task.expected.slice(0, 3) : [];

  return [
    `> сценарий: ${task.shortTitle}`,
    `> шаг ${Math.min(stepIndex + 1, totalSteps)} из ${totalSteps}`,
    ...visibleSteps.map((item, index) => {
      const state = "state" in item && item.state ? ` ${item.state}` : "";
      const edge = "activeEdge" in item && item.activeEdge ? ` ${item.activeEdge.from}->${item.activeEdge.to}` : "";
      return `> ${String(index + 1).padStart(2, "0")} ${item.title}${edge}${state}`;
    }),
    ...currentOutput.map((line) => `> вывод: ${line}`),
  ];
}

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
  const statusLines = getStatusLines({
    mode,
    weightedTask,
    backtrackingTask,
    steps: steps as Array<WeightedStep | BacktrackingStep>,
    stepIndex,
    totalSteps: steps.length,
  });

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
    <main className={`page-shell mode-${mode}`}>
      <aside className="control-panel" aria-label="Панель управления">
        <div className="panel-heading">
          <h1>
            <span>Задание ДМ:</span>
            <span>Algorithms Lab</span>
          </h1>
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

        <div className="sidebar-inner">
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

          <TaskPicker
            mode={mode}
            bellmanTaskId={bellmanTaskId}
            backtrackingTaskId={backtrackingTaskId}
            onBellmanTask={setBellmanTaskId}
            onBacktrackingTask={setBacktrackingTaskId}
          />

          <div className="inspector">
            {mode === "backtracking" && backtrackingRun ? (
              <BacktrackingInspector run={backtrackingRun} step={currentStep as BacktrackingStep | undefined} />
            ) : weightedRun ? (
              <WeightedInspector run={weightedRun} step={currentStep as WeightedStep | undefined} />
            ) : null}
          </div>
        </div>

        <div className="sidebar-bottom">
          <ConsolePanel lines={statusLines} />
        </div>
      </aside>

      <section className="stage-panel" aria-live="polite">
        {mode === "backtracking" && backtrackingRun ? (
          <BacktrackingStage run={backtrackingRun} step={currentStep as BacktrackingStep | undefined} />
        ) : weightedRun ? (
          <GraphStage run={weightedRun} step={currentStep as WeightedStep | undefined} />
        ) : null}
      </section>
    </main>
  );
}

type TaskPickerProps = {
  mode: AlgorithmMode;
  bellmanTaskId: string;
  backtrackingTaskId: string;
  onBellmanTask: (id: string) => void;
  onBacktrackingTask: (id: string) => void;
};

function TaskPicker({
  mode,
  bellmanTaskId,
  backtrackingTaskId,
  onBellmanTask,
  onBacktrackingTask,
}: TaskPickerProps) {
  const tasks =
    mode === "bellman"
      ? bellmanTasks
      : mode === "backtracking"
        ? backtrackingTasks
        : [];

  if (tasks.length === 0) {
    return null;
  }

  if (mode === "backtracking") {
    return (
      <section className="task-picker" aria-label="Выбор задачи">
        <div className="task-card-grid">
          {(tasks as BacktrackingTask[]).map((task) => {
            const active = task.id === backtrackingTaskId;
            const meta = backtrackingTaskMeta[task.kind];
            const Icon = meta.icon;

            return (
              <button
                key={task.id}
                type="button"
                className={active ? "task-card active" : "task-card"}
                onClick={() => onBacktrackingTask(task.id)}
              >
                <span className="task-card-icon" aria-hidden="true">
                  <Icon size={19} />
                </span>
                <span className="task-card-copy">
                  <strong>{meta.label}</strong>
                  <small>{task.subtitle}</small>
                </span>
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  if (mode === "bellman") {
    return (
      <section className="task-picker" aria-label="Выбор задачи">
        <div className="task-card-grid bellman-task-grid">
          {(tasks as WeightedTask[]).map((task) => {
            const active = task.id === bellmanTaskId;
            const [number, ...labelParts] = task.shortTitle.split(". ");
            const label = labelParts.join(". ") || task.shortTitle;

            return (
              <button
                key={task.id}
                type="button"
                className={active ? "task-card bellman-task-card active" : "task-card bellman-task-card"}
                onClick={() => onBellmanTask(task.id)}
              >
                <span className="task-card-icon bellman-task-number" aria-hidden="true">
                  {number}
                </span>
                <span className="task-card-copy">
                  <strong>{label}</strong>
                  <small>{task.subtitle}</small>
                </span>
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section className="task-picker" aria-label="Выбор задачи">
      <div className="task-chip-grid">
        {tasks.map((task) => {
          const active = task.id === bellmanTaskId;

          return (
            <button
              key={task.id}
              type="button"
              className={active ? "task-chip active" : "task-chip"}
              onClick={() => onBellmanTask(task.id)}
            >
              <span>{task.shortTitle}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ConsolePanel({ lines }: { lines: string[] }) {
  const consoleRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const consoleNode = consoleRef.current;

    if (!consoleNode) {
      return;
    }

    consoleNode.scrollTop = consoleNode.scrollHeight;
  }, [lines]);

  return (
    <section className="console-panel" aria-label="Консоль алгоритма" ref={consoleRef}>
      {lines.map((line, index) => (
        <p key={`${line}-${index}`}>{line}</p>
      ))}
    </section>
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
  const currentStep = String(Math.min(stepIndex + 1, totalSteps)).padStart(2, "0");
  const stepTotal = String(totalSteps).padStart(2, "0");

  return (
    <section className="panel playback-panel">
      <div className="playback-meta">
        <div>
          <p className="eyebrow">Step</p>
          <strong>
            {currentStep} / {stepTotal}
          </strong>
        </div>
      </div>
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
      <svg className="graph-canvas" viewBox={getGraphViewBox(run.task.nodes)} role="img" aria-label={run.task.title}>
        <defs>
          <marker id="arrow" markerWidth="5.5" markerHeight="5.5" refX="5" refY="2.75" orient="auto">
            <path d="M0,0 L5.5,2.75 L0,5.5 Z" className="arrow-head" />
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
          const NodeIcon = nodeIcons[node.id];

          return (
            <g key={node.id} className={["graph-node", active && "active", settled && "settled", inPath && "in-path", inCycle && "in-cycle"].filter(Boolean).join(" ")}>
              <title>{node.label}</title>
              <circle cx={node.x} cy={node.y} r="6.8" />
              {NodeIcon ? (
                <NodeIcon className="node-icon" x={node.x - 3.2} y={node.y - 3.2} width={6.4} height={6.4} strokeWidth={2.25} />
              ) : (
                <text x={node.x} y={node.y + 1.2}>
                  {node.label}
                </text>
              )}
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
  const nodeRadius = 6.8;
  const startX = from.x + (dx / length) * (nodeRadius + 1.4);
  const startY = from.y + (dy / length) * (nodeRadius + 1.4);
  const endX = to.x - (dx / length) * (nodeRadius + 2.8);
  const endY = to.y - (dy / length) * (nodeRadius + 2.8);
  const labelX = (startX + endX) / 2;
  const labelY = (startY + endY) / 2;
  const curveOffset = hasReverse ? 14 : 0;
  const normalX = (-dy / length) * curveOffset;
  const normalY = (dx / length) * curveOffset;
  const labelOffset = hasReverse ? 0 : 4.6;
  const labelSide = labelY < 50 ? -1 : 1;
  const labelNormalX = (-dy / length) * labelOffset * labelSide;
  const labelNormalY = (dx / length) * labelOffset * labelSide;
  const path = hasReverse
    ? `M ${startX} ${startY} Q ${labelX + normalX} ${labelY + normalY} ${endX} ${endY}`
    : `M ${startX} ${startY} L ${endX} ${endY}`;
  const textX = labelX + normalX * 0.68 + labelNormalX;
  const textY = labelY + normalY * 0.68 + labelNormalY;
  const label = String(edge.weight);
  const labelWidth = Math.max(6.6, label.length * 2.7 + 3.8);

  return (
    <g className={["graph-edge", active && "active", edge.weight < 0 && "negative", highlighted && "highlighted", cycle && "cycle"].filter(Boolean).join(" ")}>
      <path d={path} markerEnd="url(#arrow)" />
      <rect className="edge-label-bg" x={textX - labelWidth / 2} y={textY - 3.2} width={labelWidth} height="6.4" rx="3.2" />
      <text x={textX} y={textY}>
        {label}
      </text>
    </g>
  );
}

function WeightedInspector({ run, step }: { run: WeightedRun; step?: WeightedStep }) {
  const distances = step?.distances ?? run.distances;
  const parents = step?.parents ?? run.parents;

  return (
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
  );
}

function BacktrackingInspector({ run, step }: { run: BacktrackingRun; step?: BacktrackingStep }) {
  const visibleSolutions = step?.solutions ?? [];

  return (
    <section className="panel">
      <p className="eyebrow">Solutions</p>
      <p className="result-summary">{run.summary}</p>
      <div className="solution-cloud">
        {(visibleSolutions.length > 0 ? visibleSolutions : ["пока нет найденных решений"]).map((solution) => (
          <span key={solution}>{solution}</span>
        ))}
      </div>
    </section>
  );
}

function BacktrackingStage({
  run,
  step,
}: {
  run: BacktrackingRun;
  step?: BacktrackingStep;
}) {
  const grid = "grid" in run.task.payload ? run.task.payload.grid : null;

  return (
    <div className="backtracking-stage">
      {grid ? <MazeView grid={grid} step={step} /> : <StateView task={run.task} step={step} />}
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

export default App;
