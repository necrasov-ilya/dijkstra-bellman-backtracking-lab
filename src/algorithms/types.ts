export type AlgorithmMode = "dijkstra" | "bellman" | "backtracking";

export type GraphNode = {
  id: string;
  label: string;
  x: number;
  y: number;
};

export type WeightedEdge = {
  from: string;
  to: string;
  weight: number;
};

export type WeightedTask = {
  id: string;
  title: string;
  shortTitle: string;
  subtitle: string;
  question: string;
  start: string;
  finish?: string;
  nodes: GraphNode[];
  edges: WeightedEdge[];
  expected: string[];
  note?: string;
};

export type WeightedStep = {
  id: string;
  title: string;
  detail: string;
  phase: "init" | "select" | "relax" | "pass" | "check" | "done";
  distances: Record<string, number>;
  parents: Record<string, string | null>;
  activeNode?: string;
  activeEdge?: WeightedEdge;
  settledNodes?: string[];
  path?: string[];
  changedNode?: string;
  negativeCycle?: string[];
};

export type WeightedRun = {
  task: WeightedTask;
  steps: WeightedStep[];
  distances: Record<string, number>;
  parents: Record<string, string | null>;
  path?: string[];
  cost?: number;
  negativeCycle?: string[];
};

export type BacktrackingKind =
  | "permutations"
  | "subsets"
  | "maze"
  | "parentheses"
  | "combination-sum";

export type BacktrackingTask = {
  id: string;
  kind: BacktrackingKind;
  title: string;
  shortTitle: string;
  subtitle: string;
  question: string;
  inputLabel: string;
  expected: string[];
  payload:
    | { nums: number[] }
    | { grid: number[][] }
    | { pairs: number }
    | { candidates: number[]; target: number };
};

export type BacktrackingStep = {
  id: string;
  title: string;
  detail: string;
  action: "choose" | "accept" | "reject" | "solution" | "backtrack";
  depth: number;
  state: string;
  candidate?: string;
  solutions: string[];
  mazePath?: string[];
  mazeVisited?: string[];
};

export type BacktrackingRun = {
  task: BacktrackingTask;
  steps: BacktrackingStep[];
  solutions: string[];
  summary: string;
};

export const INF = Number.POSITIVE_INFINITY;

export function cloneDistances(distances: Record<string, number>) {
  return { ...distances };
}

export function cloneParents(parents: Record<string, string | null>) {
  return { ...parents };
}

export function formatDistance(value: number) {
  return Number.isFinite(value) ? String(value) : "∞";
}

export function edgeKey(edge?: Pick<WeightedEdge, "from" | "to">) {
  return edge ? `${edge.from}->${edge.to}` : "";
}
