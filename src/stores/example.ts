// stores/session.ts
import { usePlugin } from '@/libs/utils/plugin';
import { defineStore } from 'pinia'
import { ref } from 'vue'

interface Example {}

const emptyExample: Example = {}

export const useExampleStore = defineStore('example', () => {

  const formulaEnhance: FormulaEnhance = usePlugin();
  
  // 默认使用空配置
  const example = ref<Example>(emptyExample);
  const currentExample = ref<Example>(emptyExample);

  // 从服务器加载会话配置的函数
  async function loadExample() {
    try {
      const response = await fetch('/api/file/getFile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ "path": `/data/storage/petal/siyuan-plugin-formulaEnhance/example.json` }),
      });
      const example_data = await response.json();
      console.log("[useExampleStore loadExample] 读取示例:", example_data);
      example.value = example_data;
    } catch (error) {
      console.error("[useExampleStore loadExample] 读取示例失败:", error);
    }
  }

  function saveExample(example: Example) {
    formulaEnhance.saveData('/data/storage/petal/siyuan-plugin-formulaEnhance/example.json', example);
    console.log('[useExampleStore saveExample] 保存示例:', example);

  }


  return {
    example,
    currentExample,
    loadExample,
    saveExample,
  }
})