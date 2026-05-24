import type { BacktrackingRun, BacktrackingStep, BacktrackingTask } from "./types";

export const backtrackingTasks: BacktrackingTask[] = [
  {
    id: "bt-01",
    kind: "permutations",
    title: "Задача 1. Перестановки чисел",
    shortTitle: "1. Перестановки",
    subtitle: "Все возможные порядки уникальных чисел",
    question: "Дан массив уникальных чисел. Верните все возможные перестановки.",
    inputLabel: "[1, 2, 3]",
    payload: { nums: [1, 2, 3] },
    expected: ["[1,2,3]", "[1,3,2]", "[2,1,3]", "[2,3,1]", "[3,1,2]", "[3,2,1]"],
  },
  {
    id: "bt-02",
    kind: "subsets",
    title: "Задача 2. Подмножества",
    shortTitle: "2. Подмножества",
    subtitle: "Каждый элемент можно взять или пропустить",
    question: "Дан массив уникальных чисел. Верните все возможные подмножества.",
    inputLabel: "[1, 2, 3]",
    payload: { nums: [1, 2, 3] },
    expected: ["[]", "[1]", "[2]", "[3]", "[1,2]", "[1,3]", "[2,3]", "[1,2,3]"],
  },
  {
    id: "bt-03",
    kind: "maze",
    title: "Задача 3. Путь в лабиринте",
    shortTitle: "3. Лабиринт",
    subtitle: "Поиск допустимого пути с откатом",
    question: "Найдите путь от (0,0) до (N-1,M-1) в матрице с препятствиями.",
    inputLabel: "[[0,0,0], [1,1,0], [0,0,0]]",
    payload: {
      grid: [
        [0, 0, 0],
        [1, 1, 0],
        [0, 0, 0],
      ],
    },
    expected: ["Существует путь: Да", "Один путь: (0,0) -> (0,1) -> (0,2) -> (1,2) -> (2,2)"],
  },
  {
    id: "bt-04",
    kind: "parentheses",
    title: "Задача 4. Генерация скобок",
    shortTitle: "4. Скобки",
    subtitle: "Все правильные комбинации из N пар",
    question: "Создайте все правильные комбинации из N пар скобок.",
    inputLabel: "N = 3",
    payload: { pairs: 3 },
    expected: ["((()))", "(()())", "(())()", "()(())", "()()()"],
  },
  {
    id: "bt-05",
    kind: "combination-sum",
    title: "Задача 5. Комбинации сумм",
    shortTitle: "5. Суммы",
    subtitle: "Комбинации чисел, дающие целевую сумму",
    question: "Найдите комбинации чисел из массива, дающие целевую сумму.",
    inputLabel: "[2, 3, 6, 7], target = 7",
    payload: { candidates: [2, 3, 6, 7], target: 7 },
    expected: ["[2,2,3]", "[7]"],
  },
];

function makeStepFactory(task: BacktrackingTask) {
  const steps: BacktrackingStep[] = [];
  const solutions: string[] = [];

  const push = (step: Omit<BacktrackingStep, "id" | "solutions">) => {
    steps.push({
      ...step,
      id: `${task.id}-${steps.length}`,
      solutions: [...solutions],
    });
  };

  return { steps, solutions, push };
}

function arrayState(values: number[]) {
  return `[${values.join(", ")}]`;
}

function runPermutations(task: BacktrackingTask): BacktrackingRun {
  const payload = task.payload as { nums: number[] };
  const { steps, solutions, push } = makeStepFactory(task);
  const used = new Set<number>();
  const current: number[] = [];

  function backtrack(depth: number) {
    if (current.length === payload.nums.length) {
      const solution = `[${current.join(",")}]`;
      solutions.push(solution);
      push({
        title: "Готовая перестановка",
        detail: `${arrayState(current)} содержит все числа, сохраняем решение.`,
        action: "solution",
        depth,
        state: arrayState(current),
      });
      return;
    }

    for (const num of payload.nums) {
      if (used.has(num)) {
        push({
          title: `Пропускаем ${num}`,
          detail: "Число уже есть в текущей перестановке.",
          action: "reject",
          depth,
          state: arrayState(current),
          candidate: String(num),
        });
        continue;
      }

      current.push(num);
      used.add(num);
      push({
        title: `Берем ${num}`,
        detail: `Добавляем ${num} и углубляемся в следующую позицию.`,
        action: "choose",
        depth,
        state: arrayState(current),
        candidate: String(num),
      });
      backtrack(depth + 1);
      current.pop();
      used.delete(num);
      push({
        title: `Откат после ${num}`,
        detail: `Убираем ${num}, чтобы попробовать другую ветку.`,
        action: "backtrack",
        depth,
        state: arrayState(current),
        candidate: String(num),
      });
    }
  }

  push({
    title: "Старт",
    detail: "Начинаем с пустой перестановки.",
    action: "choose",
    depth: 0,
    state: "[]",
  });
  backtrack(0);

  return { task, steps, solutions, summary: `Найдено перестановок: ${solutions.length}` };
}

