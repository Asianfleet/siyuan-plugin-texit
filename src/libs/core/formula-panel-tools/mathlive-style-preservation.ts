/**
 * 保留 MathLive 字体样式菜单未触及的原始 LaTeX 宏写法。
 */
import {
  logFormulaPanelDebug,
  previewLatex,
} from "./formula-panel-debug";

type FontStyleAtom = {
  command?: string;
  style?: {
    variantStyle?: unknown;
  };
  value?: string;
  verbatimLatex?: string;
};

type FontStyleModel = {
  at?: (offset: number) => FontStyleAtom | undefined;
  lastOffset?: number;
};

type FontStyleMathfield = {
  _mathfield?: {
    model?: FontStyleModel;
  };
  model?: FontStyleModel;
  value: string;
};

type StyledAtomEntry = {
  body: string;
  offset: number;
  variantStyle: string;
};

type FontStyleWrapperOccurrence = {
  body: string;
  end: number;
  start: number;
  wrapper: string;
};

type VerbatimFontStyleEntry = StyledAtomEntry & {
  wrapper: string;
};

export type VerbatimFontStyleSnapshot = {
  entries: VerbatimFontStyleEntry[];
};

type VerbatimLatexInputSnapshotEntry = {
  body: string;
  canonicalWrapper: string;
  sourceWrapper: string;
};

export type VerbatimLatexInputSnapshot = {
  canonicalLatex: string;
  entries: VerbatimLatexInputSnapshotEntry[];
  sourceLatex: string;
};

const FONT_STYLE_WRAPPER_PATTERN =
  /\\(bm|boldsymbol|mathbf|mathit|mathrm|mathbb|mathfrak|mathcal|mathtt|mathsf|mathscr)\s*\{(\s*(?:\\[A-Za-z]+|[A-Za-z0-9])\s*)\}/g;

function normalizeWrapperBody(body: string): string {
  return body.trim();
}

function normalizeAtomBody(atom: FontStyleAtom): string | null {
  if (
    typeof atom.verbatimLatex === "string" &&
    /^\\[A-Za-z]+$/.test(atom.verbatimLatex)
  ) {
    return atom.verbatimLatex;
  }
  if (typeof atom.command === "string" && atom.command) {
    return atom.command;
  }
  if (typeof atom.value === "string" && atom.value) {
    return atom.value;
  }

  return null;
}

function collectStyledAtoms(
  mathfield: FontStyleMathfield,
): StyledAtomEntry[] | null {
  const model = mathfield.model ?? mathfield._mathfield?.model;
  if (!model?.at || typeof model.lastOffset !== "number") {
    return null;
  }

  const entries: StyledAtomEntry[] = [];
  for (let offset = 0; offset <= model.lastOffset; offset += 1) {
    const atom = model.at(offset);
    const variantStyle = atom?.style?.variantStyle;
    if (typeof variantStyle !== "string" || !variantStyle) {
      continue;
    }

    const body = normalizeAtomBody(atom);
    if (!body) {
      continue;
    }

    entries.push({
      body,
      offset,
      variantStyle,
    });
  }

  return entries;
}

function parseFontStyleWrappers(
  latex: string,
): FontStyleWrapperOccurrence[] {
  const wrappers: FontStyleWrapperOccurrence[] = [];

  FONT_STYLE_WRAPPER_PATTERN.lastIndex = 0;
  for (
    let match = FONT_STYLE_WRAPPER_PATTERN.exec(latex);
    match;
    match = FONT_STYLE_WRAPPER_PATTERN.exec(latex)
  ) {
    wrappers.push({
      body: normalizeWrapperBody(match[2]),
      end: match.index + match[0].length,
      start: match.index,
      wrapper: match[0],
    });
  }

  return wrappers;
}

function wrapperMatchesAtom(
  wrapper: FontStyleWrapperOccurrence,
  atom: StyledAtomEntry,
): boolean {
  return wrapper.body === atom.body;
}

function alignWrappersToStyledAtoms(
  wrappers: FontStyleWrapperOccurrence[],
  styledAtoms: StyledAtomEntry[],
): Array<{
  atom: StyledAtomEntry;
  wrapper: FontStyleWrapperOccurrence;
  wrapperIndex: number;
}> | null {
  const matches: Array<{
    atom: StyledAtomEntry;
    wrapper: FontStyleWrapperOccurrence;
    wrapperIndex: number;
  }> = [];
  let atomIndex = 0;

  wrappers.forEach((wrapper, wrapperIndex) => {
    while (
      atomIndex < styledAtoms.length &&
      !wrapperMatchesAtom(wrapper, styledAtoms[atomIndex])
    ) {
      atomIndex += 1;
    }

    if (atomIndex >= styledAtoms.length) {
      matches.length = 0;
      return;
    }

    matches.push({
      atom: styledAtoms[atomIndex],
      wrapper,
      wrapperIndex,
    });
    atomIndex += 1;
  });

  if (matches.length !== wrappers.length) {
    return null;
  }

  return matches;
}

