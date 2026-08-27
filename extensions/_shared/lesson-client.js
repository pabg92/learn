(() => {
  "use strict";

  let lessonVersion = "";
  let quizVersion = -1;
  let currentQuiz = null;
  let sending = false;
  let progressVersion = "";
  let progressData = null;
  let selectedTrack = "python";

  const $ = (id) => document.getElementById(id);
  const esc = (value) => String(value ?? "").replace(/[&<>\"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const pct = (value) => Math.max(0, Math.min(100, Math.round((Number(value) || 0) * 100)));

  async function api(url, options) {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(await response.text());
    return response.headers.get("content-type")?.includes("json") ? response.json() : response.text();
  }

  function setView(view) {
    const showingProgress = view === "progress";
    $("lesson-view").classList.toggle("hidden", showingProgress);
    $("progress-view").classList.toggle("hidden", !showingProgress);
    $("nav-lesson").classList.toggle("active", !showingProgress);
    $("nav-progress").classList.toggle("active", showingProgress);
  }

  function renderQuiz(quiz) {
    const root = $("quiz");
    const ask = $("ask");
    const hint = $("hint");

    if (!quiz) {
      root.classList.add("hidden");
      ask.classList.remove("hidden");
      hint.textContent = "Your message goes into the same Pi session; replies appear above automatically.";
      return;
    }

    ask.classList.add("hidden");
    root.classList.remove("hidden");
    const inputType = quiz.mode === "multi-select" ? "checkbox" : "radio";
    const options = quiz.options.map((option) => `
      <label class="option">
        <input type="${inputType}" name="quiz-option" value="${esc(option.value)}">
        <span><strong>${option.index}. ${esc(option.label)}</strong>${option.description ? `<small>${esc(option.description)}</small>` : ""}</span>
      </label>`).join("");

    root.innerHTML = `
      <div class="quiz-card">
        <div class="quiz-title">${esc(quiz.question)}</div>
        ${quiz.details ? `<div class="quiz-details">${esc(quiz.details)}</div>` : ""}
        <div class="options">
          ${options}
          <label class="option">
            <input type="${inputType}" name="quiz-option" value="__dont_know__">
            <span><strong>I don't know</strong><small>Use this instead of guessing.</small></span>
          </label>
        </div>
        <textarea id="quiz-note" placeholder="Optional note: explain your thinking, uncertainty, or why you chose this…"></textarea>
        <div class="row quiz-actions"><button class="primary" id="submit-quiz">Submit answer</button><button id="terminal-quiz">Use terminal instead</button></div>
      </div>`;

    $("submit-quiz").onclick = () => submitQuiz(false);
    $("terminal-quiz").onclick = () => submitQuiz(true);
    hint.textContent = "Answer here; Pi will grade it and continue the same lesson. Terminal remains available as fallback.";
  }

  async function submitQuiz(useTerminal) {
    if (!currentQuiz) return;
    const values = [...document.querySelectorAll("#quiz input:checked")].map((input) => input.value);
    const dontKnow = values.includes("__dont_know__");
    if (!useTerminal && !dontKnow && values.length === 0) {
      alert("Choose an answer, or select I don't know.");
      return;
    }
    const selectedValues = dontKnow ? [] : values.filter((value) => value !== "__dont_know__");
    const note = $("quiz-note")?.value || "";
    try {
      await api("/api/quiz", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ quizId: currentQuiz.id, selectedValues, dontKnow, note, useTerminal }),
      });
    } catch (error) {
      alert(`Could not submit answer: ${error.message}`);
    }
  }

  async function sendMessage() {
    const box = $("message");
    const message = box.value.trim();
    if (!message || sending) return;
    sending = true;
    $("send").disabled = true;
    try {
      await api("/api/message", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message }),
      });
      box.value = "";
    } catch (error) {
      alert(`Could not send message: ${error.message}`);
    } finally {
      sending = false;
      $("send").disabled = false;
    }
  }

  const stageText = (stage) => stage === "not-assessed" ? "not assessed" : stage;

  function renderProgress(data, progressError) {
    progressData = data;
    const root = $("progress");

    if (progressError) {
      root.innerHTML = `<div class="empty-progress"><strong>Progress map unavailable</strong><br>${esc(progressError)}<br><span class="muted">The lesson remains usable; only the progress view is affected.</span></div>`;
      return;
    }
    if (!data || !Array.isArray(data.tracks) || data.tracks.length === 0) {
      root.innerHTML = '<div class="empty-progress">No curriculum progress data is available yet.</div>';
      return;
    }

    if (!data.tracks.some((track) => track.id === selectedTrack)) selectedTrack = data.tracks[0].id;
    const current = data.current || {};
    const track = data.tracks.find((item) => item.id === selectedTrack) || data.tracks[0];

    const cards = data.tracks.map((item) => `
      <button class="track-card ${item.id === selectedTrack ? "active" : ""}" data-track="${esc(item.id)}">
        <div class="track-title">${esc(item.title)}</div>
        <div class="track-meta"><span>${pct(item.progress)}% evidence progress</span><span>${item.mastered} mastered</span></div>
        <div class="bar"><span style="width:${pct(item.progress)}%"></span></div>
      </button>`).join("");

    const nodes = track.nodes.map((node) => `
      <div class="node-card">
        <div class="node-head">
          <div class="node-id">${esc(node.id)}</div>
          <div class="node-title">${esc(node.title)}</div>
          <div class="bar node-bar"><span style="width:${pct(node.progress)}%"></span></div>
          <div class="node-pct">${pct(node.progress)}%</div>
        </div>
        <div class="topics">${node.topics.map((topic) => `
          <div class="topic-row">
            <div class="topic-name">${esc(topic.topic)}</div>
            <span class="pill ${esc(topic.stage)} ${esc(topic.status)}">${esc(stageText(topic.stage))}</span>
            <div class="topic-status">${esc(topic.status)}</div>
          </div>`).join("")}</div>
      </div>`).join("");

    const active = `
      <div class="current-card">
        <div class="current-label">Current</div>
        <div class="current-topic">${esc(current.topic || current.node || "No active checkpoint")}</div>
        <div class="muted">${esc([current.track, current.node, current.assessment].filter(Boolean).join(" · "))}</div>
        ${current.nextAction ? `<div class="current-next">Next: ${esc(current.nextAction)}</div>` : ""}
      </div>`;

    root.innerHTML = `
      <div class="progress-head"><div><h1>Living Learning Map</h1><div class="muted">Derived from curriculum + learner state + evidence. Reading a lesson does not increase progress.</div></div>${active}</div>
      <div class="track-grid">${cards}</div>
      <div class="detail-head"><div><h2>${esc(track.title)}</h2><div class="stats"><span>${track.mastered} mastered</span><span>${track.practising} practising</span><span>${track.reviewDue} review due</span><span>${track.notAssessed} not assessed</span><span>${data.evidenceCount} evidence files</span></div></div><div class="detail-pct">${pct(track.progress)}%</div></div>
      ${nodes}`;

    root.querySelectorAll("[data-track]").forEach((element) => {
      element.onclick = () => {
        selectedTrack = element.getAttribute("data-track");
        renderProgress(progressData, null);
      };
    });
  }

  async function refresh() {
    try {
      const nearBottom = innerHeight + scrollY >= document.body.offsetHeight - 240;
      const data = await api("/api/state", { cache: "no-store" });

      if (data.lessonVersion !== lessonVersion) {
        lessonVersion = data.lessonVersion;
        $("lesson").innerHTML = data.html || "<p>Waiting for the lesson…</p>";
        if (nearBottom) scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      }
      if (data.quizVersion !== quizVersion) {
        quizVersion = data.quizVersion;
        currentQuiz = data.quiz;
        renderQuiz(currentQuiz);
      }
      const incomingProgressVersion = data.progress?.version || `error:${data.progressError || "none"}`;
      if (incomingProgressVersion !== progressVersion) {
        progressVersion = incomingProgressVersion;
        renderProgress(data.progress, data.progressError);
      }
      $("status").textContent = `live · ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    } catch (error) {
      $("status").textContent = `reconnecting… ${error.message || ""}`;
    }
  }

  window.addEventListener("DOMContentLoaded", () => {
    $("nav-lesson").onclick = () => setView("lesson");
    $("nav-progress").onclick = () => setView("progress");
    $("send").onclick = sendMessage;
    $("message").addEventListener("keydown", (event) => {
      if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        sendMessage();
      }
    });
    refresh();
    setInterval(refresh, 600);
  });
})();
