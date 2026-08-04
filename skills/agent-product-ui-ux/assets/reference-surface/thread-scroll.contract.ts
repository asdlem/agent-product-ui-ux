export const FOLLOW_LATEST_THRESHOLD_PX = 24;
export const COMPOSER_SAFE_GAP_PX = 16;

export type ScrollPositionToken = unknown;

export type VisualAnchor = {
  id: string;
  offsetFromViewportTopPx: number;
};

/**
 * Normalize any concrete list implementation, including `column-reverse` or a
 * virtual list, behind this adapter. The controller only owns UX behavior.
 */
export interface ThreadScrollAdapter {
  distanceToLatestPx(): number;
  scrollToLatest(options: { behavior: ScrollBehavior }): void;
  capturePosition(): ScrollPositionToken;
  restorePosition(position: ScrollPositionToken): void;
  captureAnchor(element: HTMLElement): VisualAnchor;
  restoreAnchor(anchor: VisualAnchor): void;
  setComposerSafeArea(pixels: number): void;
}

export class ThreadScrollController {
  private activeThreadId: string | null = null;
  private followingLatest = true;
  private readonly positions = new Map<string, ScrollPositionToken>();

  constructor(private readonly adapter: ThreadScrollAdapter) {}

  activateThread(threadId: string): void {
    this.persistActiveThread();
    this.activeThreadId = threadId;

    const saved = this.positions.get(threadId);
    if (saved !== undefined) {
      this.adapter.restorePosition(saved);
      this.followingLatest = this.isInsideFollowZone();
      return;
    }

    this.followingLatest = true;
    this.adapter.scrollToLatest({ behavior: "auto" });
  }

  onUserScroll(): void {
    this.followingLatest = this.isInsideFollowZone();
    this.persistActiveThread();
  }

  onContentAppended(): void {
    if (this.followingLatest) {
      this.adapter.scrollToLatest({ behavior: "auto" });
    }
  }

  /** Keep the disclosure trigger visually stable when activity/diff expands. */
  aroundDisclosure<T>(trigger: HTMLElement, mutate: () => T): T {
    if (this.followingLatest) {
      const result = mutate();
      this.adapter.scrollToLatest({ behavior: "auto" });
      return result;
    }

    const anchor = this.adapter.captureAnchor(trigger);
    const result = mutate();
    this.adapter.restoreAnchor(anchor);
    return result;
  }

  updateComposerHeight(composerHeightPx: number): void {
    this.adapter.setComposerSafeArea(
      Math.max(0, composerHeightPx) + COMPOSER_SAFE_GAP_PX,
    );

    if (this.followingLatest) {
      this.adapter.scrollToLatest({ behavior: "auto" });
    }
  }

  get shouldShowJumpToLatest(): boolean {
    return !this.followingLatest;
  }

  private isInsideFollowZone(): boolean {
    return this.adapter.distanceToLatestPx() <= FOLLOW_LATEST_THRESHOLD_PX;
  }

  private persistActiveThread(): void {
    if (this.activeThreadId !== null) {
      this.positions.set(this.activeThreadId, this.adapter.capturePosition());
    }
  }
}
