export type TargetRef = {
  kind: "turn" | "tool" | "file" | "queue-item";
  id: string;
  label: string;
};

export type RetryContract = {
  target: TargetRef;
  effect: "rerender" | "rerun" | "resend-failed-part";
  impact: string;
};

export type FailedSubsetRetryContract = RetryContract & {
  effect: "resend-failed-part";
  safety: "safe-idempotent";
  failedItemIds: readonly string[];
};

export type ConversationState =
  | { kind: "idle"; draft: string }
  | { kind: "waiting"; turnId: string; submittedAt: number }
  | {
      kind: "working";
      turnId: string;
      activity: string;
      elapsedMs: number;
    }
  | {
      kind: "approval";
      turnId: string;
      requestId: string;
      subject: string;
      reason: string;
      scope: "once" | "conversation";
    }
  | {
      kind: "stopped";
      turnId: string;
      stoppedAt: number;
      preservedQueueCount: number;
    }
  | { kind: "error"; summary: string; retry: RetryContract }
  | {
      kind: "partial-success";
      target: TargetRef;
      succeeded: readonly string[];
      failed: readonly string[];
      /** Only present when the failed subset is addressable and safe to rerun. */
      retry?: FailedSubsetRetryContract;
    }
  | {
      kind: "queue-paused";
      failedItem: TargetRef;
      reason: string;
      remainingCount: number;
    }
  | { kind: "success"; turnId: string; completedAt: number };

export type StateTone = "neutral" | "active" | "warning" | "danger" | "success";

export type StateAction = {
  id:
    | "send"
    | "stop"
    | "allow-once"
    | "deny"
    | "resume"
    | "retry"
    | "review-failures"
    | "retry-failed-part";
  label: string;
  target?: TargetRef;
  impact?: string;
};

export type ConversationPresentation = {
  statusText: string;
  detailText?: string;
  tone: StateTone;
  live: "off" | "polite" | "assertive";
  composerEnabled: boolean;
  primaryAction: StateAction;
  secondaryActions: readonly StateAction[];
};

/**
 * UI signals and actions come from the same discriminated state. Do not keep
 * separate `isLoading`, `hasError`, `needsApproval`, or `canResume` flags.
 */
export function presentConversationState(
  state: ConversationState,
): ConversationPresentation {
  switch (state.kind) {
    case "idle":
      return {
        statusText: "Ready",
        tone: "neutral",
        live: "off",
        composerEnabled: true,
        primaryAction: { id: "send", label: "Send" },
        secondaryActions: [],
      };

    case "waiting":
      return {
        statusText: "Request received",
        detailText: "Waiting for the first meaningful activity",
        tone: "active",
        live: "polite",
        composerEnabled: true,
        primaryAction: { id: "stop", label: "Stop" },
        secondaryActions: [],
      };

    case "working":
      return {
        statusText: state.activity,
        detailText: `Working for ${formatElapsed(state.elapsedMs)}`,
        tone: "active",
        live: "polite",
        composerEnabled: true,
        primaryAction: { id: "stop", label: "Stop" },
        secondaryActions: [],
      };

    case "approval":
      return {
        statusText: "Awaiting approval",
        detailText: `${state.subject}: ${state.reason}`,
        tone: "warning",
        live: "assertive",
        composerEnabled: true,
        primaryAction: { id: "allow-once", label: "Allow once" },
        secondaryActions: [{ id: "deny", label: "Deny" }],
      };

    case "stopped":
      return {
        statusText: "Stopped",
        detailText: `${state.preservedQueueCount} queued item(s) preserved`,
        tone: "neutral",
        live: "polite",
        composerEnabled: true,
        primaryAction: { id: "resume", label: "Resume" },
        secondaryActions: [],
      };

    case "error":
      return {
        statusText: state.summary,
        detailText: state.retry.impact,
        tone: "danger",
        live: "assertive",
        composerEnabled: true,
        primaryAction: retryAction("retry", state.retry),
        secondaryActions: [],
      };

    case "partial-success":
      return {
        statusText: `${state.succeeded.length} succeeded, ${state.failed.length} failed`,
        detailText: state.retry
          ? `Only retry the addressable failures in ${state.target.label}`
          : `Review the failures in ${state.target.label} before choosing a recovery scope`,
        tone: "warning",
        live: "polite",
        composerEnabled: true,
        primaryAction: state.retry
          ? retryAction("retry-failed-part", state.retry)
          : {
              id: "review-failures",
              label: "Review failures",
              target: state.target,
            },
        secondaryActions: [],
      };

    case "queue-paused":
      return {
        statusText: "Queue paused",
        detailText: `${state.reason}; ${state.remainingCount} item(s) remain blocked`,
        tone: "warning",
        live: "assertive",
        composerEnabled: true,
        primaryAction: {
          id: "retry",
          label: "Retry failed item",
          target: state.failedItem,
          impact: "Retry this item before resuming the remaining queue",
        },
        secondaryActions: [],
      };

    case "success":
      return {
        statusText: "Completed",
        tone: "success",
        live: "polite",
        composerEnabled: true,
        primaryAction: { id: "send", label: "Send follow-up" },
        secondaryActions: [],
      };

    default:
      return assertNever(state);
  }
}

function retryAction(
  id: "retry" | "retry-failed-part",
  retry: RetryContract,
): StateAction {
  return {
    id,
    label: retry.effect === "rerender" ? "Try rendering again" : "Retry",
    target: retry.target,
    impact: retry.impact,
  };
}

function formatElapsed(elapsedMs: number): string {
  return `${Math.max(1, Math.round(elapsedMs / 1_000))}s`;
}

function assertNever(value: never): never {
  throw new Error(`Unhandled conversation state: ${JSON.stringify(value)}`);
}
