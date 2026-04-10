/**
 * 管理公式面板中 MathLive 矩阵环境的同步与光标辅助逻辑。
 */
/**
 * 表示矩阵环境所需的左右分隔符字符串。
 */
type MatrixDelimiters = {
  leftDelim: string;
  rightDelim: string;
};

/**
 * MathLive 内部用于表示数组环境的结构（包括矩阵类型及边界符）。
 */
export type MathfieldArrayEnvironment = {
  type?: string;
  environmentName?: string;
  leftDelim?: string;
  rightDelim?: string;
};

/**
 * MathLive 公式内部模型的简化视图，用于访问原子和触发内容变化。
 */
type MathfieldInternalModel = {
  at?: (offset: number) => MathfieldArrayEnvironment | undefined;
  parentEnvironment?: MathfieldArrayEnvironment | undefined;
  lastOffset?: number;
  contentDidChange?: (options?: { inputType?: string; data?: string }) => void;
};

/**
 * 代表公式编辑器实例的状态（值、位置及可重放的快照）。
 */
export type InternalMathfieldInstance = {
  value: string;
  model?: MathfieldInternalModel;
  position?: number;
  snapshot?: (operation?: string) => void;
};

const MATRIX_ENVIRONMENT_BY_MENU_ID: Record<string, string> = {
  "environment-no-border": "matrix",
  "environment-parentheses": "pmatrix",
  "environment-brackets": "bmatrix",
  "environment-bar": "vmatrix",
  "environment-braces": "Bmatrix",
};

/**
 * 根据菜单条目获取 MathLive 的矩阵环境名称以供切换。
 */
export function resolveMatrixEnvironmentName(
  menuId?: string,
): string | undefined {
  return menuId ? MATRIX_ENVIRONMENT_BY_MENU_ID[menuId] : undefined;
}

/**
 * 为指定的矩阵环境名提供对应的左右分隔符，支持带星号的变体。
 */
function getMatrixDelimiters(environmentName: string): MatrixDelimiters {
  // 根据具体环境名匹配合适的括号/界定符。
  switch (environmentName) {
    case "pmatrix":
    case "pmatrix*":
      return { leftDelim: "(", rightDelim: ")" };
    case "bmatrix":
    case "bmatrix*":
      return { leftDelim: "[", rightDelim: "]" };
    case "Bmatrix":
    case "Bmatrix*":
      return { leftDelim: "\\lbrace", rightDelim: "\\rbrace" };
    case "vmatrix":
    case "vmatrix*":
      return { leftDelim: "\\vert", rightDelim: "\\vert" };
    case "Vmatrix":
    case "Vmatrix*":
      return { leftDelim: "\\Vert", rightDelim: "\\Vert" };
    case "rcases":
      return { leftDelim: ".", rightDelim: "\\rbrace" };
    case "cases":
    case "dcases":
      return { leftDelim: "\\lbrace", rightDelim: "." };
    default:
      return { leftDelim: ".", rightDelim: "." };
  }
}

/**
 * 在 LaTeX 字符串中替换当前矩阵环境为指定的名称（保持星号状态）。
 */
export function replaceMatrixEnvironmentInLatex(
  latex: string,
  environmentName: string,
): string | null {
  // 先定位当前的矩阵环境标签，若不存在则说明无法替换。
  const beginMatch = latex.match(/\\begin\{((?:[pPbBvV]?matrix)\*?)\}/);
  if (!beginMatch) {
    return null;
  }

  const currentEnvironmentName = beginMatch[1];
  const targetEnvironmentName = currentEnvironmentName.endsWith("*")
    ? `${environmentName}*`
    : environmentName;
  if (currentEnvironmentName === targetEnvironmentName) {
    return latex;
  }

  const nextLatex = latex.replace(
    `\\begin{${currentEnvironmentName}}`,
    `\\begin{${targetEnvironmentName}}`,
  ).replace(
    `\\end{${currentEnvironmentName}}`,
    `\\end{${targetEnvironmentName}}`,
  );

  return nextLatex === latex ? null : nextLatex;
}

/**
 * 从 MathLive 模型中查找当前或顶层数组/矩阵环境。
 */
function findArrayEnvironment(
  mathfield: InternalMathfieldInstance,
): MathfieldArrayEnvironment | null {
  const model = mathfield.model;
  if (!model?.at) {
    return null;
  }

  if (typeof mathfield.position === "number") {
    const currentAtom = model.at(mathfield.position);
    if (currentAtom?.type === "array") {
      return currentAtom;
    }
  }

  if (model.parentEnvironment?.type === "array") {
    return model.parentEnvironment;
  }

  if (typeof model.lastOffset !== "number") {
    return null;
  }

  // 从头到尾扫描，确保能定位到公式中已存在的矩阵数组。
  for (let offset = 0; offset <= model.lastOffset; offset += 1) {
    const atom = model.at(offset);
    if (atom?.type === "array") {
      if (typeof mathfield.position === "number") {
        // 如果当前光标不在数组内部，移动到刚才发现的数组起始位置。
        mathfield.position = offset;
      }
      return atom;
    }
  }

  return null;
}

/**
 * 在 MathLive 模型无法自动切换环境时，尝试手动同步矩阵环境并更新显示。
 */
export function applyMatrixEnvironmentFallback({
  mathfield,
  textareaValue,
  environmentName,
  previousValue,
}: {
  mathfield: InternalMathfieldInstance | null;
  textareaValue?: string | null;
  environmentName: string;
  previousValue?: string;
}): void {
  if (!mathfield) {
    return;
  }

  if (previousValue !== undefined && mathfield.value !== previousValue) {
    return;
  }

  const model = mathfield.model;
  const arrayEnvironment = findArrayEnvironment(mathfield);
  // 优先通过内部模型直接修改环境，避免重新设置整个 LaTeX。
  if (arrayEnvironment && model?.contentDidChange) {
    const { leftDelim, rightDelim } = getMatrixDelimiters(environmentName);
    if (
      arrayEnvironment.environmentName === environmentName &&
      arrayEnvironment.leftDelim === leftDelim &&
      arrayEnvironment.rightDelim === rightDelim
    ) {
      return;
    }

    mathfield.snapshot?.("set-environment");
    arrayEnvironment.environmentName = environmentName;
    arrayEnvironment.leftDelim = leftDelim;
    arrayEnvironment.rightDelim = rightDelim;
    model.contentDidChange({});

    if (typeof mathfield.position === "number") {
      mathfield.position = mathfield.position;
    }
    return;
  }

  const fallbackSource = previousValue ?? mathfield.value ?? textareaValue ?? "";
  // 若模型更新无效，则退回到 LaTeX 字符串替换策略。
  const nextLatex = replaceMatrixEnvironmentInLatex(
    fallbackSource,
    environmentName,
  );
  if (!nextLatex) {
    return;
  }

  mathfield.value = nextLatex;
}

/**
 * 若光标不在矩阵内部且根元素为数组，则移动到矩阵开头。
 */
export function placeCaretIntoRootMatrixIfNeeded(
  mathfield: InternalMathfieldInstance | null,
): void {
  const model = mathfield?.model;
  if (!mathfield || !model?.at || typeof mathfield.position !== "number") {
    return;
  }

  // 判断当前光标位置是否已经处于矩阵结构中。
  const currentAtom = model.at(mathfield.position);
  const currentEnvironment = model.parentEnvironment;
  const firstAtom = model.at(1);
  const isAlreadyInsideMatrix =
    currentAtom?.type === "array" || currentEnvironment?.type === "array";

  if (!isAlreadyInsideMatrix && firstAtom?.type === "array") {
    mathfield.position = 1;
  }
}
