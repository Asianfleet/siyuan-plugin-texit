/**
 * 提供插入/配置公式面板 MathLive 宿主 DOM、同步尺寸和显示动画的工具函数。
 */
import type {
  FormulaPanelSettings,
  FormulaPanelTextareaDisplayMode,
} from "../formula-panel-settings";

const REVEALING_CLASS = "formula-enhance__mathlive-host--revealing";
const HIDDEN_TEXTAREA_CLASS = "formula-enhance__textarea--hidden";
const HOST_SELECTOR = ".formula-enhance__mathlive-host";
export type RevealTimer = ReturnType<Window["setTimeout"]>;

/**
 * 在公式面板 DOM 中寻找 header 与 textarea 节点，供后续绑定使用。
 */
export function resolvePanelNodes(panelElement: HTMLElement): {
  header: HTMLElement | null;
  textarea: HTMLTextAreaElement | null;
} {
  const header = panelElement.querySelector(".block__icons");
  const textarea = panelElement.querySelector("textarea");

  return {
    header: header instanceof HTMLElement ? header : null,
    textarea: textarea instanceof HTMLTextAreaElement ? textarea : null,
  };
}

/**
 * 根据设备类型返回宿主容器的 className，并默认处于隐藏态。
 */
export function getHostClassName(isMobile: boolean): string {
  return [
    "formula-enhance__mathlive-host",
    isMobile
      ? "formula-enhance__mathlive-host--mobile"
      : "formula-enhance__mathlive-host--desktop",
    "fn__none",
  ].join(" ");
}

/**
 * 在 textarea 旁确保 MathLive 宿主元素存在，并初始化样式。
 */
export function ensureHost(
  textarea: HTMLTextAreaElement,
  isMobile: boolean,
): HTMLDivElement {
  const currentHost = textarea.parentElement?.querySelector(HOST_SELECTOR);
  const host =
    currentHost instanceof HTMLDivElement
      ? currentHost
      : document.createElement("div");
  // 复用现有宿主以避免重复创建渲染容器。
  host.className = getHostClassName(isMobile);

  if (!(currentHost instanceof HTMLDivElement)) {
    textarea.parentElement?.insertBefore(host, textarea);
    // 新 host 插入 textarea 之前以保持预期 DOM 结构。
  }

  return host;
}

/**
 * 强制 textarea 高度自适应当前内容。
 */
export function syncTextareaHeight(textarea: HTMLTextAreaElement): void {
  textarea.style.height = "auto";
  textarea.style.height = `${textarea.scrollHeight}px`;
  // 同步 textarea 高度以匹配滚动内容，防止滚动条闪烁。
}

/**
 * 在“编辑器独占”模式下锁定父容器宽度，避免 textarea 展示切换时跳动。
 */
export function syncTextareaLayoutWidthLock(
  textarea: HTMLTextAreaElement,
  mode: FormulaPanelTextareaDisplayMode,
): void {
  const parent = textarea.parentElement instanceof HTMLElement
    ? textarea.parentElement
    : null;
  if (!parent) {
    return;
  }

  if (mode !== "editor-only") {
    parent.style.removeProperty("width");
    return;
  }

  const textareaWidth = textarea.getBoundingClientRect().width;
  if (textareaWidth > 0) {
    parent.style.width = `${textareaWidth}px`;
    // 锁定容器宽度以匹配 textarea 精确尺寸。
  }
}

/**
 * 统一应用 padding、显示模式与高度同步，保持 textarea 与 MathLive 宿主一致。
 */
export function applyTextareaSettings(
  textarea: HTMLTextAreaElement,
  settings: FormulaPanelSettings,
): void {
  textarea.style.padding = `${settings.editorPaddingBlock}px ${settings.editorPaddingInline}px`;
  textarea.style.paddingBlock = `${settings.editorPaddingBlock}px`;
  textarea.style.paddingInline = `${settings.editorPaddingInline}px`;
  syncTextareaLayoutWidthLock(textarea, settings.editorTextareaDisplayMode);
  textarea.classList.toggle(
    HIDDEN_TEXTAREA_CLASS,
    settings.editorTextareaDisplayMode === "editor-only",
  );
  // editor-only 模式下隐藏 textarea，仅保留 MathLive 控制。
  syncTextareaHeight(textarea);
}

/**
 * 取消展开动画定时器并清除相关 class。
 */
export function clearRevealAnimation(
  host: HTMLDivElement | null,
  revealTimer: RevealTimer | null,
): null {
  if (revealTimer !== null) {
    window.clearTimeout(revealTimer);
    // 确保旧定时器不再触发后续清理。
  }

  host?.classList.remove(REVEALING_CLASS);
  return null;
}

/**
 * 播放揭示动画并在定时器回调中移除类与更新引用。
 */
export function startRevealAnimation(
  host: HTMLDivElement,
  revealDurationMs: number,
  onTimerChange: (timer: RevealTimer | null) => void,
): void {
  host.classList.add(REVEALING_CLASS);
  const revealTimer = window.setTimeout(() => {
    host.classList.remove(REVEALING_CLASS);
    onTimerChange(null);
  }, revealDurationMs);

  onTimerChange(revealTimer);
  // 注册新定时器以便外部随时取消。
}
