export type LayerKind = "menu" | "dialog" | "danger-confirmation" | "approval";

export type OpenLayerOptions = {
  kind: LayerKind;
  trigger: HTMLElement;
  layer: HTMLElement;
  initialFocus?: HTMLElement;
  safeAction?: HTMLElement;
  approvalPrimary?: HTMLElement;
};

type LayerEntry = OpenLayerOptions;

/**
 * Escape closes only the top layer, and focus returns to its trigger. A danger
 * confirmation defaults to the safe action; approval may opt into its own
 * explicit primary autofocus rule.
 */
export class FocusLayerStack {
  private readonly stack: LayerEntry[] = [];

  open(options: OpenLayerOptions): void {
    options.trigger.setAttribute("aria-expanded", "true");
    this.stack.push(options);
    this.pickInitialFocus(options)?.focus();
  }

  closeTop(): boolean {
    const current = this.stack.pop();
    if (!current) return false;

    current.trigger.setAttribute("aria-expanded", "false");
    if (current.trigger.isConnected) current.trigger.focus();
    return true;
  }

  handleEscape(event: KeyboardEvent): void {
    if (event.key !== "Escape" || this.stack.length === 0) return;

    event.preventDefault();
    event.stopPropagation();
    this.closeTop();
  }

  private pickInitialFocus(options: OpenLayerOptions): HTMLElement | null {
    if (options.initialFocus) return options.initialFocus;
    if (options.kind === "danger-confirmation") return options.safeAction ?? null;
    if (options.kind === "approval") return options.approvalPrimary ?? null;

    return options.layer.querySelector<HTMLElement>(
      '[autofocus], [data-initial-focus], button:not([disabled]), [href], input:not([disabled])',
    );
  }
}

export function assertIconButtonHasAccessibleName(button: HTMLButtonElement): void {
  const name =
    button.getAttribute("aria-label")?.trim() ||
    button.getAttribute("aria-labelledby")?.trim() ||
    button.title.trim();

  if (!name) {
    throw new Error("Icon-only buttons require an accessible name");
  }
}

export const OBJECT_ACTION_DISCLOSURE_CSS = `
[data-object-actions] { visibility: hidden; }
[data-object]:is(:hover, :focus-within, [data-menu-open="true"])
  [data-object-actions] { visibility: visible; }
`;
