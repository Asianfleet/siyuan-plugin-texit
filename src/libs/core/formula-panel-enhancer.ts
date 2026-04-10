/**
 * 公式面板增强逻辑：协调 MathLive 初始化、事件、菜单和虚拟键盘行为。
 * 该模块仅负责公式面板内部的 Mathfield 与 SiYuan 通信，供主控逻辑复用。
 */
import {
  configureMathLiveLocale,
  getMathLiveMenuLabel,
} from "./formula-panel-tools/mathlive-i18n";
import {
  placeCaretIntoRootMatrixIfNeeded,
  resolveMatrixEnvironmentName,
  type InternalMathfieldInstance,
} from "./formula-panel-tools/mathlive-matrix-environment";
import {
  DEFAULT_FORMULA_PANEL_SETTINGS,
  type FormulaPanelSettings,
} from "./formula-panel-settings";
import {
  resolvePanelNodes,
} from "./formula-panel-tools/formula-panel-dom";
import {
  queueMatrixEnvironmentSync,
  syncCommandDrivenMathfieldMutation,
  syncMathfieldToTextarea,
  syncTextareaToMathfield,
} from "./formula-panel-tools/formula-panel-sync";
import { loadMathLive } from "./formula-panel-tools/mathlive-loader";
import {
  installMathLiveSuggestionPopoverStabilizer,
} from "./formula-panel-tools/mathlive-suggestion-popover-stabilizer";
import {
  clearMathfieldColorStyle,
  installClearColorStyleMenuItem,
  installMathfieldCommandSync,
} from "./formula-panel-tools/mathlive-menu-patch";
import {
  configureVirtualKeyboardPlacement,
  hideCustomVirtualKeyboardIfNeeded,
} from "./formula-panel-tools/mathlive-virtual-keyboard";
import {
  FormulaPanelSession,
  type FormulaPanelMathfieldInstance,
} from "./formula-panel-tools/formula-panel-session";

/** 允许触发 MathLive 加载的函数类型。 */
type LoadMathLive = typeof loadMathLive;
/** 需要展示公式面板的数学块类型集合。 */
const MATH_BLOCK_TYPES = new Set([
  "NodeMathBlock",
  "inline-math",
  "inline-math text",
  "code inline-math",
  "mark inline-math",
  "kbd inline-math",
  "code tag inline-math",
  "a inline-math",
  "block-ref inline-math",
]);
/** “清除颜色样式”菜单项的固定标识。 */
const CLEAR_COLOR_STYLE_MENU_ITEM_ID = "menu.clear-color-style";

/** 公式面板增强器的可选配置项（移动端、定制加载器与设置）。 */
interface FormulaPanelEnhancerOptions {
  isMobile?: boolean;
  loadMathLive?: LoadMathLive;
  settings?: FormulaPanelSettings;
}

/** 表示 SiYuan 触发的非可编辑块打开事件及其可选上下文。 */
type OpenNonEditableBlockEvent = {
  /** 该事件可能携带的 DOM 与渲染节点信息，方便获取 toolbar 与 data-type。 */
  detail?: {
    renderElement?: {
      attributes?: {
        "data-type"?: {
          nodeValue?: string;
        };
      };
    };
    protyle?: {
      toolbar?: {
        subElement?: HTMLElement;
      };
    };
  };
};

/** 控制 Mathfield 与面板交互的核心增强实例，负责生命周期与同步。 */
export class FormulaPanelEnhancer {
  private static readonly revealDurationMs = 220;
  private readonly isMobile: boolean;
  private readonly loadMathLive: LoadMathLive;
  private readonly session: FormulaPanelSession;
  private settings: FormulaPanelSettings;

  /** 监听 Mathfield 输入事件，将值同步回 textarea。 */
  private readonly onMathfieldInput = () => {
    syncMathfieldToTextarea(this.session.getSyncContext());
  };