function runSubsets(task: BacktrackingTask): BacktrackingRun {
  const payload = task.payload as { nums: number[] };
  const { steps, solutions, push } = makeStepFactory(task);
  const current: number[] = [];

  function backtrack(index: number) {
    const solution = `[${current.join(",")}]`;
    solutions.push(solution);
    push({
      title: "Сохраняем подмножество",
      detail: "Любой промежуточный набор является корректным подмножеством.",
      action: "solution",
      depth: index,
      state: arrayState(current),
    });

    for (let i = index; i < payload.nums.length; i += 1) {
      current.push(payload.nums[i]);
      push({
        title: `Добавляем ${payload.nums[i]}`,
        detail: "После выбора продолжаем только с правой части массива, чтобы не повторять комбинации.",
        action: "choose",
        depth: i,
        state: arrayState(current),
        candidate: String(payload.nums[i]),
      });
      backtrack(i + 1);
      const removed = current.pop();
      push({
        title: `Откат после ${removed}`,
        detail: "Возвращаемся и пробуем следующее число.",
        action: "backtrack",
        depth: i,
        state: arrayState(current),
        candidate: String(removed),
      });
    }
  }

  push({
    title: "Старт",
    detail: "Пустое множество тоже является ответом.",
    action: "choose",
    depth: 0,
    state: "[]",
  });
  backtrack(0);

  return { task, steps, solutions, summary: `Найдено подмножеств: ${solutions.length}` };
}

function cellKey(r: number, c: number) {
  return `${r},${c}`;
}

function runMaze(task: BacktrackingTask): BacktrackingRun {
  const payload = task.payload as { grid: number[][] };
  const { steps, solutions, push } = makeStepFactory(task);
  const rows = payload.grid.length;
  const cols = payload.grid[0].length;
  const target = cellKey(rows - 1, cols - 1);
  const visited = new Set<string>();
  const path: string[] = [];
  let solved = false;

  function dfs(r: number, c: number, depth: number): boolean {
    const key = cellKey(r, c);

    if (r < 0 || c < 0 || r >= rows || c >= cols) {
      push({
        title: "Выход за границу",
        detail: `Клетка (${r},${c}) вне матрицы.`,
        action: "reject",
        depth,
        state: path.join(" -> ") || "старт",
        candidate: `(${r},${c})`,
        mazePath: [...path],
        mazeVisited: [...visited],
      });
      return false;
    }

    if (payload.grid[r][c] === 1 || visited.has(key)) {
      push({
        title: payload.grid[r][c] === 1 ? "Стена" : "Уже были здесь",
        detail: `Клетка (${r},${c}) не подходит для продолжения пути.`,
        action: "reject",
        depth,
        state: path.join(" -> ") || "старт",
        candidate: `(${r},${c})`,
        mazePath: [...path],
        mazeVisited: [...visited],
      });
      return false;
    }

    visited.add(key);
    path.push(key);
    push({
      title: `Идем в (${r},${c})`,
      detail: "Клетка свободна, добавляем ее в текущий путь.",
      action: "choose",
      depth,
      state: path.join(" -> "),
      candidate: `(${r},${c})`,
      mazePath: [...path],
      mazeVisited: [...visited],
    });

    if (key === target) {
      const solution = path.map((cell) => `(${cell})`).join(" -> ");
      solutions.push(solution);
      solved = true;
      push({
        title: "Выход найден",
        detail: "Достигли правого нижнего угла.",
        action: "solution",
        depth,
        state: path.join(" -> "),
        mazePath: [...path],
        mazeVisited: [...visited],
      });
      return true;
    }

    const moves = [
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0],
    ];

    for (const [dr, dc] of moves) {
      if (dfs(r + dr, c + dc, depth + 1)) {
        return true;
      }
    }

    const removed = path.pop();
    push({
      title: `Откат из (${removed})`,
      detail: "Из этой клетки путь к выходу не найден, возвращаемся назад.",
      action: "backtrack",
      depth,
      state: path.join(" -> ") || "старт",
      mazePath: [...path],
      mazeVisited: [...visited],
    });
    return false;
  }

  push({
    title: "Старт",
    detail: "Ищем путь из левого верхнего угла в правый нижний.",
    action: "choose",
    depth: 0,
    state: "(0,0)",
    mazeVisited: [],
    mazePath: [],
  });
  dfs(0, 0, 0);

  return {
    task,
    steps,
    solutions: solved ? solutions : ["Пути нет"],
    summary: solved ? "Существует путь: Да" : "Существует путь: Нет",
  };
}

