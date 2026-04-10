<script setup lang="ts">
import { ref } from "vue";
import { useI18NJSON } from "@/libs/utils/plugin";
import { useFormulaPanelSettingsStore } from "@/stores/formula-panel-settings";

const i18n = useI18NJSON();
const settingsStore = useFormulaPanelSettingsStore();
const activeTab = ref<"editor" | "appearance">("editor");

function updateNumberSetting(
  key: "editorFontSize" | "editorPaddingBlock" | "editorPaddingInline",
  value: string,
): void {
  void settingsStore.patchSettings({
    [key]: Number(value),
  });
}

function updateBooleanSetting(
  key:
    | "showVirtualKeyboardToggle"
    | "useManualVirtualKeyboardPolicy"
    | "showMenuToggle",
  value: boolean,
): void {
  void settingsStore.patchSettings({
    [key]: value,
  });
}

function updateSelectSetting(
  key:
    | "autoFocus"
    | "virtualKeyboardPlacement"
    | "editorTextareaDisplayMode",
  value: string,
): void {
  void settingsStore.patchSettings({
    [key]: value,
  });
}

function resetSettings(): void {
  void settingsStore.resetSettings();
}
</script>

<template>
  <div class="fn__flex-1 fn__flex config__panel fe__settings-panel">
    <ul class="b3-tab-bar b3-list b3-list--background">
      <li
        class="b3-list-item"
        :class="{ 'b3-list-item--focus': activeTab === 'editor' }"
        data-tab="editor"
        @click="activeTab = 'editor'"
      >
        <svg class="b3-list-item__graphic">
          <use xlink:href="#iconEdit"></use>
        </svg>
        <span class="b3-list-item__text">{{ i18n.formulaPanelSettingsEditorTab }}</span>
      </li>
      <li
        class="b3-list-item"
        :class="{ 'b3-list-item--focus': activeTab === 'appearance' }"
        data-tab="appearance"
        @click="activeTab = 'appearance'"
      >
        <svg class="b3-list-item__graphic">
          <use xlink:href="#iconTheme"></use>
        </svg>
        <span class="b3-list-item__text">{{ i18n.formulaPanelSettingsAppearanceTab }}</span>
      </li>
    </ul>
    <div class="config__tab-wrap">
      <div
        class="config__tab-container"
        :class="{ 'fn__none': activeTab !== 'editor' }"
        data-panel="editor"
      >
        <div class="fn__flex b3-label config__item">
          <div class="fn__flex-1">
            {{ i18n.formulaPanelSettingsAutoFocus }}
            <div class="b3-label__text">{{ i18n.formulaPanelSettingsAutoFocusDesc }}</div>
          </div>
          <span class="fn__space"></span>
          <select
            class="b3-select fn__flex-center fn__size200"
            name="autoFocus"
            :value="settingsStore.settings.autoFocus"
            @change="updateSelectSetting('autoFocus', ($event.target as HTMLSelectElement).value)"
          >
            <option value="mathlive">{{ i18n.formulaPanelSettingsAutoFocusMathlive }}</option>
            <option value="native">{{ i18n.formulaPanelSettingsAutoFocusNative }}</option>
          </select>
        </div>

        <label class="fn__flex b3-label config__item">
          <div class="fn__flex-1">
            {{ i18n.formulaPanelSettingsShowVirtualKeyboardToggle }}
            <div class="b3-label__text">
              {{ i18n.formulaPanelSettingsShowVirtualKeyboardToggleDesc }}
            </div>
          </div>
          <span class="fn__space"></span>
          <input
            class="b3-switch fn__flex-center"
            type="checkbox"
            :checked="settingsStore.settings.showVirtualKeyboardToggle"
            @change="updateBooleanSetting('showVirtualKeyboardToggle', ($event.target as HTMLInputElement).checked)"
          >
        </label>

        <label class="fn__flex b3-label config__item">
          <div class="fn__flex-1">
            {{ i18n.formulaPanelSettingsManualVirtualKeyboardPolicy }}
            <div class="b3-label__text">
              {{ i18n.formulaPanelSettingsManualVirtualKeyboardPolicyDesc }}
            </div>
          </div>
          <span class="fn__space"></span>
          <input
            class="b3-switch fn__flex-center"
            type="checkbox"
            :checked="settingsStore.settings.useManualVirtualKeyboardPolicy"
            @change="updateBooleanSetting('useManualVirtualKeyboardPolicy', ($event.target as HTMLInputElement).checked)"
          >
        </label>

        <div class="fn__flex b3-label config__item">
          <div class="fn__flex-1">
            {{ i18n.formulaPanelSettingsVirtualKeyboardPlacement }}
            <div class="b3-label__text">
              {{ i18n.formulaPanelSettingsVirtualKeyboardPlacementDesc }}
            </div>
          </div>
          <span class="fn__space"></span>
          <select
            class="b3-select fn__flex-center fn__size200"
            name="virtualKeyboardPlacement"
            :value="settingsStore.settings.virtualKeyboardPlacement"
            @change="updateSelectSetting('virtualKeyboardPlacement', ($event.target as HTMLSelectElement).value)"
          >
            <option value="bottom">{{ i18n.formulaPanelSettingsVirtualKeyboardPlacementBottom }}</option>
            <option value="top">{{ i18n.formulaPanelSettingsVirtualKeyboardPlacementTop }}</option>
            <option value="bottom-of-editor">
              {{ i18n.formulaPanelSettingsVirtualKeyboardPlacementBottomOfEditor }}
            </option>
          </select>
        </div>

        <label class="fn__flex b3-label config__item">
          <div class="fn__flex-1">
            {{ i18n.formulaPanelSettingsShowMenuToggle }}
            <div class="b3-label__text">{{ i18n.formulaPanelSettingsShowMenuToggleDesc }}</div>
          </div>
          <span class="fn__space"></span>
          <input
            class="b3-switch fn__flex-center"
            type="checkbox"
            :checked="settingsStore.settings.showMenuToggle"
            @change="updateBooleanSetting('showMenuToggle', ($event.target as HTMLInputElement).checked)"
          >
        </label>

        <div class="fn__flex b3-label config__item">
          <div class="fn__flex-1">
            {{ i18n.formulaPanelSettingsTextareaMode }}
            <div class="b3-label__text">{{ i18n.formulaPanelSettingsTextareaModeDesc }}</div>
          </div>
          <span class="fn__space"></span>
          <select
            class="b3-select fn__flex-center fn__size200"
            name="editorTextareaDisplayMode"
            :value="settingsStore.settings.editorTextareaDisplayMode"
            @change="updateSelectSetting('editorTextareaDisplayMode', ($event.target as HTMLSelectElement).value)"
          >
            <option value="both">{{ i18n.formulaPanelSettingsTextareaModeBoth }}</option>
            <option value="editor-only">{{ i18n.formulaPanelSettingsTextareaModeEditorOnly }}</option>
          </select>
        </div>
      </div>

      <div
        class="config__tab-container"
        :class="{ 'fn__none': activeTab !== 'appearance' }"
        data-panel="appearance"
      >
        <div class="fn__flex b3-label config__item">
          <div class="fn__flex-1">
            {{ i18n.formulaPanelSettingsEditorFontSize }}
            <div class="b3-label__text">{{ i18n.formulaPanelSettingsEditorFontSizeDesc }}</div>
          </div>
          <span class="fn__space"></span>
          <input
            class="b3-text-field fn__flex-center fn__size200"
            type="number"
            min="12"
            max="32"
            name="editorFontSize"
            :value="settingsStore.settings.editorFontSize"
            @change="updateNumberSetting('editorFontSize', ($event.target as HTMLInputElement).value)"
          >
        </div>

        <div class="fn__flex b3-label config__item">
          <div class="fn__flex-1">
            {{ i18n.formulaPanelSettingsEditorPaddingBlock }}
            <div class="b3-label__text">
              {{ i18n.formulaPanelSettingsEditorPaddingBlockDesc }}
            </div>
          </div>
          <span class="fn__space"></span>
          <input
            class="b3-text-field fn__flex-center fn__size200"
            type="number"
            min="0"
            max="24"
            name="editorPaddingBlock"
            :value="settingsStore.settings.editorPaddingBlock"
            @change="updateNumberSetting('editorPaddingBlock', ($event.target as HTMLInputElement).value)"
          >
        </div>

        <div class="fn__flex b3-label config__item">
          <div class="fn__flex-1">
            {{ i18n.formulaPanelSettingsEditorPaddingInline }}
            <div class="b3-label__text">
              {{ i18n.formulaPanelSettingsEditorPaddingInlineDesc }}
            </div>
          </div>
          <span class="fn__space"></span>
          <input
            class="b3-text-field fn__flex-center fn__size200"
            type="number"
            min="0"
            max="32"
            name="editorPaddingInline"
            :value="settingsStore.settings.editorPaddingInline"
            @change="updateNumberSetting('editorPaddingInline', ($event.target as HTMLInputElement).value)"
          >
        </div>

        <div class="fe__settings-panel__actions">
          <button
            class="b3-button b3-button--outline"
            data-action="reset-settings"
            @click="resetSettings"
          >
            {{ i18n.formulaPanelSettingsReset }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fe__settings-panel {
  overflow: hidden;
  position: relative;
  height: 100%;
}

.fe__settings-panel__actions {
  padding: 16px 24px;
  display: flex; 
  justify-content: flex-end;
  align-items: center;
}
</style>
