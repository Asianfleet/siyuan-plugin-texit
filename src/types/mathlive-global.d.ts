type MathfieldElementMenuItem = {
  id?: string;
  type?: "command" | "submenu";
  label?: string | (() => string);
  visible?: boolean | (() => boolean);
  enabled?: boolean | (() => boolean);
  keyboardShortcut?: string;
  tooltip?: string | (() => string);
  onMenuSelect?: (_event?: Event) => void;
  submenu?: readonly MathfieldElementMenuItem[];
};

type MathfieldElementStyle = Record<string, unknown>;

type MathfieldElementStyleOptions = {
  operation?: "set" | "toggle";
  [key: string]: unknown;
};

interface MathfieldElementInstance extends HTMLElement {
  mode?: "math" | "text" | "latex";
  value: string;
  mathVirtualKeyboardPolicy?: "auto" | "manual" | "sandboxed";
  executeCommand(selector: string | unknown[] | readonly unknown[], ...args: unknown[]): boolean;
  applyStyle(style: MathfieldElementStyle, options?: MathfieldElementStyleOptions): void;
  menuItems: readonly MathfieldElementMenuItem[];
  isSelectionEditable: boolean;
}

declare global {
  interface Window {
    MathfieldElement?: {
      new (): MathfieldElementInstance;
      locale?: string;
      strings?: Record<string, Record<string, string>>;
      soundsDirectory?: string | null;
      keypressVibration?: boolean;
    };
    mathVirtualKeyboard?: {
      container?: HTMLElement | null;
      visible?: boolean;
      boundingRect?: {
        height: number;
      };
      addEventListener?: (type: string, listener: EventListenerOrEventListenerObject) => void;
      removeEventListener?: (type: string, listener: EventListenerOrEventListenerObject) => void;
      show?: () => void;
      hide?: () => void;
      layouts?: unknown;
      normalizedLayouts?: Array<{
        layers?: Array<{
          rows?: Array<
            Array<
              | string
              | {
                  aside?: string;
                  [key: string]: unknown;
                }
            >
          >;
          [key: string]: unknown;
        }>;
        [key: string]: unknown;
      }>;
    };
  }

  const MathfieldElement: NonNullable<Window["MathfieldElement"]>;
}

export {};
