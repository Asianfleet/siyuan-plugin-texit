/**
 * 协调公式面板中 MathLive mathfield 与底层 textarea 之间的同步。
 */
import {
  applyMatrixEnvironmentFallback,
  type InternalMathfieldInstance,
} from "./mathlive-matrix-environment";
import {
  logFormulaPanelDebug,
  previewLatex,
} from "./formula-panel-debug";
import {
  restoreVerbatimFontStyleLatex,
} from "./mathlive-style-preservation";
import type { MathfieldCommandMutation } from "./mathlive-menu-patch";

export type DeferredMathfieldInputSync = {
  mathfieldValue: string;
  textareaValue: string;
};

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
  getDeferredMathfieldInputSync: () => DeferredMathfieldInputSync | null;
  setDeferredMathfieldInputSync: (
    value: DeferredMathfieldInputSync | null,
  ) => void;
  syncTextareaHeight: () => void;
};

/**
 * 将 MathLive Mathfield 的最新值写回 textarea，并同步高度与输入事件。
 */
export function syncMathfieldToTextarea(
  context: FormulaPanelSyncContext,
  nextValue: string | null = context.mathfield?.value ?? null,
): void {
  if (
    !context.textarea ||
    !context.mathfield ||
    nextValue === null ||
    context.getIsSyncing() ||
    context.textarea.value === nextValue
  ) {
    return;
  }

  logFormulaPanelDebug("sync-mathfield-to-textarea", {
    previousTextareaValue: previewLatex(context.textarea.value),
    nextTextareaValue: previewLatex(nextValue),
  });

  context.setIsSyncing(true);
  try {
    context.textarea.value = nextValue;
    context.setLastTextareaValue(context.textarea.value);
    if (context.mathfield.value !== nextValue) {
      context.setDeferredMathfieldInputSync({
        mathfieldValue: context.mathfield.value,
        textareaValue: nextValue,
      });
    } else {
      context.setDeferredMathfieldInputSync(null);
    }
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
  mutation: string | MathfieldCommandMutation,
): void {
  const previousValue =
    typeof mutation === "string" ? mutation : mutation.previousValue;
  const rawMathfieldValue = context.mathfield?.value ?? null;
  const nextValue =
    typeof mutation === "string"
      ? rawMathfieldValue
      : restoreVerbatimFontStyleLatex({
        mathfield: context.mathfield as Parameters<
          typeof restoreVerbatimFontStyleLatex
        >[0]["mathfield"],
        snapshot: mutation.fontStyleSnapshot,
      }) ?? rawMathfieldValue;

  logFormulaPanelDebug("sync-command-driven-mutation", {
    previousValue: previewLatex(previousValue),
    rawMathfieldValue: previewLatex(rawMathfieldValue),
    nextValue: previewLatex(nextValue),
    hasFontStyleSnapshot:
      typeof mutation === "string"
        ? false
        : Boolean(mutation.fontStyleSnapshot),
    fontStyleSnapshotEntries:
      typeof mutation === "string"
        ? 0
        : mutation.fontStyleSnapshot?.entries.length ?? 0,
  });

  const textareaAlreadyMatches = context.textarea?.value === nextValue;
  if (
    !context.mathfield ||
    nextValue === null ||
    context.mathfield.value === previousValue
  ) {
    logFormulaPanelDebug("skip-command-driven-mutation-sync", {
      hasMathfield: Boolean(context.mathfield),
      nextValueIsNull: nextValue === null,
      mathfieldEqualsPrevious:
        context.mathfield?.value === previousValue,
      textareaAlreadyMatches,
      armedDeferredSync: false,
    });
    return;
  }

  if (textareaAlreadyMatches) {
    if (context.mathfield.value !== nextValue) {
      context.setDeferredMathfieldInputSync({
        mathfieldValue: context.mathfield.value,
        textareaValue: nextValue,
      });
    } else {
      context.setDeferredMathfieldInputSync(null);
    }

    logFormulaPanelDebug("skip-command-driven-mutation-sync", {
      hasMathfield: true,
      nextValueIsNull: false,
      mathfieldEqualsPrevious: false,
      textareaAlreadyMatches: true,
      armedDeferredSync: context.mathfield.value !== nextValue,
    });
    return;
  }

  syncMathfieldToTextarea(context, nextValue);
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