function alignWrapperOccurrences(
  sourceWrappers: FontStyleWrapperOccurrence[],
  targetWrappers: FontStyleWrapperOccurrence[],
): Array<{
  sourceWrapper: FontStyleWrapperOccurrence;
  targetWrapper: FontStyleWrapperOccurrence;
  wrapperIndex: number;
}> | null {
  if (sourceWrappers.length !== targetWrappers.length) {
    return null;
  }

  const matches: Array<{
    sourceWrapper: FontStyleWrapperOccurrence;
    targetWrapper: FontStyleWrapperOccurrence;
    wrapperIndex: number;
  }> = [];
  let targetIndex = 0;

  sourceWrappers.forEach((sourceWrapper, wrapperIndex) => {
    while (
      targetIndex < targetWrappers.length &&
      targetWrappers[targetIndex].body !== sourceWrapper.body
    ) {
      targetIndex += 1;
    }

    if (targetIndex >= targetWrappers.length) {
      matches.length = 0;
      return;
    }

    matches.push({
      sourceWrapper,
      targetWrapper: targetWrappers[targetIndex],
      wrapperIndex,
    });
    targetIndex += 1;
  });

  if (matches.length !== sourceWrappers.length) {
    return null;
  }

  return matches;
}

function getLatexChangedRange(
  previousLatex: string,
  nextLatex: string,
): {
  end: number;
  start: number;
} | null {
  let start = 0;
  while (
    start < previousLatex.length &&
    start < nextLatex.length &&
    previousLatex[start] === nextLatex[start]
  ) {
    start += 1;
  }

  if (
    start === previousLatex.length &&
    start === nextLatex.length
  ) {
    return null;
  }

  let previousEnd = previousLatex.length;
  let nextEnd = nextLatex.length;
  while (
    previousEnd > start &&
    nextEnd > start &&
    previousLatex[previousEnd - 1] === nextLatex[nextEnd - 1]
  ) {
    previousEnd -= 1;
    nextEnd -= 1;
  }

  return {
    start,
    end: nextEnd,
  };
}

function rangesIntersect(
  firstStart: number,
  firstEnd: number,
  secondStart: number,
  secondEnd: number,
): boolean {
  return firstStart < secondEnd && secondStart < firstEnd;
}

export function captureVerbatimFontStyleSnapshot({
  mathfield,
  sourceLatex,
}: {
  mathfield: FontStyleMathfield | null;
  sourceLatex: string | null | undefined;
}): VerbatimFontStyleSnapshot | null {
  if (!mathfield || !sourceLatex) {
    logFormulaPanelDebug("capture-font-style-snapshot-skipped", {
      hasMathfield: Boolean(mathfield),
      hasSourceLatex: Boolean(sourceLatex),
    });
    return null;
  }

  const styledAtoms = collectStyledAtoms(mathfield);
  const wrappers = parseFontStyleWrappers(sourceLatex);
  if (
    !styledAtoms ||
    styledAtoms.length === 0 ||
    wrappers.length === 0
  ) {
    logFormulaPanelDebug("capture-font-style-snapshot-unavailable", {
      sourceLatex: previewLatex(sourceLatex),
      styledAtomCount: styledAtoms?.length ?? null,
      wrapperCount: wrappers.length,
    });
    return null;
  }

  const alignedWrappers = alignWrappersToStyledAtoms(wrappers, styledAtoms);
  if (!alignedWrappers) {
    logFormulaPanelDebug("capture-font-style-snapshot-unavailable", {
      sourceLatex: previewLatex(sourceLatex),
      styledAtomCount: styledAtoms.length,
      wrapperCount: wrappers.length,
    });
    return null;
  }

  const entries: VerbatimFontStyleEntry[] = [];
  for (const { atom, wrapper, wrapperIndex } of alignedWrappers) {
    entries.push({
      ...atom,
      wrapper: wrapper.wrapper,
    });

    logFormulaPanelDebug("capture-font-style-snapshot-match", {
      index: wrapperIndex,
      sourceLatex: previewLatex(sourceLatex),
      atomBody: atom.body,
      atomOffset: atom.offset,
      wrapperBody: wrapper.body,
      wrapper: wrapper.wrapper,
    });
  }

  logFormulaPanelDebug("capture-font-style-snapshot-success", {
    sourceLatex: previewLatex(sourceLatex),
    entries: entries.map((entry) => ({
      offset: entry.offset,
      body: entry.body,
      variantStyle: entry.variantStyle,
      wrapper: entry.wrapper,
    })),
  });

  return { entries };
}

