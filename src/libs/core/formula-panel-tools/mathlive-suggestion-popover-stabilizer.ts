/**
 * 防止 MathLive 建议弹窗在键盘导航时被意外移除的补丁集合。
 */
const SUGGESTION_POPOVER_ID = "mathlive-suggestion-popover";
/** 触发稳定化机制的按键集合。 */
const STABILIZE_KEYS = new Set(["ArrowUp", "ArrowDown"]);
/** 在该毫秒窗口内会禁止弹窗被移除。 */
const STABILIZE_WINDOW_MS = 120;

let removePatchInstalled = false;
let suppressPopoverRemovalUntil = 0;
let globalKeydownListenerInstalled = false;
let activeStabilizerCount = 0;
const originalElementRemove = HTMLElement.prototype.remove;

/**
 * 判断当前元素是否需要延迟移除（即正在显示的建议弹窗）。
 */
function shouldSuppressSuggestionPopoverRemoval(element: HTMLElement): boolean {
  return (
    element.id === SUGGESTION_POPOVER_ID &&
    Date.now() <= suppressPopoverRemovalUntil
  );
}

/**
 * 通过暂时重写 `HTMLElement.remove` 让 MathLive 的弹窗保留在 DOM 中。
 */
function installSuggestionPopoverRemovePatch(): void {
  if (removePatchInstalled) {
    return;
  }

  HTMLElement.prototype.remove = function patchedRemove(): void {
    if (shouldSuppressSuggestionPopoverRemoval(this)) {
      // 通过调整 refcount 让 MathLive 自身的移除逻辑无效化。
      this.dataset.refcount = "0";
      return;
    }

    return originalElementRemove.call(this);
  };

  removePatchInstalled = true;
}

/**
 * 启动短暂抑制期间，避免弹窗被尽快移除。
 */
function armSuggestionPopoverRemovalSuppression(): void {
  suppressPopoverRemovalUntil = Date.now() + STABILIZE_WINDOW_MS;
}

/**
 * 在捕获阶段监听方向键以保持建议弹窗稳定。
 */
function onGlobalKeydown(event: KeyboardEvent): void {
  if (!STABILIZE_KEYS.has(event.key)) {
    return;
  }

  const popover = document.getElementById(SUGGESTION_POPOVER_ID);
  if (!(popover instanceof HTMLElement) || !popover.classList.contains("is-visible")) {
    return;
  }

  // 只要仍有可见弹窗，就延迟它的移除。
  armSuggestionPopoverRemovalSuppression();
}

/**
 * 注册全局 keydown 监听器用于捕捉方向键事件。
 */
function installGlobalKeydownListener(): void {
  if (globalKeydownListenerInstalled) {
    return;
  }

  document.addEventListener("keydown", onGlobalKeydown, true);
  globalKeydownListenerInstalled = true;
}

/**
 * 入口函数：安装稳定器并返回清理函数以撤销注册。
 */
export function installMathLiveSuggestionPopoverStabilizer(
  _mathfield: HTMLElement,
): () => void {
  installSuggestionPopoverRemovePatch();
  installGlobalKeydownListener();
  activeStabilizerCount += 1;

  return () => {
    suppressPopoverRemovalUntil = 0;
    activeStabilizerCount -= 1;
    if (activeStabilizerCount <= 0 && globalKeydownListenerInstalled) {
      // 没有活跃稳定器时才能移除全局监听器。
      document.removeEventListener("keydown", onGlobalKeydown, true);
      globalKeydownListenerInstalled = false;
      activeStabilizerCount = 0;
    }
  };
}
