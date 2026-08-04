(() => {
  const titles = {
    working: "Working and activity",
    approval: "Approval request",
    recovery: "Stop, errors and queue",
    tools: "Contextual tool workspace",
  };

  const viewButtons = Array.from(document.querySelectorAll("[data-view-button]"));
  const panels = Array.from(document.querySelectorAll("[data-panel]"));
  const title = document.querySelector("#view-title");
  const composerStatus = document.querySelector("#composer-status");
  const composerInput = document.querySelector("#composer-input");
  const recoveryButtons = Array.from(document.querySelectorAll("[data-recovery-button]"));
  const recoveryPanels = Array.from(document.querySelectorAll("[data-recovery-panel]"));
  const toolPanels = Array.from(document.querySelectorAll("[data-tool-panel]"));
  const toolToggle = document.querySelector("[data-toggle-tools]");
  let lastConversationView = "working";
  let toolWorkspaceTrigger = toolToggle;
  let lastToolLauncherTrigger = document.querySelector('[data-tool-open="files"]');

  function setView(requestedView, updateUrl = true) {
    const view = Object.hasOwn(titles, requestedView) ? requestedView : "working";
    document.body.dataset.view = view;
    title.textContent = titles[view];
    composerStatus.textContent = "";

    if (view !== "tools") {
      lastConversationView = view;
    }

    for (const button of viewButtons) {
      button.setAttribute("aria-pressed", String(button.dataset.viewButton === view));
    }

    for (const panel of panels) {
      panel.hidden = panel.dataset.panel !== view;
    }

    if (updateUrl) {
      const url = new URL(window.location.href);
      url.searchParams.set("view", view);
      window.history.replaceState(null, "", url);
    }
  }

  for (const button of viewButtons) {
    button.addEventListener("click", (event) => {
      if (button.dataset.viewButton === "tools") {
        openToolWorkspace(event.currentTarget);
        return;
      }

      setView(button.dataset.viewButton);
    });
  }

  document.querySelector("[data-show-tools]").addEventListener("click", (event) => {
    openToolWorkspace(event.currentTarget);
  });

  toolToggle.addEventListener("click", () => {
    if (document.body.dataset.view === "tools") {
      closeToolWorkspace();
      return;
    }

    openToolWorkspace(toolToggle);
  });

  function focusToolEntry(state = document.body.dataset.toolState) {
    const panel = toolPanels.find((candidate) => candidate.dataset.toolPanel === state);
    const target = state === "launcher"
      ? panel?.querySelector(".tool-launcher-button")
      : panel?.querySelector("[data-tool-initial-focus]");
    target?.focus();
  }

  function openToolWorkspace(trigger) {
    toolWorkspaceTrigger = trigger;
    setView("tools");
    focusToolEntry();
  }

  function closeToolWorkspace() {
    setView(lastConversationView);
    const target = toolWorkspaceTrigger?.isConnected ? toolWorkspaceTrigger : toolToggle;
    target.focus();
  }

  function setToolState(requestedState, updateUrl = true) {
    const state = toolPanels.some((panel) => panel.dataset.toolPanel === requestedState)
      ? requestedState
      : "launcher";
    document.body.dataset.toolState = state;

    for (const panel of toolPanels) {
      panel.hidden = panel.dataset.toolPanel !== state;
    }

    if (updateUrl) {
      const url = new URL(window.location.href);
      url.searchParams.set("tool", state);
      window.history.replaceState(null, "", url);
    }
  }

  for (const button of document.querySelectorAll("[data-tool-open]")) {
    button.addEventListener("click", () => {
      const nextState = button.dataset.toolOpen;
      if (nextState === "launcher") {
        setToolState(nextState);
        lastToolLauncherTrigger?.focus();
        return;
      }

      lastToolLauncherTrigger = button;
      setToolState(nextState);
      focusToolEntry(nextState);
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || event.defaultPrevented || document.body.dataset.view !== "tools") {
      return;
    }

    event.preventDefault();
    if (document.body.dataset.toolState !== "launcher") {
      setToolState("launcher");
      lastToolLauncherTrigger?.focus();
      return;
    }

    closeToolWorkspace();
  });

  function setRecoveryState(requestedState, updateUrl = true) {
    const state = recoveryButtons.some((button) => button.dataset.recoveryButton === requestedState)
      ? requestedState
      : "queue";
    document.body.dataset.recoveryState = state;

    for (const button of recoveryButtons) {
      button.setAttribute("aria-selected", String(button.dataset.recoveryButton === state));
    }

    for (const panel of recoveryPanels) {
      panel.hidden = panel.dataset.recoveryPanel !== state;
    }

    if (updateUrl) {
      const url = new URL(window.location.href);
      url.searchParams.set("state", state);
      window.history.replaceState(null, "", url);
    }
  }

  for (const button of recoveryButtons) {
    button.addEventListener("click", () => setRecoveryState(button.dataset.recoveryButton));
  }

  const activityTrigger = document.querySelector("[data-activity-trigger]");
  const activityDetails = document.querySelector("[data-activity-details]");
  activityTrigger.addEventListener("click", () => {
    const expanded = activityTrigger.getAttribute("aria-expanded") === "true";
    activityTrigger.setAttribute("aria-expanded", String(!expanded));
    activityTrigger.querySelector(".chevron").textContent = expanded ? "⌄" : "⌃";
    activityDetails.hidden = expanded;
  });

  document.querySelector("[data-copy-command]").addEventListener("click", (event) => {
    event.currentTarget.textContent = "Copied";
    composerStatus.textContent = "Command copied";
  });

  document.querySelector('[data-composer-action="working"]').addEventListener("click", () => {
    setRecoveryState("stopped");
    setView("recovery");
    composerStatus.textContent = "Stopped; current output and queue were preserved";
  });

  document.querySelector('[data-composer-action="recovery-stopped"]').addEventListener("click", () => {
    setView("working");
    composerStatus.textContent = "Resumed from the preserved state";
  });

  document.querySelector("[data-approval-allow]").addEventListener("click", () => {
    setView("working");
    composerStatus.textContent = "Allowed once; validation resumed";
  });

  document.querySelector("[data-approval-deny]").addEventListener("click", () => {
    setView("working");
    composerStatus.textContent = "Command denied; work resumed without changing permission";
  });

  document.querySelector("[data-review-partial]").addEventListener("click", () => {
    composerStatus.textContent = "Review the failed object before choosing a safe retry scope";
  });

  document.querySelector("[data-render-retry]").addEventListener("click", (event) => {
    event.currentTarget.textContent = "Rendering";
    event.currentTarget.disabled = true;
    composerStatus.textContent = "Only the failed UI boundary will render again";
  });

  document.querySelector("[data-queue-retry]").addEventListener("click", (event) => {
    const item = event.currentTarget.closest("[data-queue-item]");
    item.querySelector("strong").textContent = "Retrying this queued message";
    event.currentTarget.disabled = true;
    composerStatus.textContent = "Later queued messages remain blocked until this retry succeeds";
  });

  document.querySelector("[data-queue-edit]").addEventListener("click", () => {
    composerInput.value = "补充失败队列项的可访问性测试";
    composerInput.focus();
    composerStatus.textContent = "Editing the failed item in place";
  });

  document.querySelector("[data-queue-delete]").addEventListener("click", (event) => {
    event.currentTarget.closest("[data-queue-item]").remove();
    composerStatus.textContent = "Failed item deleted; focus should move to the next queue item";
  });

  const initialUrl = new URL(window.location.href);
  const initialView = initialUrl.searchParams.get("view");
  setRecoveryState(initialUrl.searchParams.get("state"), false);
  setToolState(initialUrl.searchParams.get("tool"), false);
  setView(initialView, false);
})();