  /** 捕获 MathLive 菜单事件，并根据环境同步矩阵内容。 */
  private readonly onMathfieldMenuSelect = (event: Event) => {
    const previousValue = this.session.mathfield?.value;
    const menuId = (event as CustomEvent<{ id?: string }>).detail?.id;
    const environmentName = resolveMatrixEnvironmentName(menuId);
    if (!environmentName) {
      // 菜单与矩阵环境无关则无需触发同步。
      return;
    }

    // 将之前的矩阵值排队到 Mathfield 同步队列，确保命令与 textarea 保持一致。
    queueMatrixEnvironmentSync(
      this.session.getSyncContext(),
      environmentName,
      previousValue,
    );
  };

  /** 同步 textarea 内容到 Mathfield，用于双向输入流。 */
  private readonly onTextareaInput = () => {
    syncTextareaToMathfield(this.session.getSyncContext());
  };

  /** Mathfield 指针按下时确保输入框获取焦点，提升交互体验。 */
  private readonly onMathfieldPointerDown = () => {
    this.session.mathfield?.focus();
  };

  /** MathLive 挂载后重新应用设置并修补菜单项。 */
  private readonly onMathfieldMount = () => {
    this.applySettings(this.settings);
    this.installMathfieldMenuPatch();
  };

  /** Mathfield 卸载时清理虚拟键盘绑定，避免残留 UI。 */
  private readonly onMathfieldUnmount = () => {
    if (window.mathVirtualKeyboard) {
      window.mathVirtualKeyboard.container = null;
    }
    hideCustomVirtualKeyboardIfNeeded(this.session.virtualKeyboardController);
  };

  /** 协调 Mathfield 菜单“清除颜色”功能的回调。 */
  private readonly onClearColorStyle = () => {
    clearMathfieldColorStyle(this.session.mathfield);
  };

  /** 根据传入选项创建会话并配置默认设置与事件。 */
  constructor(options: FormulaPanelEnhancerOptions = {}) {
    this.isMobile = options.isMobile ?? false;
    this.loadMathLive = options.loadMathLive ?? loadMathLive;
    this.settings = options.settings ?? DEFAULT_FORMULA_PANEL_SETTINGS;
    this.session = new FormulaPanelSession({
      isMobile: this.isMobile,
      onTextareaInput: this.onTextareaInput,
    });
  }

  /** 将新的展示设置应用到宿主节点和虚拟键盘布局上。 */
  applySettings(nextSettings: FormulaPanelSettings): void {
    this.settings = nextSettings;
    this.session.applyTextareaSettings(nextSettings);
    const { host, textarea, mathfield, virtualKeyboardController } = this.session;
    if (!host) {
      return;
    }

    host.style.setProperty(
      "--fe-math-font-size",
      `${nextSettings.editorFontSize}px`,
    );
    host.style.setProperty(
      "--fe-math-padding-block",
      `${nextSettings.editorPaddingBlock}px`,
    );
    host.style.setProperty(
      "--fe-math-padding-inline",
      `${nextSettings.editorPaddingInline}px`,
    );
    host.dataset.feVkToggle = nextSettings.showVirtualKeyboardToggle
      ? "show"
      : "hide";
    host.dataset.feMenuToggle = nextSettings.showMenuToggle
      ? "show"
      : "hide";
    host.dataset.feTextareaMode = nextSettings.editorTextareaDisplayMode;
    host.dataset.feVirtualKeyboardPlacement =
      nextSettings.virtualKeyboardPlacement;
    configureVirtualKeyboardPlacement(virtualKeyboardController, {
      host,
      textarea,
      mathfield,
      placement: nextSettings.virtualKeyboardPlacement,
      useManualPolicy: nextSettings.useManualVirtualKeyboardPolicy,
    });
  }

  /** 根据 autoFocus 配置决定是否聚焦 Mathfield。 */
  private focusMathfieldIfNeeded(): void {
    if (this.settings.autoFocus !== "mathlive") {
      return;
    }

    this.session.mathfield?.focus();
  }

