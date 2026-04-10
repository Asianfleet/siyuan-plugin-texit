/**
 * 管理 MathLive 自定义虚拟键盘容器的创建、位置切换和高度同步，避免直接使用默认键盘。
 */
import type { FormulaPanelSettings } from "../formula-panel-settings";

type VirtualKeyboardPlacement = FormulaPanelSettings["virtualKeyboardPlacement"];
type VirtualKeyboardMathfield = {
  mathVirtualKeyboardPolicy?: "auto" | "manual" | "sandboxed";
} | null;

/**
 * 记录虚拟键盘的活跃位置和各容器 DOM，用于在不同 placement 间切换。
 */
export type MathliveVirtualKeyboardController = {
  activePlacement: VirtualKeyboardPlacement | null;
  topContainer: HTMLDivElement | null;
  bottomDockedContainer: HTMLDivElement | null;
  bottomOfEditorContainer: HTMLDivElement | null;
  onGeometryChange: () => void;
};

type ConfigureVirtualKeyboardPlacementOptions = {
  host: HTMLDivElement | null;
  textarea: HTMLTextAreaElement | null;
  mathfield: VirtualKeyboardMathfield;
  placement: VirtualKeyboardPlacement;
  useManualPolicy: boolean;
};

/**
 * 创建控制器并绑定几何变化回调，以便键盘高度变化时同步容器高度。
 */
export function createMathliveVirtualKeyboardController(): MathliveVirtualKeyboardController {
  const controller = {
    activePlacement: null,
    topContainer: null,
    bottomDockedContainer: null,
    bottomOfEditorContainer: null,
    onGeometryChange: () => {
      syncVirtualKeyboardContainerHeight(controller);
    },
  } satisfies MathliveVirtualKeyboardController;

  return controller;
}

/**
 * 根据传入 placement 选择容器，将 MathLive 对象绑定进去，并同步虚拟键盘策略。
 */
export function configureVirtualKeyboardPlacement(
  controller: MathliveVirtualKeyboardController,
  {
    host,
    textarea,
    mathfield,
    placement,
    useManualPolicy,
  }: ConfigureVirtualKeyboardPlacementOptions,
): void {
  controller.activePlacement = placement;
  if (!mathfield) {
    return;
  }

  const keyboard = window.mathVirtualKeyboard;

  // 保证 host 所在层级挂载对应容器，再根据 placement 定位
  ensureVirtualKeyboardContainers(controller, host, textarea);
  hideAllCustomVirtualKeyboardContainers(controller);

  if (!keyboard) {
    return;
  }

  // 先清除旧 listener，避免多次注册导致同步冲突
  keyboard.removeEventListener?.("geometrychange", controller.onGeometryChange);

  const activeContainer = getActiveVirtualKeyboardContainer(controller);
  if (!activeContainer) {
    return;
  }

  activeContainer.classList.remove("fn__none");
  keyboard.container = activeContainer;
  keyboard.addEventListener?.("geometrychange", controller.onGeometryChange);
  mathfield.mathVirtualKeyboardPolicy = useManualPolicy ? "manual" : "auto";
  syncVirtualKeyboardContainerHeight(controller);
}

/**
 * 在 MathLive 已初始化时隐藏自定义键盘并清空可见状态，防止误触。
 */
export function hideCustomVirtualKeyboardIfNeeded(
  controller: MathliveVirtualKeyboardController,
): void {
  const keyboard = window.mathVirtualKeyboard;
  if (keyboard && getActiveVirtualKeyboardContainer(controller)) {
    // 如果 MathLive 已经初始化则直接藏起并清除可见标记
    keyboard.hide?.();
    keyboard.visible = false;
  }

  hideAllCustomVirtualKeyboardContainers(controller);
}

/**
 * 解除事件、重置 MathLive 容器，并移除所有虚拟键盘 DOM。
 */