export function captureVerbatimLatexInputSnapshot({
  canonicalLatex,
  sourceLatex,
}: {
  canonicalLatex: string | null | undefined;
  sourceLatex: string | null | undefined;
}): VerbatimLatexInputSnapshot | null {
  if (!sourceLatex || !canonicalLatex) {
    logFormulaPanelDebug("capture-latex-input-snapshot-skipped", {
      hasCanonicalLatex: Boolean(canonicalLatex),
      hasSourceLatex: Boolean(sourceLatex),
    });
    return null;
  }

  const sourceWrappers = parseFontStyleWrappers(sourceLatex);
  const canonicalWrappers = parseFontStyleWrappers(canonicalLatex);
  if (
    sourceWrappers.length === 0 ||
    canonicalWrappers.length === 0
  ) {
    logFormulaPanelDebug("capture-latex-input-snapshot-unavailable", {
      sourceLatex: previewLatex(sourceLatex),
      canonicalLatex: previewLatex(canonicalLatex),
      sourceWrapperCount: sourceWrappers.length,
      canonicalWrapperCount: canonicalWrappers.length,
    });
    return null;
  }

  const alignedWrappers = alignWrapperOccurrences(
    sourceWrappers,
    canonicalWrappers,
  );
  if (!alignedWrappers) {
    logFormulaPanelDebug("capture-latex-input-snapshot-unavailable", {
      sourceLatex: previewLatex(sourceLatex),
      canonicalLatex: previewLatex(canonicalLatex),
      sourceWrapperCount: sourceWrappers.length,
      canonicalWrapperCount: canonicalWrappers.length,
    });
    return null;
  }

  const entries = alignedWrappers.map(({ sourceWrapper, targetWrapper }) => ({
    body: sourceWrapper.body,
    canonicalWrapper: targetWrapper.wrapper,
    sourceWrapper: sourceWrapper.wrapper,
  }));
  logFormulaPanelDebug("capture-latex-input-snapshot-success", {
    sourceLatex: previewLatex(sourceLatex),
    canonicalLatex: previewLatex(canonicalLatex),
    entries,
  });

  return {
    canonicalLatex,
    sourceLatex,
    entries,
  };
}

function applyWrapperReplacements(
  latex: string,
  wrappers: FontStyleWrapperOccurrence[],
  replacements: Map<number, string>,
): string {
  let nextLatex = "";
  let lastIndex = 0;

  wrappers.forEach((wrapper, index) => {
    nextLatex += latex.slice(lastIndex, wrapper.start);
    nextLatex += replacements.get(index) ?? wrapper.wrapper;
    lastIndex = wrapper.end;
  });

  return `${nextLatex}${latex.slice(lastIndex)}`;
}

