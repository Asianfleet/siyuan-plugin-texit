/**
 * 本文件管理公式面板会话与 MathLive 数学字段之间的双向同步以及 UI 显示/隐藏控制。
 * 通过在 SiYuan 面板内插入宿主元素，绑定 textarea、MathLive 和虚拟键盘，实现编辑态与预览的协调。
 */
import {
  applyTextareaSettings as applyPanelTextareaSettings,
  clearRevealAnimation as clearPanelRevealAnimation,
  ensureHost as ensurePanelHost,
  startRevealAnimation as startPanelRevealAnimation,
  syncTextareaHeight as syncPanelTextareaHeight,
  syncTextareaLayoutWidthLock as syncPanelTextareaLayoutWidthLock,
} from "./formula-panel-dom";
import type { RevealTimer } from "./formula-panel-dom";
import type { FormulaPanelSettings } from "../formula-panel-settings";
import type { InternalMathfieldInstance } from "./mathlive-matrix-environment";
import type {
  DeferredMathfieldInputSync,
  FormulaPanelSyncContext,
} from "./formula-panel-sync";
import {
  createMathliveVirtualKeyboardController,
  destroyMathliveVirtualKeyboardController,
} from "./mathlive-virtual-keyboard";

/**
 * MathLive 渲染出的数学字段实例类型，用于保持与 MathLive API 的强类型绑定。
 */
export type FormulaPanelMathfieldInstance =
  InstanceType<NonNullable<Window["MathfieldElement"]>>;

/**
 * 会话构造参数，控制移动端行为与 textarea 输入回调。
 */
type FormulaPanelSessionOptions = {
  isMobile: boolean;
  onTextareaInput: () => void;
};

/**
 * 负责维护 textarea 与 MathLive Mathfield 的状态，协调面板 DOM、同步流程与资源清理。
 */
export class FormulaPanelSession {
  host: HTMLDivElement | null = null;
  textarea: HTMLTextAreaElement | null = null;
  mathfield: FormulaPanelMathfieldInstance | null = null;
  initialized = false;
  isSyncing = false;
  lastTextareaValue: string | null = null;
  deferredMathfieldInputSync: DeferredMathfieldInputSync | null = null;
  hasAnimatedIn = false;
  revealTimer: RevealTimer | null = null;
  cleanupSuggestionPopoverStabilizer: (() => void) | null = null;
  readonly virtualKeyboardController = createMathliveVirtualKeyboardController();

  private readonly isMobile: boolean;
  private readonly onTextareaInput: () => void;

  constructor({ isMobile, onTextareaInput }: FormulaPanelSessionOptions) {
    this.isMobile = isMobile;
    this.onTextareaInput = onTextareaInput;
  }

  /**
   * 绑定或切换 textarea，并根据是否为新输入框重置同步状态后重新监听输入。
   */
  attachTextarea(textarea: HTMLTextAreaElement): void {
    const isNextTextarea = this.textarea !== textarea;

    if (isNextTextarea) {
      this.hideHost();
      this.detachTextareaListener();
      this.host?.remove();
      this.host = null;
      this.textarea = textarea;
      this.initialized = false;
      this.isSyncing = false;
      this.lastTextareaValue = null;
      this.deferredMathfieldInputSync = null;
      this.textarea.addEventListener("input", this.onTextareaInput);
      // 重新绑定输入监听以保持会话同步。
    } else if (!this.initialized) {
      this.textarea.addEventListener("input", this.onTextareaInput);
      // 未初始化时持续监听以捕获首轮输入。
    }

    this.textarea.style.boxSizing = "border-box";
  }

  /**
   * 保障 MathLive 宿主存在，便于插入渲染节点。
   */
  ensureHost(): HTMLDivElement | null {
    if (!this.textarea) {
      return null;
    }

    this.host = ensurePanelHost(this.textarea, this.isMobile);
    return this.host;
  }

  /**
   * 将公式面板设置应用到 textarea，更新 padding 及隐藏态等。
   */
  applyTextareaSettings(nextSettings: FormulaPanelSettings): void {
    if (this.textarea) {
      applyPanelTextareaSettings(this.textarea, nextSettings);
    }
  }

