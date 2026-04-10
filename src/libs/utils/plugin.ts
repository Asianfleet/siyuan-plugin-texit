import { getFrontend } from "siyuan";
import { App, computed } from "vue";

export interface I18N {
  [key: string]: any;
}

/* 
 * 存储 FormulaEnhance 插件实例
 */
let formulaEnhance: FormulaEnhance = null
let formulaEnhanceApp: App = null

export function usePlugin(pluginInstance?: FormulaEnhance): FormulaEnhance {
  /**
   * 使用插件函数，根据提供的插件属性初始化或返回已存在的插件实例。
   * 如果没有提供插件属性且当前没有插件实例，则会输出错误信息。
   *
   * @param {FormulaEnhance} [pluginProps] - 可选参数，用于初始化插件的属性对象。
   * @returns {FormulaEnhance} 返回一个 FormulaEnhance 类型的插件实例。
   */
  if (pluginInstance) {
    formulaEnhance = pluginInstance;
  }
  if (!formulaEnhance && !pluginInstance) {
    console.error("need bind plugin");
  }
  return formulaEnhance;
}

export function useFormulaEnhanceApp(app?: App) {
  if (app) {
    formulaEnhanceApp = app;
  }
  return formulaEnhanceApp;
}

export function useI18NJSON(): I18N {
  if (formulaEnhance) {
    return formulaEnhance.i18n
  }
}

export function useI18N(zh: string, en: string) {
  return computed(() => {
    return window.siyuan.config.lang === "zh_CN" ? zh : en;
  });
}

export function getElectronAvailability() {
  return getFrontend() === "desktop" || getFrontend() === "desktop-window";
}

export function getFormulaEnhanceMode() {
  if (window.location.search === "") {
    return "independent";
  } else {
    return "side";
  }
}

export function getUserLanguage() {
  return window.siyuan.config.lang === "zh_CN" ? "中文" : "English";
}

export function shouldUseChineseForMathLive() {
  return getUserLanguage() === "中文";
}

export function openFormulaEnhanceSidebar() {
  const formulaEnhanceButton:HTMLElement = document.querySelector(
    "span[data-title='formulaEnhance-siyuan']"
  );

  if (!formulaEnhanceButton) return;

  // 获取按钮所在的dock
  const dockLeft:HTMLElement = document.querySelector("#dockLeft");
  const dockRight:HTMLElement = document.querySelector("#dockRight");
  let dockTypeToExpand:string = "";
  if (dockLeft.querySelector('span[data-title="formulaEnhance-siyuan"]')) {
      dockTypeToExpand = "layout__dockl";
  } else if (dockRight.querySelector('span[data-title="formulaEnhance-siyuan"]')) {
      dockTypeToExpand = "layout__dockr";
  }

  const sideDock:HTMLElement = document.querySelector(
    "#layouts > div.fn__flex.fn__flex-1 > div.fn__flex-column." + dockTypeToExpand
  );

  if (!sideDock) return;

  const clickEvent = new MouseEvent("click", {
    bubbles: true,
    cancelable: true,
    view: window
  });

  if (sideDock.style.width === "0px") {
    formulaEnhanceButton.dispatchEvent(clickEvent);
  }
}
