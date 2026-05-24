import {
  cloneDistances,
  cloneParents,
  INF,
  type WeightedRun,
  type WeightedStep,
  type WeightedTask,
} from "./types";

function reconstructPath(parents: Record<string, string | null>, start: string, finish: string) {
  const path: string[] = [];
  let current: string | null = finish;

  while (current !== null) {
    path.push(current);
    if (current === start) {
      return path.reverse();
    }
    current = parents[current];
  }

  return [];
}

export function runDijkstra(task: WeightedTask): WeightedRun {
  const nodes = task.nodes.map((node) => node.id);
  const distances = Object.fromEntries(nodes.map((id) => [id, INF])) as Record<string, number>;
  const parents = Object.fromEntries(nodes.map((id) => [id, null])) as Record<string, string | null>;
  const settled = new Set<string>();
  const queue: Array<{ node: string; cost: number }> = [];
  const steps: WeightedStep[] = [];

  distances[task.start] = 0;
  queue.push({ node: task.start, cost: 0 });

  const pushStep = (step: Omit<WeightedStep, "id" | "distances" | "parents" | "settledNodes">) => {
    steps.push({
      ...step,
      id: `dijkstra-${steps.length}`,
      distances: cloneDistances(distances),
      parents: cloneParents(parents),
      settledNodes: Array.from(settled),
    });
  };

  pushStep({
    title: "Старт",
    detail: `Стоимость до "${task.start}" равна 0, остальные вершины пока бесконечны.`,
    phase: "init",
    activeNode: task.start,
  });

  while (queue.length > 0) {
    queue.sort((a, b) => a.cost - b.cost);
    const current = queue.shift()!;

    if (settled.has(current.node)) {
      continue;
    }

    settled.add(current.node);
    pushStep({
      title: `Берем вершину "${current.node}"`,
      detail: `У нее минимальная известная стоимость: ${current.cost}. Теперь проверяем исходящие ребра.`,
      phase: "select",
      activeNode: current.node,
    });

    if (task.finish && current.node === task.finish) {
      break;
    }

    for (const edge of task.edges.filter((item) => item.from === current.node)) {
      const nextCost = distances[current.node] + edge.weight;
      const previousCost = distances[edge.to];

      if (nextCost < previousCost) {
        distances[edge.to] = nextCost;
        parents[edge.to] = edge.from;
        queue.push({ node: edge.to, cost: nextCost });
        pushStep({
          title: `Обновляем "${edge.to}"`,
          detail: `${edge.from} -> ${edge.to}: ${distances[edge.from]} + ${edge.weight} = ${nextCost}. Это дешевле прежнего значения.`,
          phase: "relax",
          activeNode: edge.to,
          activeEdge: edge,
          changedNode: edge.to,
        });
      } else {
        pushStep({
          title: `Оставляем "${edge.to}"`,
          detail: `${edge.from} -> ${edge.to}: ${distances[edge.from]} + ${edge.weight} = ${nextCost}. Это не улучшает ${previousCost}.`,
          phase: "relax",
          activeNode: edge.to,
          activeEdge: edge,
        });
      }
    }
  }

  const finish = task.finish ?? task.start;
  const path = task.finish ? reconstructPath(parents, task.start, finish) : undefined;
  const cost = task.finish ? distances[finish] : undefined;

  pushStep({
    title: "Ответ",
    detail: path?.length
      ? `Итоговый путь: ${path.join(" -> ")}. Стоимость: ${cost}.`
      : "Все достижимые расстояния найдены.",
    phase: "done",
    activeNode: finish,
    path,
  });

  return {
    task,
    steps,
    distances,
    parents,
    path,
    cost,
  };
}