  /** 确保 Mathfield 创建、事件绑定并挂载到宿主容器。 */
  private ensureMathfield(host: HTMLDivElement): void {
    if (!this.session.mathfield) {
      configureMathLiveLocale();
      const mathfield = new MathfieldElement() as FormulaPanelMathfieldInstance;
      mathfield.addEventListener("input", this.onMathfieldInput);
      mathfield.addEventListener("menu-select", this.onMathfieldMenuSelect);
      mathfield.addEventListener("pointerdown", this.onMathfieldPointerDown);
      mathfield.addEventListener("mount", this.onMathfieldMount);
      mathfield.addEventListener("unmount", this.onMathfieldUnmount);
      this.session.mathfield = mathfield;
      this.session.cleanupSuggestionPopoverStabilizer =
        installMathLiveSuggestionPopoverStabilizer(mathfield);

      if (window.MathfieldElement) {
        window.MathfieldElement.soundsDirectory = null;
        window.MathfieldElement.keypressVibration = false;
      }
    }

    installMathfieldCommandSync(this.session.mathfield, (previousValue) => {
      syncCommandDrivenMathfieldMutation(
        this.session.getSyncContext(),
        previousValue,
      );
    });

    if (this.session.mathfield?.parentElement !== host) {
      host.appendChild(this.session.mathfield);
    }

    this.installMathfieldMenuPatch();
  }

  /** 为 Mathfield 注入自定义菜单项并监听矩阵事件。 */
  private installMathfieldMenuPatch(): void {
    if (!this.session.mathfield) {
      return;
    }

    installClearColorStyleMenuItem(
      this.session.mathfield as unknown as Parameters<
        typeof installClearColorStyleMenuItem
      >[0],
      {
      getLabel: () => getMathLiveMenuLabel(CLEAR_COLOR_STYLE_MENU_ITEM_ID),
      onClearColorStyle: this.onClearColorStyle,
      resolveMatrixEnvironmentName,
      onMatrixEnvironmentSelected: (environmentName, previousValue) => {
        // 菜单中选中矩阵后同步 Mathfield。
        queueMatrixEnvironmentSync(
          this.session.getSyncContext(),
          environmentName,
          previousValue,
        );
      },
      },
    );
  }

  /** 初始化 MathLive，绑定 textarea 并应用当前设置。 */
  async init(panelElement: HTMLElement): Promise<void> {
    const { header, textarea } = resolvePanelNodes(panelElement);
    if (!header || !textarea) {
      return;
    }
    this.session.attachTextarea(textarea);
    this.session.applyTextareaSettings(this.settings);

    // 确保 MathLive 脚本完成加载，后续才能创建 Mathfield。
    await this.loadMathLive();
    const host = this.session.ensureHost();
    if (!host) {
      return;
    }
    this.ensureMathfield(host);
    this.applySettings(this.settings);
    this.session.initialized = true;
  }

  /** 响应非编辑块打开事件，判断是否展示 Mathfield。 */
  async handleOpen(event: OpenNonEditableBlockEvent): Promise<void> {
    const panelElement = event.detail?.protyle?.toolbar?.subElement;
    if (panelElement instanceof HTMLElement) {
      await this.init(panelElement);
    }

    const { host, textarea, mathfield } = this.session;
    if (!host || !textarea || !mathfield) {
      return;
    }

    const blockType = event.detail?.renderElement?.attributes?.["data-type"]?.nodeValue;
    if (blockType && MATH_BLOCK_TYPES.has(blockType)) {
      // 对于数学块类型需要同步值并展示 Mathfield 面板。
      this.session.syncMathfieldValueFromTextarea();
      placeCaretIntoRootMatrixIfNeeded(
        mathfield as InternalMathfieldInstance | null,
      );
      this.session.showHost();
      this.focusMathfieldIfNeeded();
      this.session.revealHostOnce(FormulaPanelEnhancer.revealDurationMs);
      return;
    }

    this.session.hideHost();
    hideCustomVirtualKeyboardIfNeeded(this.session.virtualKeyboardController);
  }

  /** 解绑事件并销毁会话，防止资源泄漏。 */
  destroy(): void {
    if (this.session.mathfield) {
      this.session.mathfield.removeEventListener("input", this.onMathfieldInput);
      this.session.mathfield.removeEventListener("menu-select", this.onMathfieldMenuSelect);
      this.session.mathfield.removeEventListener("pointerdown", this.onMathfieldPointerDown);
      this.session.mathfield.removeEventListener("mount", this.onMathfieldMount);
      this.session.mathfield.removeEventListener("unmount", this.onMathfieldUnmount);
    }
    this.session.destroy();
  }
}