function runParentheses(task: BacktrackingTask): BacktrackingRun {
  const payload = task.payload as { pairs: number };
  const { steps, solutions, push } = makeStepFactory(task);

  function backtrack(current: string, open: number, close: number, depth: number) {
    if (current.length === payload.pairs * 2) {
      solutions.push(current);
      push({
        title: "Готовая строка",
        detail: "Количество открывающих и закрывающих скобок корректно.",
        action: "solution",
        depth,
        state: current,
      });
      return;
    }

    if (open < payload.pairs) {
      push({
        title: "Добавляем (",
        detail: "Открывающих скобок еще меньше N.",
        action: "choose",
        depth,
        state: `${current}(`,
        candidate: "(",
      });
      backtrack(`${current}(`, open + 1, close, depth + 1);
      push({
        title: "Откат после (",
        detail: "Возвращаемся, чтобы попробовать закрывающую скобку или другую ветку.",
        action: "backtrack",
        depth,
        state: current,
        candidate: "(",
      });
    }

    if (close < open) {
      push({
        title: "Добавляем )",
        detail: "Закрывающая скобка допустима, если перед ней есть незакрытая открывающая.",
        action: "choose",
        depth,
        state: `${current})`,
        candidate: ")",
      });
      backtrack(`${current})`, open, close + 1, depth + 1);
      push({
        title: "Откат после )",
        detail: "Убираем закрывающую скобку и возвращаемся выше.",
        action: "backtrack",
        depth,
        state: current,
        candidate: ")",
      });
    } else if (current.length < payload.pairs * 2) {
      push({
        title: "Нельзя добавить )",
        detail: "Закрывающих скобок не может быть больше открывающих.",
        action: "reject",
        depth,
        state: current,
        candidate: ")",
      });
    }
  }

  push({
    title: "Старт",
    detail: "Строим строку слева направо.",
    action: "choose",
    depth: 0,
    state: "",
  });
  backtrack("", 0, 0, 0);

  return { task, steps, solutions, summary: `Найдено правильных строк: ${solutions.length}` };
}

function runCombinationSum(task: BacktrackingTask): BacktrackingRun {
  const payload = task.payload as { candidates: number[]; target: number };
  const { steps, solutions, push } = makeStepFactory(task);
  const current: number[] = [];

  function backtrack(startIndex: number, sum: number, depth: number) {
    if (sum === payload.target) {
      const solution = `[${current.join(",")}]`;
      solutions.push(solution);
      push({
        title: "Сумма найдена",
        detail: `${arrayState(current)} дает target = ${payload.target}.`,
        action: "solution",
        depth,
        state: arrayState(current),
      });
      return;
    }

    if (sum > payload.target) {
      push({
        title: "Отсечение ветви",
        detail: `Сумма ${sum} больше target = ${payload.target}. Дальше идти нет смысла.`,
        action: "reject",
        depth,
        state: arrayState(current),
      });
      return;
    }

    for (let i = startIndex; i < payload.candidates.length; i += 1) {
      const value = payload.candidates[i];
      current.push(value);
      push({
        title: `Добавляем ${value}`,
        detail: `Текущая сумма станет ${sum + value}. Число можно использовать повторно.`,
        action: "choose",
        depth,
        state: arrayState(current),
        candidate: String(value),
      });
      backtrack(i, sum + value, depth + 1);
      current.pop();
      push({
        title: `Откат после ${value}`,
        detail: "Возвращаемся и пробуем следующий кандидат.",
        action: "backtrack",
        depth,
        state: arrayState(current),
        candidate: String(value),
      });
    }
  }

  push({
    title: "Старт",
    detail: `Ищем комбинации с суммой ${payload.target}.`,
    action: "choose",
    depth: 0,
    state: "[]",
  });
  backtrack(0, 0, 0);

  return { task, steps, solutions, summary: `Найдено комбинаций: ${solutions.length}` };
}

export function runBacktracking(task: BacktrackingTask): BacktrackingRun {
  switch (task.kind) {
    case "permutations":
      return runPermutations(task);
    case "subsets":
      return runSubsets(task);
    case "maze":
      return runMaze(task);
    case "parentheses":
      return runParentheses(task);
    case "combination-sum":
      return runCombinationSum(task);
  }
}
