export type PaneWidth = {
  current: number;
  min: number;
  max: number;
};

export type ToolTab = {
  id: string;
  toolId: string;
  label: string;
  closeable: boolean;
};

type VisibleToolWorkspace = {
  contextId: string;
  paneWidth: PaneWidth;
  restoreFocusTo: string;
};

export type ToolWorkspaceState =
  | {
      kind: "closed";
      lastActiveToolId?: string;
      restoreFocusTo: string;
    }
  | (VisibleToolWorkspace & {
      kind: "launcher";
    })
  | (VisibleToolWorkspace & {
      kind: "active-tool";
      tabs: readonly ToolTab[];
      activeTabId: string;
      secondaryNavigation: "visible" | "collapsed" | "unavailable";
    });

export type ToolWorkspacePresentation = {
  visible: boolean;
  contextRetained: boolean;
  surface: "none" | "launcher" | "tool";
  activeTabId?: string;
  showSecondaryNavigation: boolean;
  restoreFocusTo: string;
};

export function presentToolWorkspace(state: ToolWorkspaceState): ToolWorkspacePresentation {
  assertToolWorkspaceState(state);

  if (state.kind === "closed") {
    return {
      visible: false,
      contextRetained: false,
      surface: "none",
      showSecondaryNavigation: false,
      restoreFocusTo: state.restoreFocusTo,
    };
  }

  if (state.kind === "launcher") {
    return {
      visible: true,
      contextRetained: true,
      surface: "launcher",
      showSecondaryNavigation: false,
      restoreFocusTo: state.restoreFocusTo,
    };
  }

  return {
    visible: true,
    contextRetained: true,
    surface: "tool",
    activeTabId: state.activeTabId,
    showSecondaryNavigation: state.secondaryNavigation === "visible",
    restoreFocusTo: state.restoreFocusTo,
  };
}

export function assertToolWorkspaceState(state: ToolWorkspaceState): void {
  if (!state.restoreFocusTo.trim()) {
    throw new Error("Tool workspace requires an explicit focus restore target");
  }

  if (state.kind === "closed") {
    return;
  }

  if (!state.contextId.trim()) {
    throw new Error("A visible tool workspace must retain its task or thread context");
  }

  const { current, min, max } = state.paneWidth;
  if (min <= 0 || min > max || current < min || current > max) {
    throw new Error("Tool workspace pane width must stay inside valid min/max bounds");
  }

  if (state.kind === "launcher") {
    return;
  }

  const ids = state.tabs.map((tab) => tab.id);
  if (ids.length === 0 || new Set(ids).size !== ids.length) {
    throw new Error("An active tool requires at least one uniquely identified tab");
  }

  if (!ids.includes(state.activeTabId)) {
    throw new Error("The active tool tab must exist in the visible tab set");
  }
}
