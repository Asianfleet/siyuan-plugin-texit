import type { Plugin } from "siyuan";

declare global {
    interface FormulaEnhance extends Plugin {
        readonly isMobile: boolean;
        readonly isMobilePlugin: boolean;
    }
}