  /**
   * 根据展示模式锁定 textarea 父容器宽度，防止移动端布局跳动。
   */
  syncTextareaLayoutWidthLock(
    editorTextareaDisplayMode: FormulaPanelSettings["editorTextareaDisplayMode"],
  ): void {
    if (this.textarea) {
      syncPanelTextareaLayoutWidthLock(this.textarea, editorTextareaDisplayMode);
    }
  }

  /**
   * 构建同步上下文供公式面板调度器读取与写入状态。
   */
  getSyncContext(): FormulaPanelSyncContext {
    return {
      textarea: this.textarea,
      mathfield: this.mathfield as InternalMathfieldInstance | null,
      getIsSyncing: () => this.isSyncing,
      setIsSyncing: (value) => {
        this.isSyncing = value;
      },
      getLastTextareaValue: () => this.lastTextareaValue,
      setLastTextareaValue: (value) => {
        this.lastTextareaValue = value;
      },
      getDeferredMathfieldInputSync: () => this.deferredMathfieldInputSync,
      setDeferredMathfieldInputSync: (value) => {
        this.deferredMathfieldInputSync = value;
      },
      syncTextareaHeight: () => {
        this.syncTextareaHeight();
      },
    };
  }

  /**
   * 将 textarea 内容推送到 MathLive mathfield，防止反复设置造成冲突。
   */
  syncMathfieldValueFromTextarea(): void {
    if (
      !this.textarea ||
      !this.mathfield ||
      this.lastTextareaValue === this.textarea.value
    ) {
      return;
    }

    // 标记正在同步以防止双向循环更新。
    this.isSyncing = true;
    try {
      this.mathfield.value = this.textarea.value;
      this.lastTextareaValue = this.textarea.value;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * 取消隐藏类以显示 MathLive 渲染容器。
   */
  showHost(): void {
    this.host?.classList.remove("fn__none");
  }

  /**
   * 隐藏 MathLive 宿主同时清理任何展开动画。
   */
  hideHost(): void {
    this.clearRevealAnimation();
    this.host?.classList.add("fn__none");
  }

  /**
   * 首次延迟显示宿主，播放展开动画并记录定时器。
   */
  revealHostOnce(revealDurationMs: number): void {
    if (this.hasAnimatedIn || !this.host) {
      return;
    }

    this.clearRevealAnimation();
    startPanelRevealAnimation(this.host, revealDurationMs, (timer) => {
      this.revealTimer = timer;
    });
    this.hasAnimatedIn = true;
  }

  /**
   * 卸载时清理 DOM、虚拟键盘、事件与会话状态，避免残留内存。
   */
  destroy(): void {
    this.hideHost();
    // 重置布局锁定以释放 textarea 父容器宽度限制。
    this.syncTextareaLayoutWidthLock("both");
    this.cleanupSuggestionPopoverStabilizer?.();
    // 清除可能残留的建议气泡稳定器。
    this.cleanupSuggestionPopoverStabilizer = null;
    destroyMathliveVirtualKeyboardController(this.virtualKeyboardController);
    this.detachTextareaListener();
    this.host?.remove();
    this.host = null;
    this.textarea = null;
    this.mathfield = null;
    this.initialized = false;
    this.isSyncing = false;
    this.lastTextareaValue = null;
    this.deferredMathfieldInputSync = null;
    this.hasAnimatedIn = false;
  }

  /**
   * 清除正在进行的展开动画，取消计时器并移除类。
   */
  private clearRevealAnimation(): void {
    this.revealTimer = clearPanelRevealAnimation(this.host, this.revealTimer);
  }

  /**
   * 根据滚动高度同步 textarea 的自适应高度。
   */
  private syncTextareaHeight(): void {
    if (this.textarea) {
      syncPanelTextareaHeight(this.textarea);
    }
  }

  /**
   * 取消注册 textarea 的 input 监听以避免泄露。
   */
  private detachTextareaListener(): void {
    if (this.textarea) {
      this.textarea.removeEventListener("input", this.onTextareaInput);
    }
  }
}
