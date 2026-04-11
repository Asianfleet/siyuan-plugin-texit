const FORMULA_PANEL_DEBUG_PREFIX = "[texit][formula-panel]";

export function previewLatex(
  value: string | null | undefined,
  maxLength = 160,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3)}...`;
}

export function logFormulaPanelDebug(
  event: string,
  details?: Record<string, unknown>,
): void {
  console.info(`${FORMULA_PANEL_DEBUG_PREFIX} ${event}`, details ?? {});
}
