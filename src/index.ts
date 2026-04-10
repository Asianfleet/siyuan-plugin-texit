import {
  getFrontend,
  Plugin,
} from "siyuan";
import {
  usePlugin,
} from "./libs/utils/plugin";
import iconTexit from "@/static/icons/iconTexit.html?raw"
import { FormulaPanelEnhancer } from "@/libs/core/formula-panel-enhancer";
import { createPinia, setActivePinia } from "pinia";
import { createFormulaPanelSettingsPanel } from "@/libs/core/formula-panel-settings-panel";
import { useFormulaPanelSettingsStore } from "@/stores/formula-panel-settings";
import "@/index.css";

export default class FormulaEnhance extends Plugin {
  public isMobile: boolean;
  private formulaPanelEnhancer!: FormulaPanelEnhancer;
  private settingsPanelOpen: (() => void) | null = null;
  private openNoneditableBlockEventBindThis = this.openNoneditableBlockEvent.bind(this);

  get isMobilePlugin(): boolean {
    return this.isMobile;
  }

  async onload() {
    const frontEnd = getFrontend();
    this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";
    this.addIcons(iconTexit);

    usePlugin(this);

    const pinia = createPinia();
    setActivePinia(pinia);
    const settingsStore = useFormulaPanelSettingsStore();
    await settingsStore.loadSettings();

    this.formulaPanelEnhancer = new FormulaPanelEnhancer({
      isMobile: this.isMobile,
      settings: settingsStore.settings,
    });

    settingsStore.registerRuntimeConsumer((settings) => {
      this.formulaPanelEnhancer.applySettings(settings);
    });

    this.settingsPanelOpen = createFormulaPanelSettingsPanel(
      this,
      settingsStore,
      pinia,
    );

    const toolbarElement = document.querySelector(".protyle-util");
    if (toolbarElement instanceof HTMLElement) {
      void this.formulaPanelEnhancer.init(toolbarElement);
    }

    this.eventBus.on(
      "open-noneditableblock",
      this.openNoneditableBlockEventBindThis,
    );
  }

  onunload() {
    this.eventBus.off(
      "open-noneditableblock",
      this.openNoneditableBlockEventBindThis,
    );
    this.formulaPanelEnhancer.destroy();
  }

  uninstall() {

  }

  onLayoutReady(): void {
    this.addTopBar(
      {
        icon: "iconTexit",
        title: this.i18n.formulaPanelTopBarSettingTitle,
        position: "right",
        callback: () => {
          this.openSetting();
        },
      },
    )
  }

  private async openNoneditableBlockEvent({ detail }: any) {
    await this.formulaPanelEnhancer.handleOpen({ detail });
  }

  openSetting(): void {
    this.settingsPanelOpen?.();
  }
}
