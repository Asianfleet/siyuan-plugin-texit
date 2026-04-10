/**
 * 根据前端环境异步加载 MathLive 脚本，供公式面板按需实例化 Mathfield。
 */
import { getFrontend } from "siyuan";

const SCRIPT_ID = "formula-enhance-mathlive-script";
const DESKTOP_SCRIPT_SRC =
  "/plugins/siyuan-plugin-formula-enhance/asset/vendor/mathlive/mathlive.min.js";
const MOBILE_SCRIPT_SRC =
  "https://cdn.jsdelivr.net/gh/Asianfleet/siyuan-plugin-formula-enhance@main/asset/vendor/mathlive/mathlive.min.js";

let pendingLoad: Promise<void> | null = null;

function resolveScriptSrc(): string {
  const frontend = getFrontend();
  // 根据运行端是否为移动端选择不同的脚本地址
  return frontend === "mobile" || frontend === "browser-mobile"
    ? MOBILE_SCRIPT_SRC
    : DESKTOP_SCRIPT_SRC;
}

/**
 * 只加载一次 MathLive 脚本，后续调用复用同一个 Promise。
 */
export function loadMathLive(): Promise<void> {
  if (window.MathfieldElement) {
    // MathLive 已经存在则直接返回
    return Promise.resolve();
  }

  if (pendingLoad) {
    // 有加载中的 Promise 时复用它
    return pendingLoad;
  }

  // pendingLoad 用于防止重复注入
  pendingLoad = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      // 已有脚本则监听其状态，避免重插
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("MathLive load failed")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = resolveScriptSrc();
    script.async = true;
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener(
      "error",
      () => {
        // 出错时清除 pendingLoad 以便再次尝试
        pendingLoad = null;
        reject(new Error("MathLive load failed"));
      },
      { once: true },
    );
    // 将脚本插到 head，以触发浏览器加载流程
    document.head.appendChild(script);
  });

  return pendingLoad;
}