export function restoreVerbatimFontStyleLatex({
  mathfield,
  snapshot,
}: {
  mathfield: FontStyleMathfield | null;
  snapshot: VerbatimFontStyleSnapshot | null | undefined;
}): string | null {
  if (!mathfield || !snapshot) {
    logFormulaPanelDebug("restore-font-style-latex-skipped", {
      hasMathfield: Boolean(mathfield),
      hasSnapshot: Boolean(snapshot),
    });
    return null;
  }

  const styledAtoms = collectStyledAtoms(mathfield);
  const wrappers = parseFontStyleWrappers(mathfield.value);
  if (!styledAtoms || wrappers.length === 0) {
    logFormulaPanelDebug("restore-font-style-latex-unavailable", {
      mathfieldValue: previewLatex(mathfield.value),
      styledAtomCount: styledAtoms?.length ?? null,
      wrapperCount: wrappers.length,
      snapshotEntryCount: snapshot.entries.length,
    });
    return null;
  }

  const alignedWrappers = alignWrappersToStyledAtoms(wrappers, styledAtoms);
  if (!alignedWrappers) {
    logFormulaPanelDebug("restore-font-style-latex-unavailable", {
      mathfieldValue: previewLatex(mathfield.value),
      styledAtomCount: styledAtoms.length,
      wrapperCount: wrappers.length,
      snapshotEntryCount: snapshot.entries.length,
    });
    return null;
  }

  const snapshotByOffset = new Map(
    snapshot.entries.map((entry) => [entry.offset, entry]),
  );
  const replacements = new Map<number, string>();
  for (const { atom, wrapper, wrapperIndex } of alignedWrappers) {
    const snapshotEntry = snapshotByOffset.get(atom.offset);
    if (
      !snapshotEntry ||
      snapshotEntry.body !== atom.body ||
      snapshotEntry.variantStyle !== atom.variantStyle ||
      snapshotEntry.wrapper === wrapper.wrapper
    ) {
      continue;
    }

    replacements.set(wrapperIndex, snapshotEntry.wrapper);
  }

  if (replacements.size === 0) {
    logFormulaPanelDebug("restore-font-style-latex-noop", {
      mathfieldValue: previewLatex(mathfield.value),
      snapshotEntryCount: snapshot.entries.length,
    });
    return null;
  }

  const restoredLatex = applyWrapperReplacements(
    mathfield.value,
    wrappers,
    replacements,
  );

  logFormulaPanelDebug("restore-font-style-latex-success", {
    mathfieldValue: previewLatex(mathfield.value),
    restoredLatex: previewLatex(restoredLatex),
    replacementCount: replacements.size,
  });

  return restoredLatex;
}

export function restoreVerbatimLatexInputLatex({
  nextLatex,
  snapshot,
}: {
  nextLatex: string | null | undefined;
  snapshot: VerbatimLatexInputSnapshot | null | undefined;
}): string | null {
  if (!nextLatex || !snapshot) {
    logFormulaPanelDebug("restore-latex-input-snapshot-skipped", {
      hasNextLatex: Boolean(nextLatex),
      hasSnapshot: Boolean(snapshot),
    });
    return null;
  }

  const nextWrappers = parseFontStyleWrappers(nextLatex);
  if (nextWrappers.length === 0) {
    logFormulaPanelDebug("restore-latex-input-snapshot-unavailable", {
      nextLatex: previewLatex(nextLatex),
      nextWrapperCount: nextWrappers.length,
      snapshotEntryCount: snapshot.entries.length,
    });
    return null;
  }

  const alignedWrappers = alignWrapperOccurrences(
    snapshot.entries.map((entry) => ({
      body: entry.body,
      end: 0,
      start: 0,
      wrapper: entry.canonicalWrapper,
    })),
    nextWrappers,
  );
  if (!alignedWrappers) {
    logFormulaPanelDebug("restore-latex-input-snapshot-unavailable", {
      nextLatex: previewLatex(nextLatex),
      nextWrapperCount: nextWrappers.length,
      snapshotEntryCount: snapshot.entries.length,
    });
    return null;
  }

  const changedRange = getLatexChangedRange(
    snapshot.canonicalLatex,
    nextLatex,
  );
  const replacements = new Map<number, string>();
  for (const { targetWrapper, wrapperIndex } of alignedWrappers) {
    const snapshotEntry = snapshot.entries[wrapperIndex];
    if (
      !snapshotEntry ||
      snapshotEntry.sourceWrapper === targetWrapper.wrapper
    ) {
      continue;
    }

    if (
      changedRange &&
      rangesIntersect(
        changedRange.start,
        changedRange.end,
        targetWrapper.start,
        targetWrapper.end,
      )
    ) {
      continue;
    }

    replacements.set(wrapperIndex, snapshotEntry.sourceWrapper);
  }

  if (replacements.size === 0) {
    logFormulaPanelDebug("restore-latex-input-snapshot-noop", {
      nextLatex: previewLatex(nextLatex),
      snapshotEntryCount: snapshot.entries.length,
      changedRange,
    });
    return null;
  }

  const restoredLatex = applyWrapperReplacements(
    nextLatex,
    nextWrappers,
    replacements,
  );
  logFormulaPanelDebug("restore-latex-input-snapshot-success", {
    nextLatex: previewLatex(nextLatex),
    restoredLatex: previewLatex(restoredLatex),
    replacementCount: replacements.size,
    changedRange,
  });

  return restoredLatex;
}

export function isVariantStyleApplyStyleArgs(args: unknown[]): boolean {
  const style = args[0];
  return (
    typeof style === "object" &&
    style !== null &&
    typeof (style as { variantStyle?: unknown }).variantStyle === "string"
  );
}
