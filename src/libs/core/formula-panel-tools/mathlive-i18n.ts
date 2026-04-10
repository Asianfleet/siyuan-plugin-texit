/**
 * 为 MathLive 虚拟键盘与菜单补丁提供中文本地化数据与运行时配置。
 */
import { shouldUseChineseForMathLive } from "@/libs/utils/plugin";

const MATHLIVE_ZH_CN_KEYCAP_ASIDES: Record<string, string> = {
  "centered dot": "居中点",
  "complement": "补集",
};

/** MathLive 中文菜单提示的覆盖词典。 */
export const MATHLIVE_ZH_CN_MENU_STRINGS: Record<string, string> = {
  "keyboard.tooltip.symbols": "符号",
  "keyboard.tooltip.greek": "希腊字母",
  "keyboard.tooltip.numeric": "数字",
  "keyboard.tooltip.alphabetic": "罗马字母",
  "tooltip.toggle virtual keyboard": "切换虚拟键盘",
  "tooltip.paste from clipboard": "从剪贴板粘贴",
  "tooltip.menu": "菜单",
  "menu.copy": "复制",
  "menu.cut": "剪切",
  "menu.paste": "粘贴",
  "menu.select-all": "全选",
  "menu.copy-as-latex": "复制为 LaTeX",
  "menu.copy-as-typst": "复制为 Typst",
  "menu.copy-as-ascii-math": "复制为 ASCII Math",
  "menu.copy-as-mathml": "复制为 MathML",
  "menu.mode": "模式",
  "menu.mode-math": "数学",
  "menu.mode-text": "文本",
  "menu.mode-latex": "LaTeX",
  "menu.insert": "插入",
  "menu.insert matrix": "插入矩阵",
  "menu.borders": "边框",
  "menu.array.add row above": "上方插入行",
  "menu.array.add row below": "下方插入行",
  "menu.array.add column before": "前方插入列",
  "menu.array.add column after": "后方插入列",
  "menu.array.delete row": "删除行",
  "menu.array.delete rows": "删除所选行",
  "menu.array.delete column": "删除列",
  "menu.array.delete columns": "删除所选列",
  "menu.insert.abs": "绝对值",
  "menu.insert.nth-root": "n 次方根",
  "menu.insert.log-base": "以 a 为底的对数",
  "menu.insert.heading-calculus": "微积分",
  "menu.insert.derivative": "导数",
  "menu.insert.nth-derivative": "n 阶导数",
  "menu.insert.integral": "积分",
  "menu.insert.sum": "求和",
  "menu.insert.product": "求积",
  "menu.insert.heading-complex-numbers": "复数",
  "menu.insert.modulus": "模",
  "menu.insert.argument": "辐角",
  "menu.insert.real-part": "实部",
  "menu.insert.imaginary-part": "虚部",
  "menu.insert.conjugate": "共轭",
  "menu.font-style": "字体样式",
  "tooltip.blackboard": "黑板体",
  "tooltip.bold": "粗体",
  "tooltip.italic": "斜体",
  "tooltip.fraktur": "哥特体",
  "tooltip.script": "手写体",
  "tooltip.caligraphic": "书法体",
  "tooltip.typewriter": "打字机体",
  "tooltip.roman-upright": "正体罗马字",
  "tooltip.row-by-col": "%@ × %@",
  "menu.accent": "重音符号",
  "menu.decoration": "修饰",
  "menu.color": "颜色",
  "menu.background-color": "背景色",
  "menu.clear-color-style": "清除颜色格式",
  "menu.evaluate": "求值",
  "menu.simplify": "化简",
  "menu.solve": "求解",
  "menu.solve-for": "求解 %@",
  "color.red": "红色",
  "color.orange": "橙色",
  "color.yellow": "黄色",
  "color.lime": "黄绿色",
  "color.green": "绿色",
  "color.teal": "蓝绿色",
  "color.cyan": "青色",
  "color.blue": "蓝色",
  "color.indigo": "靛蓝",
  "color.purple": "紫色",
  "color.magenta": "洋红",
  "color.black": "黑色",
  "color.dark-grey": "深灰",
  "color.grey": "灰色",
  "color.light-grey": "浅灰",
  "color.white": "白色",
};

/** MathLive 英文菜单中需额外补充的提示文本。 */
const MATHLIVE_EN_MENU_STRINGS: Record<string, string> = {
  "menu.clear-color-style": "Clear color formatting",
};

/** 翻译虚拟键盘的 keycap 附注，其他结构维持原样以防破坏 MathLive 行为。 */
function localizeMathLiveKeyboardLayouts(
  layouts: Window["mathVirtualKeyboard"]["normalizedLayouts"],
): Window["mathVirtualKeyboard"]["normalizedLayouts"] {
  if (!layouts) {
    return layouts;
  }

  return layouts.map((layout) => ({
    ...layout,
    layers: layout.layers?.map((layer) => ({
      ...layer,
      rows: layer.rows?.map((row) =>
        row.map((keycap) => {
          if (
            !keycap ||
            typeof keycap !== "object" ||
            !("aside" in keycap) ||
            typeof keycap.aside !== "string"
          ) {
            return keycap;
          }

          const localizedAside = MATHLIVE_ZH_CN_KEYCAP_ASIDES[keycap.aside];
          if (!localizedAside) {
            return keycap;
          }

          return {
            ...keycap,
            aside: localizedAside,
          };
        }),
      ),
    })),
  }));
}

/** 将 MathLive 虚拟键盘的布局替换为已经翻译过的中文版本。 */
function configureMathLiveVirtualKeyboard(): void {
  const keyboard = window.mathVirtualKeyboard;
  const normalizedLayouts = keyboard?.normalizedLayouts;

  if (!keyboard || !normalizedLayouts || normalizedLayouts.length === 0) {
    return;
  }

  keyboard.layouts = localizeMathLiveKeyboardLayouts(normalizedLayouts);
}

/** 根据插件语言设置迁移 MathLive 菜单文本并激活 zh-CN locale。 */
export function configureMathLiveLocale(): void {
  if (!window.MathfieldElement || !shouldUseChineseForMathLive()) {
    return;
  }

  const existingStrings = window.MathfieldElement.strings ?? {};
  const existingZhCnStrings = existingStrings["zh-CN"] ?? {};

  window.MathfieldElement.strings = {
    ...existingStrings,
    "zh-CN": {
      ...existingZhCnStrings,
      ...MATHLIVE_ZH_CN_MENU_STRINGS,
    },
  };
  // 重新配置虚拟键盘以应用中文附注，同时将 locale 标记为 zh-CN 保持一致
  configureMathLiveVirtualKeyboard();
  window.MathfieldElement.locale = "zh-CN";
}

/** 根据 MathfieldElement 的 locale 返回对应语言的菜单标签文本。 */
export function getMathLiveMenuLabel(key: string): string {
  const locale = window.MathfieldElement?.locale;

  if (locale === "zh-CN") {
    return MATHLIVE_ZH_CN_MENU_STRINGS[key] ?? key;
  }

  return MATHLIVE_EN_MENU_STRINGS[key] ?? key;
}