export function destroyMathliveVirtualKeyboardController(
  controller: MathliveVirtualKeyboardController,
): void {
  window.mathVirtualKeyboard?.removeEventListener?.(
    "geometrychange",
    controller.onGeometryChange,
  );
  if (window.mathVirtualKeyboard) {
    window.mathVirtualKeyboard.container = null;
  }
  hideCustomVirtualKeyboardIfNeeded(controller);
  controller.topContainer?.remove();
  controller.bottomDockedContainer?.remove();
  controller.bottomOfEditorContainer?.remove();
  controller.topContainer = null;
  controller.bottomDockedContainer = null;
  controller.bottomOfEditorContainer = null;
  controller.activePlacement = null;
}

function getVirtualKeyboardContainerClassName(
  placement: VirtualKeyboardPlacement,
): string {
  return [
    "formula-enhance__virtual-keyboard-container",
    `formula-enhance__virtual-keyboard-container--${placement}`,
    "fn__none",
  ].join(" ");
}

function ensurePanelVirtualKeyboardContainer(
  current: HTMLDivElement | null,
  placement: Extract<VirtualKeyboardPlacement, "top" | "bottom-of-editor">,
  parent: HTMLElement,
  referenceNode: ChildNode | null,
): HTMLDivElement {
  const container = current ?? document.createElement("div");
  container.className = getVirtualKeyboardContainerClassName(placement);

  if (referenceNode) {
    if (
      container.parentElement !== parent ||
      referenceNode.previousSibling !== container
    ) {
      // 保证容器插入在参考节点前，维护 host 之前或之后的顺序
      parent.insertBefore(container, referenceNode);
    }
    return container;
  }

  if (container.parentElement !== parent || parent.lastChild !== container) {
    // 若未正确附着则追加到父元素末尾
    parent.appendChild(container);
  }

  return container;
}

function ensureBodyVirtualKeyboardContainer(
  current: HTMLDivElement | null,
): HTMLDivElement {
  const container = current ?? document.createElement("div");
  container.className = getVirtualKeyboardContainerClassName("bottom");

  if (container.parentElement !== document.body) {
    // body 只保留一个底部停靠容器
    document.body.appendChild(container);
  }

  return container;
}

function ensureVirtualKeyboardContainers(
  controller: MathliveVirtualKeyboardController,
  host: HTMLDivElement | null,
  textarea: HTMLTextAreaElement | null,
): void {
  if (!textarea?.parentElement || !host) {
    return;
  }

  const parent = textarea.parentElement;
  controller.topContainer = ensurePanelVirtualKeyboardContainer(
    controller.topContainer,
    "top",
    parent,
    host,
  );
  controller.bottomOfEditorContainer = ensurePanelVirtualKeyboardContainer(
    controller.bottomOfEditorContainer,
    "bottom-of-editor",
    parent,
    host.nextSibling,
  );
  controller.bottomDockedContainer = ensureBodyVirtualKeyboardContainer(
    controller.bottomDockedContainer,
  );
}

function getActiveVirtualKeyboardContainer(
  controller: MathliveVirtualKeyboardController,
): HTMLDivElement | null {
  switch (controller.activePlacement) {
    case "bottom":
      return controller.bottomDockedContainer;
    case "top":
      return controller.topContainer;
    case "bottom-of-editor":
      return controller.bottomOfEditorContainer;
    default:
      return null;
  }
}

function syncVirtualKeyboardContainerHeight(
  controller: MathliveVirtualKeyboardController,
): void {
  const activeContainer = getActiveVirtualKeyboardContainer(controller);
  if (!activeContainer || !window.mathVirtualKeyboard?.boundingRect) {
    return;
  }

  activeContainer.style.height = `${window.mathVirtualKeyboard.boundingRect.height}px`;
}

function hideAllCustomVirtualKeyboardContainers(
  controller: MathliveVirtualKeyboardController,
): void {
  for (const container of [
    controller.topContainer,
    controller.bottomDockedContainer,
    controller.bottomOfEditorContainer,
  ]) {
    if (!container) {
      continue;
    }
    // 将所有容器重置为隐藏状态，防止多个 placement 同时可见
    container.classList.add("fn__none");
    container.style.height = "0px";
  }
}
