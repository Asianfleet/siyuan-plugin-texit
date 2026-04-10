/**
 * 围绕 MathLive 菜单插入清除颜色与矩阵记录所需的补丁逻辑。
 */
const CLEAR_COLOR_STYLE_MENU_ITEM_ID = "menu.clear-color-style";
const BACKGROUND_COLOR_MENU_ITEM_ID = "background-color";

/** Mathfield 命令链中用于执行操作的通用函数签名。 */
type MathfieldCommandMethod = (...args: unknown[]) => unknown;

/** 需要在命令执行前后同步状态的 Mathfield 实例。 */
type CommandSyncMathfield = {
  value: string;
  executeCommand: MathfieldCommandMethod;
  applyStyle: MathfieldCommandMethod;
  __formulaEnhanceCommandSyncInstalled__?: boolean;
};

/** MathLive 菜单项的基本定义，可包含子菜单。 */
type MathfieldMenuItem = {
  id?: string;
  type?: "command" | "submenu";
  label?: string | (() => string);
  visible?: boolean | (() => boolean);
  onMenuSelect?: () => void;
  submenu?: MathfieldMenuItem[];
};

/** 含附加标记的菜单项以避免重复包装。 */
type FormulaEnhanceMathfieldMenuItem = MathfieldMenuItem & {
  __formulaEnhanceWrapped__?: boolean;
  submenu?: FormulaEnhanceMathfieldMenuItem[];
};

/** 控制菜单结构的 Mathfield 上下文字段集合。 */
type MenuPatchMathfield = {
  value: string;
  menuItems?: FormulaEnhanceMathfieldMenuItem[];
  isSelectionEditable?: boolean;
};

/** 可以执行 `applyStyle` 清除颜色的 Mathfield 目标。 */
type ClearColorStyleTarget = {
  executeCommand?: MathfieldCommandMethod;
} | null | undefined;

/** 插入清除颜色菜单项时所需的回调与解析器。 */
type InstallClearColorStyleMenuItemOptions = {
  getLabel: () => string;
  onClearColorStyle: () => void;
  resolveMatrixEnvironmentName: (menuId?: string) => string | undefined;
  onMatrixEnvironmentSelected: (
    environmentName: string,
    previousValue?: string,
  ) => void;
};

/** 用于在 Mathfield 中撤销颜色与背景样式的命令桥接。 */
export function clearMathfieldColorStyle(
  mathfield: ClearColorStyleTarget,
): void {
  // 通过 MathLive 提供的 applyStyle 命令设置颜色为 none。
  mathfield?.executeCommand?.([
    "applyStyle",
    {
      color: "none",
      backgroundColor: "none",
    },
  ]);
}

/** 拦截 Mathfield 命令与样式调用以便在数据变更后同步外部状态。 */
export function installMathfieldCommandSync(
  mathfield: CommandSyncMathfield | null,
  onMutation: (previousValue: string) => void,
): void {
  if (!mathfield || mathfield.__formulaEnhanceCommandSyncInstalled__) {
    return;
  }

  // 劫持命令接口以便在命令执行后通知调用方当前值。
  const originalExecuteCommand = mathfield.executeCommand.bind(mathfield);
  mathfield.executeCommand = ((...args: Parameters<typeof originalExecuteCommand>) => {
    const previousValue = mathfield.value;
    const result = originalExecuteCommand(...args);
    onMutation(previousValue);
    return result;
  }) as typeof mathfield.executeCommand;

  // applyStyle 也应触发同步流程，因此同样包装。
  const originalApplyStyle = mathfield.applyStyle.bind(mathfield);
  mathfield.applyStyle = ((...args: Parameters<typeof originalApplyStyle>) => {
    const previousValue = mathfield.value;
    const result = originalApplyStyle(...args);
    onMutation(previousValue);
    return result;
  }) as typeof mathfield.applyStyle;

  mathfield.__formulaEnhanceCommandSyncInstalled__ = true;
}

/** 递归包装菜单项，允许矩阵项记录上下文并避免重复包装。 */
function wrapMenuItem(
  mathfield: MenuPatchMathfield,
  item: FormulaEnhanceMathfieldMenuItem,
  {
    resolveMatrixEnvironmentName,
    onMatrixEnvironmentSelected,
  }: Pick<
    InstallClearColorStyleMenuItemOptions,
    "resolveMatrixEnvironmentName" | "onMatrixEnvironmentSelected"
  >,
): FormulaEnhanceMathfieldMenuItem {
  if (item.__formulaEnhanceWrapped__) {
    return item;
  }

  const wrappedItem: FormulaEnhanceMathfieldMenuItem = {
    ...item,
    __formulaEnhanceWrapped__: true,
  };
  if (item.submenu) {
    wrappedItem.submenu = item.submenu.map((submenuItem) =>
      wrapMenuItem(mathfield, submenuItem, {
        resolveMatrixEnvironmentName,
        onMatrixEnvironmentSelected,
      }),
    );
  }

  const environmentName = resolveMatrixEnvironmentName(item.id);
  if (!environmentName) {
    return wrappedItem;
  }

  const originalOnMenuSelect = item.onMenuSelect;
  wrappedItem.onMenuSelect = () => {
    const previousValue = mathfield.value;
    // 先执行原始命令，再通知插件方当前环境与上一次内容。
    originalOnMenuSelect?.();
    onMatrixEnvironmentSelected(environmentName, previousValue);
  };

  return wrappedItem;
}

/** 将清除颜色命令插入 Mathfield 菜单，并包装矩阵项以同步环境信息。 */
export function installClearColorStyleMenuItem(
  mathfield: MenuPatchMathfield | null,
  {
    getLabel,
    onClearColorStyle,
    resolveMatrixEnvironmentName,
    onMatrixEnvironmentSelected,
  }: InstallClearColorStyleMenuItemOptions,
): void {
  if (!mathfield?.menuItems) {
    return;
  }

  const clearColorStyleMenuItem: MathfieldMenuItem = {
    id: CLEAR_COLOR_STYLE_MENU_ITEM_ID,
    type: "command",
    label: getLabel,
    visible: () => mathfield.isSelectionEditable ?? false,
    onMenuSelect: onClearColorStyle,
  };
  const menuItems = mathfield.menuItems
    .map((item) =>
      wrapMenuItem(mathfield, item, {
        resolveMatrixEnvironmentName,
        onMatrixEnvironmentSelected,
      }),
    )
    // 移除旧的清除颜色项，避免重复插入。
    .filter((item) => item.id !== CLEAR_COLOR_STYLE_MENU_ITEM_ID);
  const backgroundColorIndex = menuItems.findIndex(
    (item) => item.id === BACKGROUND_COLOR_MENU_ITEM_ID,
  );

  if (backgroundColorIndex >= 0) {
    // 背景色项后插入清除颜色命令，保持菜单语义链。
    menuItems.splice(backgroundColorIndex + 1, 0, clearColorStyleMenuItem);
  } else {
    menuItems.push(clearColorStyleMenuItem);
  }

  mathfield.menuItems = menuItems;
}
