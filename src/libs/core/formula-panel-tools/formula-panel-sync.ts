/**
 * 协调公式面板中 MathLive mathfield 与底层 textarea 之间的同步。
 */
import {
  applyMatrixEnvironmentFallback,
  type InternalMathfieldInstance,
} from "./mathlive-matrix-environment";

/**
 * 提供 MathLive 与 textarea 的双向同步状态和工具函数。
 */
export type FormulaPanelSyncContext = {
  textarea: HTMLTextAreaElement | null;
  mathfield: InternalMathfieldInstance | null;
  getIsSyncing: () => boolean;
  setIsSyncing: (value: boolean) => void;
  getLastTextareaValue: () => string | null;
  setLastTextareaValue: (value: string | null) => void;
  syncTextareaHeight: () => void;
};

/**
 * 将 MathLive Mathfield 的最新值写回 textarea，并同步高度与输入事件。
 */
export function syncMathfieldToTextarea(
  context: FormulaPanelSyncContext,
): void {
  if (
    !context.textarea ||
    !context.mathfield ||
    context.getIsSyncing() ||
    context.textarea.value === context.mathfield.value
  ) {
    return;
  }

  // 先标记正在同步，防止双向互相触发。
  context.setIsSyncing(true);
  try {
    context.textarea.value = context.mathfield.value;
    context.setLastTextareaValue(context.textarea.value);
    context.syncTextareaHeight();
    context.textarea.dispatchEvent(new Event("input", { bubbles: true }));
  } finally {
    context.setIsSyncing(false);
  }
}

/**
 * 把 textarea 的内容推送回 MathLive mathfield，并记录同步状态。
 */
export function syncTextareaToMathfield(
  context: FormulaPanelSyncContext,
): void {
  if (!context.textarea || !context.mathfield || context.getIsSyncing()) {
    return;
  }

  context.setIsSyncing(true);
  context.syncTextareaHeight();
  // 将 textarea 内容覆盖 MathLive mathfield，保持高度同步。
  context.mathfield.value = context.textarea.value;
  context.setLastTextareaValue(context.textarea.value);
  context.setIsSyncing(false);
}

/**
 * 处理命令修改后的 MathLive 值，若改变则同步给 textarea。
 */
export function syncCommandDrivenMathfieldMutation(
  context: FormulaPanelSyncContext,
  previousValue: string,
): void {
  if (
    !context.mathfield ||
    context.mathfield.value === previousValue ||
    context.textarea?.value === context.mathfield.value
  ) {
    return;
  }

  syncMathfieldToTextarea(context);
}

/**
 * 在下一个微任务中尝试更新 MathLive 矩阵环境并同步 textarea。
 */
export function queueMatrixEnvironmentSync(
  context: FormulaPanelSyncContext,
  environmentName: string,
  previousValue?: string,
): void {
  queueMicrotask(() => {
    // 先在微任务中修复矩阵环境，再同步 textarea。
    applyMatrixEnvironmentFallback({
      mathfield: context.mathfield,
      textareaValue: context.textarea?.value,
      environmentName,
      previousValue,
    });
    syncMathfieldToTextarea(context);
  });
}
