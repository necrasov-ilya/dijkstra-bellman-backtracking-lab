import {
  cloneDistances,
  cloneParents,
  INF,
  type WeightedEdge,
  type WeightedRun,
  type WeightedStep,
  type WeightedTask,
} from "./types";

function reconstructPath(
  parents: Record<string, string | null>,
  start: string,
  finish: string,
): string[] {
  const path: string[] = [];
  const seen = new Set<string>();
  let current: string | null = finish;

  while (current !== null && !seen.has(current)) {
    seen.add(current);
    path.push(current);

    if (current === start) {
      return path.reverse();
    }

    current = parents[current];
  }

  return [];
}

function extractCycle(
  nodes: string[],
  parents: Record<string, string | null>,
  changedNode: string,
): string[] {
  let current = changedNode;

  for (let i = 0; i < nodes.length; i += 1) {
    current = parents[current] ?? changedNode;
  }

  const cycle: string[] = [];
  const seen = new Set<string>();

  while (!seen.has(current)) {
    seen.add(current);
    cycle.push(current);
    current = parents[current] ?? changedNode;
  }

  cycle.push(current);
  const startIndex = cycle.indexOf(current);
  return cycle.slice(startIndex).reverse();
}

function edgeText(edge: WeightedEdge) {
  return `${edge.from} -> ${edge.to}`;
}

export function runBellmanFord(task: WeightedTask): WeightedRun {
  const nodes = task.nodes.map((node) => node.id);
  const distances = Object.fromEntries(nodes.map((id) => [id, INF])) as Record<string, number>;
  const parents = Object.fromEntries(nodes.map((id) => [id, null])) as Record<string, string | null>;
  const steps: WeightedStep[] = [];
  let negativeCycle: string[] | undefined;

  distances[task.start] = 0;

  const pushStep = (step: Omit<WeightedStep, "id" | "distances" | "parents">) => {
    steps.push({
      ...step,
      id: `bellman-${steps.length}`,
      distances: cloneDistances(distances),
      parents: cloneParents(parents),
    });
  };

  pushStep({
    title: "Старт",
    detail: `dist[${task.start}] = 0. Все остальные вершины пока недостижимы.`,
    phase: "init",
    activeNode: task.start,
  });

  for (let pass = 1; pass <= nodes.length - 1; pass += 1) {
    let changedOnPass = false;

    pushStep({
      title: `Проход ${pass}`,
      detail: "Проверяем все ребра. Если путь через ребро дешевле, обновляем расстояние и родителя.",
      phase: "pass",
    });

    for (const edge of task.edges) {
      if (!Number.isFinite(distances[edge.from])) {
        pushStep({
          title: `Пропускаем ${edgeText(edge)}`,
          detail: `До ${edge.from} пока нельзя добраться из ${task.start}, поэтому это ребро не влияет на ответ.`,
          phase: "relax",
          activeEdge: edge,
          activeNode: edge.to,
        });
        continue;
      }

      const candidate = distances[edge.from] + edge.weight;
      const previous = distances[edge.to];

      if (candidate < previous) {
        distances[edge.to] = candidate;
        parents[edge.to] = edge.from;
        changedOnPass = true;
        pushStep({
          title: `Релаксация ${edgeText(edge)}`,
          detail: `${distances[edge.from]} + ${edge.weight} = ${candidate}. Значение для ${edge.to} стало меньше.`,
          phase: "relax",
          activeEdge: edge,
          activeNode: edge.to,
          changedNode: edge.to,
        });
      } else {
        pushStep({
          title: `Без изменений ${edgeText(edge)}`,
          detail: `${distances[edge.from]} + ${edge.weight} = ${candidate}. Это не лучше текущего значения ${previous}.`,
          phase: "relax",
          activeEdge: edge,
          activeNode: edge.to,
        });
      }
    }

    if (!changedOnPass) {
      pushStep({
        title: "Раннее завершение",
        detail: "На этом проходе не было обновлений, значит дальше таблица расстояний уже не изменится.",
        phase: "done",
      });
      break;
    }
  }

  pushStep({
    title: "Проверка отрицательного цикла",
    detail: "Еще раз смотрим все ребра. Если какое-то ребро все еще улучшает расстояние, найден отрицательный цикл.",
    phase: "check",
  });

  for (const edge of task.edges) {
    if (Number.isFinite(distances[edge.from]) && distances[edge.from] + edge.weight < distances[edge.to]) {
      parents[edge.to] = edge.from;
      negativeCycle = extractCycle(nodes, parents, edge.to);
      pushStep({
        title: "Отрицательный цикл найден",
        detail: `${edgeText(edge)} снова улучшает расстояние. Кратчайший путь становится бесконечно дешевле.`,
        phase: "check",
        activeEdge: edge,
        activeNode: edge.to,
        negativeCycle,
      });
      break;
    }
  }

  const path = task.finish && !negativeCycle ? reconstructPath(parents, task.start, task.finish) : undefined;
  const cost = task.finish ? distances[task.finish] : undefined;

  pushStep({
    title: negativeCycle ? "Ответ: цикл отрицательного веса" : "Ответ",
    detail: negativeCycle
      ? `Найден цикл: ${negativeCycle.join(" -> ")}. Обычного конечного кратчайшего пути нет.`
      : task.finish && path?.length
        ? `Путь: ${path.join(" -> ")}. Длина: ${cost}.`
        : "Кратчайшие расстояния от стартовой вершины найдены.",
    phase: "done",
    path,
    negativeCycle,
  });

  return {
    task,
    steps,
    distances,
    parents,
    path,
    cost,
    negativeCycle,
  };
}
