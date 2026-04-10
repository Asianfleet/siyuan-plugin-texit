/*
  公式面板设置面板模块
  提供一个与 SiYuan Dialog 集成的容器，挂载 `FormulaPanelSettingsView` 组件并通过 Pinia 传入全局 store。
*/
import { createApp, type App as VueApp } from "vue";
import type { Pinia } from "pinia";
import { Dialog } from "siyuan";
import FormulaPanelSettingsView from "@/components/FormulaPanelSettingsView.vue";
import { useFormulaPanelSettingsStore } from "@/stores/formula-panel-settings";

/**
 * 创建公式面板设置对话框的打开函数，并在打开时挂载 Vue 设置视图。
 */
export function createFormulaPanelSettingsPanel(
  plugin: FormulaEnhance,
  _store: ReturnType<typeof useFormulaPanelSettingsStore>,
  pinia: Pinia,
): () => void {
  return () => {
    let app: VueApp<Element> | null = null;
    const dialog = new Dialog({
      title: plugin.i18n.formulaPanelSettingsTitle,
      content: '<div id="FormulaPanelSettings" style="height: 100%;"></div>',
      width: "800px",
      height: "600px",
      destroyCallback: () => {
        // Dialog 销毁时卸载 Vue 实例并清理引用，防止内存泄漏。
        app?.unmount();
        app = null;
      },
    });
    // 记录当前打开的对话框以便插件后续可能关闭或复用。
    (plugin as FormulaEnhance & { __lastDialog?: Dialog }).__lastDialog = dialog;

    const settingsContainer = dialog.element.querySelector("#FormulaPanelSettings");
    if (!settingsContainer) {
      return;
    }

    app = createApp(FormulaPanelSettingsView);
    // 将 Pinia 注入设置面板，使其能访问共享状态。
    app.use(pinia);
    app.mount(settingsContainer);
  };
}
