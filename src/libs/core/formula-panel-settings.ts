/**
 * 负责公式面板设置的存储路径、默认值与归一化逻辑。
 */

/**
 * 公式面板的聚焦目标，决定启动时是 MathLive 编辑器还是原生输入框。
 */
export type FormulaPanelAutoFocus = "mathlive" | "native";

/**
 * 虚拟键盘在界面中的摆放位置。
 */
export type FormulaPanelVirtualKeyboardPlacement =
  | "bottom"
  | "top"
  | "bottom-of-editor";

/**
 * 编辑区域 textarea 的显示策略。
 */
export type FormulaPanelTextareaDisplayMode = "both" | "editor-only";

/**
 * 公式面板设置的完整形态。
 */
export type FormulaPanelSettings = {
  autoFocus: FormulaPanelAutoFocus;
  editorFontSize: number;
  editorPaddingBlock: number;
  editorPaddingInline: number;
  showVirtualKeyboardToggle: boolean;
  useManualVirtualKeyboardPolicy: boolean;
  virtualKeyboardPlacement: FormulaPanelVirtualKeyboardPlacement;
  showMenuToggle: boolean;
  editorTextareaDisplayMode: FormulaPanelTextareaDisplayMode;
};

/**
 * 公式面板设置在 SiYuan 存储中的完整路径。
 */
export const FORMULA_PANEL_SETTINGS_STORAGE_PATH =
  "/data/storage/petal/siyuan-plugin-texit/formula-panel-settings.json";

/**
 * 公式面板设置文件名。
 */
export const FORMULA_PANEL_SETTINGS_STORAGE_FILE = "formula-panel-settings.json";

/**
 * 插件默认使用的公式面板配置。
 */
export const DEFAULT_FORMULA_PANEL_SETTINGS: FormulaPanelSettings = {
  autoFocus: "mathlive",
  editorFontSize: 18,
  editorPaddingBlock: 8,
  editorPaddingInline: 8,
  showVirtualKeyboardToggle: false,
  useManualVirtualKeyboardPolicy: true,
  virtualKeyboardPlacement: "bottom",
  showMenuToggle: true,
  editorTextareaDisplayMode: "both",
};

/**
 * 将部分设置归一化为完整且合法的 `FormulaPanelSettings`，同时应用默认值和边界值剪裁。
 */
export function normalizeFormulaPanelSettings(
  input: Partial<FormulaPanelSettings> | null | undefined,
): FormulaPanelSettings {
  const raw = input ?? {};
  // 仅允许 native 作为非默认聚焦，其它一律回退到 mathlive
  const autoFocus = raw.autoFocus === "native" ? "native" : "mathlive";
  // 只保留指定的摆放方向，非法值强制为底部
  const virtualKeyboardPlacement =
    raw.virtualKeyboardPlacement === "top" ||
    raw.virtualKeyboardPlacement === "bottom-of-editor"
      ? raw.virtualKeyboardPlacement
      : "bottom";
  // 编辑 textarea 显示模式只有 editor-only 和 both，其他统一为 both
  const editorTextareaDisplayMode =
    raw.editorTextareaDisplayMode === "editor-only" ? "editor-only" : "both";

  return {
    autoFocus,
    // 字体尺寸、内边距等在 clampNumber 中做边界限制
    editorFontSize: clampNumber(raw.editorFontSize, 12, 32, 18),
    editorPaddingBlock: clampNumber(raw.editorPaddingBlock, 0, 24, 8),
    editorPaddingInline: clampNumber(raw.editorPaddingInline, 0, 32, 8),
    showVirtualKeyboardToggle: raw.showVirtualKeyboardToggle === true,
    useManualVirtualKeyboardPolicy: raw.useManualVirtualKeyboardPolicy !== false,
    virtualKeyboardPlacement,
    showMenuToggle: raw.showMenuToggle !== false,
    editorTextareaDisplayMode,
  };
}

/**
 * 将值限制在指定区间，非法输入时使用回退值。
 */
function clampNumber(
  value: unknown,
  min: number,
  max: number,
  fallback: number,
): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, value));
}
