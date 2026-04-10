import { defineStore } from "pinia";
import { ref } from "vue";
import { usePlugin } from "@/libs/utils/plugin";
import {
  DEFAULT_FORMULA_PANEL_SETTINGS,
  FORMULA_PANEL_SETTINGS_STORAGE_FILE,
  FORMULA_PANEL_SETTINGS_STORAGE_PATH,
  type FormulaPanelSettings,
  normalizeFormulaPanelSettings,
} from "@/libs/core/formula-panel-settings";

type RuntimeConsumer = (settings: FormulaPanelSettings) => void;

export const useFormulaPanelSettingsStore = defineStore(
  "formula-panel-settings",
  () => {
    const formulaEnhance = usePlugin();
    const settings = ref<FormulaPanelSettings>(DEFAULT_FORMULA_PANEL_SETTINGS);
    let runtimeConsumer: RuntimeConsumer | null = null;

    function registerRuntimeConsumer(consumer: RuntimeConsumer): void {
      runtimeConsumer = consumer;
    }

    function notifyRuntime(): void {
      runtimeConsumer?.(settings.value);
    }

    async function loadSettings(): Promise<void> {
      try {
        const response = await fetch("/api/file/getFile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            path: FORMULA_PANEL_SETTINGS_STORAGE_PATH,
          }),
        });
        const payload = await response.json();
        settings.value = normalizeFormulaPanelSettings(
          payload && typeof payload === "object" && !Array.isArray(payload)
            ? payload
            : undefined,
        );
      } catch {
        settings.value = DEFAULT_FORMULA_PANEL_SETTINGS;
      }

      notifyRuntime();
    }

    async function saveSettings(nextSettings: FormulaPanelSettings): Promise<void> {
      await formulaEnhance.saveData(
        FORMULA_PANEL_SETTINGS_STORAGE_FILE,
        nextSettings,
      );
    }

    async function patchSettings(
      partial: Partial<FormulaPanelSettings>,
    ): Promise<void> {
      settings.value = normalizeFormulaPanelSettings({
        ...settings.value,
        ...partial,
      });
      await saveSettings(settings.value);
      notifyRuntime();
    }

    async function resetSettings(): Promise<void> {
      settings.value = DEFAULT_FORMULA_PANEL_SETTINGS;
      await saveSettings(settings.value);
      notifyRuntime();
    }

    return {
      settings,
      loadSettings,
      patchSettings,
      resetSettings,
      registerRuntimeConsumer,
    };
  },
);
