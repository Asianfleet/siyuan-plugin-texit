import iconTexit from "./iconTexit.html?raw";

const ICONS: Record<string, string> = {
  iconTexit,
};

export function getIcon(iconId: string): string {
  return ICONS[iconId] ?? "";
}
