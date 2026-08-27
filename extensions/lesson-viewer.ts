/**
 * lesson-viewer — browser-first UI for learning sessions.
 *
 * Pi remains the tutor/runtime. The browser is the primary reading, quiz and
 * feedback surface. Client JS/CSS live in _shared files so browser code is not
 * nested inside a TypeScript template string.
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import * as fs from "node:fs";
import * as path from "node:path";
import * as http from "node:http";
import { spawn } from "node:child_process";
import { getLearningBridge } from "./_shared/learning-bridge.ts";
import { buildProgressMap } from "./_shared/progress-map.ts";

const QA_TOOLS = new Set(["quiz", "ask_user_question"]);

function textFromMessage(msg: any): string {
  if (!msg) return "";
  if (typeof msg.content === "string") return msg.content;
  if (!Array.isArray(msg.content)) return "";
  return msg.content.filter((c: any) => c.type === "text").map((c: any) => String(c.text || "")).join("\n\n").trim();
}

function stripSkillBlocks(text: string): string {
  return text.replace(/<skill\b([^>]*)>[\s\S]*?<\/skill>/g, (_match, attrs: string) => {
    const name = /name="([^"]+)"/.exec(attrs)?.[1];
    return `> **Skill loaded:** ${name ?? "unknown"}`;
  });
}

function safeName(date = new Date()): string {
  return date.toISOString().replace(/[:.]/g, "-").replace("T", "_").replace("Z", "");
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function inlineMd(value: string): string {
  let out = escapeHtml(value);
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
  return out;
}

function renderMarkdown(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let inCode = false;
  let codeLang = "";
  let code: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    html.push(`<p>${inlineMd(paragraph.join(" "))}</p>`);
    paragraph = [];
  };
  const closeList = () => {
    if (!listType) return;
    html.push(`</${listType}>`);
    listType = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (inCode) {
      if (/^```/.test(line)) {
        html.push(`<pre><div class="code-label">${escapeHtml(codeLang || "code")}</div><code>${escapeHtml(code.join("\n"))}</code></pre>`);
        inCode = false;
        codeLang = "";
        code = [];
      } else code.push(line);
      continue;
    }

    const fence = /^```\s*([\w+-]*)/.exec(line);
    if (fence) {
      flushParagraph();
      closeList();
      inCode = true;
      codeLang = fence[1] || "";
      continue;
    }
    if (!line.trim()) {
      flushParagraph();
      closeList();
      continue;
    }
    if (/^---+$/.test(line.trim())) {
      flushParagraph();
      closeList();
      html.push("<hr>");
      continue;
    }

    const heading = /^(#{1,6})\s+(.+)$/.exec(line);
    if (heading) {
      flushParagraph();
      closeList();
      const level = heading[1].length;
      html.push(`<h${level}>${inlineMd(heading[2])}</h${level}>`);
      continue;
    }

    if (line.includes("|") && i + 1 < lines.length && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1])) {
      flushParagraph();
      closeList();
      const split = (row: string) => row.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
      const headers = split(line);
      i++;
      const rows: string[][] = [];
      while (i + 1 < lines.length && lines[i + 1].includes("|") && lines[i + 1].trim()) rows.push(split(lines[++i]));
      html.push("<div class=\"table-wrap\"><table><thead><tr>" + headers.map((h) => `<th>${inlineMd(h)}</th>`).join("") + "</tr></thead><tbody>" + rows.map((r) => `<tr>${r.map((c) => `<td>${inlineMd(c)}</td>`).join("")}</tr>`).join("") + "</tbody></table></div>");
      continue;
    }

    const quote = /^>\s?(.*)$/.exec(line);
    if (quote) {
      flushParagraph();
      closeList();
      const body = [quote[1]];
      while (i + 1 < lines.length) {
        const next = /^>\s?(.*)$/.exec(lines[i + 1]);
        if (!next) break;
        body.push(next[1]);
        i++;
      }
      const callout = /^\[!(\w+)\]\s*(.*)$/.exec(body[0] || "");
      if (callout) html.push(`<aside class="callout ${escapeHtml(callout[1].toLowerCase())}"><div class="callout-title">${inlineMd(callout[2] || callout[1])}</div><div>${body.slice(1).map((x) => x ? `<p>${inlineMd(x)}</p>` : "").join("")}</div></aside>`);
      else html.push(`<blockquote>${body.map((x) => inlineMd(x)).join("<br>")}</blockquote>`);
      continue;
    }

    const ul = /^\s*[-*]\s+(.+)$/.exec(line);
    if (ul) {
      flushParagraph();
      if (listType !== "ul") {
        closeList();
        listType = "ul";
        html.push("<ul>");
      }
      html.push(`<li>${inlineMd(ul[1])}</li>`);
      continue;
    }

    const ol = /^\s*\d+[.)]\s+(.+)$/.exec(line);
    if (ol) {
      flushParagraph();
      if (listType !== "ol") {
        closeList();
        listType = "ol";
        html.push("<ol>");
      }
      html.push(`<li>${inlineMd(ol[1])}</li>`);
      continue;
    }

    paragraph.push(line.trim());
  }

  if (inCode) html.push(`<pre><div class="code-label">${escapeHtml(codeLang || "code")}</div><code>${escapeHtml(code.join("\n"))}</code></pre>`);
  flushParagraph();
  closeList();
  return html.join("\n");
}

function pageHtml(): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Pi Learning</title>
<link rel="stylesheet" href="/style.css">
</head>
<body>
<header><div class="header-inner"><div class="brand">π · Learning Environment</div><div class="nav"><button id="nav-lesson" class="active">Lesson</button><button id="nav-progress">Progress</button></div><div class="status"><span class="dot"></span><span id="status">connecting…</span></div></div></header>
<main><section id="lesson-view"><div id="lesson">Waiting for the lesson…</div></section><section id="progress-view" class="hidden"><div id="progress">Loading progress…</div></section></main>
<div id="interaction"><div class="interaction-inner"><div id="quiz" class="hidden"></div><div id="ask" class="ask-wrap"><textarea id="message" placeholder="Ask Pi a question or add a comment…"></textarea><button id="send" class="primary">Send to Pi</button></div><div id="hint" class="hint">Your message goes into the same Pi session; replies appear above automatically.</div></div></div>
<script src="/app.js"></script>
</body>
</html>`;
}

async function readJson(req: http.IncomingMessage): Promise<any> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  const body = Buffer.concat(chunks).toString("utf-8");
  if (!body) return {};
  if (body.length > 64_000) throw new Error("Request too large");
  return JSON.parse(body);
}

export default function lessonViewer(pi: ExtensionAPI) {
  const bridge = getLearningBridge();
  let lessonFile: string | null = null;
  let server: http.Server | null = null;
  let viewerUrl: string | null = null;
  let browserOpened = false;
  let writeLock: Promise<void> = Promise.resolve();
  const loggedQuizQuestion = new Set<string>();

  const asset = (cwd: string, name: string) => path.resolve(cwd, `.pi/extensions/_shared/${name}`);

  function withLock<T>(fn: () => T | Promise<T>): Promise<T> {
    const prev = writeLock;
    let release: () => void;
    writeLock = new Promise<void>((resolve) => { release = resolve; });
    return prev.then(fn).finally(() => release!());
  }

  function append(text: string): void {
    if (!lessonFile) return;
    try {
      fs.mkdirSync(path.dirname(lessonFile), { recursive: true });
      const existing = fs.existsSync(lessonFile) ? fs.readFileSync(lessonFile, "utf-8") : "";
      fs.writeFileSync(lessonFile, existing + (existing.trim() ? "\n\n" : "") + text.trim() + "\n", "utf-8");
    } catch {}
  }

  function newLessonFile(cwd: string): string {
    const dir = path.resolve(cwd, "lessons");
    fs.mkdirSync(dir, { recursive: true });
    return path.join(dir, `lesson-${safeName()}.md`);
  }

  function openBrowser(url: string): void {
    try {
      const child = process.platform === "darwin"
        ? spawn("open", [url], { detached: true, stdio: "ignore" })
        : process.platform === "win32"
          ? spawn("cmd", ["/c", "start", "", url], { detached: true, stdio: "ignore" })
          : spawn("xdg-open", [url], { detached: true, stdio: "ignore" });
      child.unref();
    } catch {}
  }

  async function ensureLesson(cwd: string) {
    if (lessonFile) return;
    lessonFile = newLessonFile(cwd);
    fs.writeFileSync(lessonFile, `# Learning Session\n\n> Started ${new Date().toLocaleString()}\n`, "utf-8");
    pi.appendEntry("lesson-viewer", { file: lessonFile });
  }

  async function startServer(ctx: any, open = true) {
    await ensureLesson(ctx.cwd);
    if (!server) {
      server = http.createServer(async (req, res) => {
        try {
          if (req.method === "GET" && req.url === "/app.js") {
            res.writeHead(200, { "content-type": "application/javascript; charset=utf-8", "cache-control": "no-store" });
            res.end(fs.readFileSync(asset(ctx.cwd, "lesson-client.js"), "utf-8"));
            return;
          }
          if (req.method === "GET" && req.url === "/style.css") {
            res.writeHead(200, { "content-type": "text/css; charset=utf-8", "cache-control": "no-store" });
            res.end(fs.readFileSync(asset(ctx.cwd, "lesson-style.css"), "utf-8"));
            return;
          }
          if (req.method === "GET" && req.url === "/api/state") {
            bridge.browserLastSeenAt = Date.now();
            let markdown = "";
            let lessonVersion = "0";
            if (lessonFile && fs.existsSync(lessonFile)) {
              markdown = fs.readFileSync(lessonFile, "utf-8");
              const stat = fs.statSync(lessonFile);
              lessonVersion = `${stat.mtimeMs}-${stat.size}`;
            }

            let progress: any = null;
            let progressError: string | null = null;
            try {
              progress = buildProgressMap(ctx.cwd);
            } catch (error) {
              progressError = (error as Error).message || String(error);
            }

            res.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
            res.end(JSON.stringify({ lessonVersion, html: renderMarkdown(markdown), quizVersion: bridge.quizVersion, quiz: bridge.currentQuiz, progress, progressError }));
            return;
          }
          if (req.method === "POST" && req.url === "/api/quiz") {
            const body = await readJson(req);
            const ok = bridge.resolveQuiz(String(body.quizId || ""), {
              selectedValues: Array.isArray(body.selectedValues) ? body.selectedValues.map(String) : [],
              dontKnow: body.dontKnow === true,
              note: typeof body.note === "string" ? body.note : undefined,
              useTerminal: body.useTerminal === true,
            });
            res.writeHead(ok ? 200 : 409, { "content-type": "application/json; charset=utf-8" });
            res.end(JSON.stringify({ ok }));
            return;
          }
          if (req.method === "POST" && req.url === "/api/message") {
            const body = await readJson(req);
            const message = typeof body.message === "string" ? body.message.trim() : "";
            if (!message) {
              res.writeHead(400);
              res.end("Message required");
              return;
            }
            await pi.sendUserMessage(message, { deliverAs: "followUp" });
            res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
            res.end(JSON.stringify({ ok: true }));
            return;
          }

          res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
          res.end(pageHtml());
        } catch (error) {
          res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
          res.end((error as Error).message);
        }
      });

      await new Promise<void>((resolve, reject) => {
        server!.once("error", reject);
        server!.listen(0, "127.0.0.1", () => resolve());
      });
      const address = server.address();
      const port = address && typeof address === "object" ? address.port : 0;
      viewerUrl = `http://127.0.0.1:${port}/`;
      bridge.viewerActive = true;
      ctx.ui.setStatus("lesson-viewer", ctx.ui.theme.fg("accent", "📖 ") + ctx.ui.theme.fg("dim", `lesson :${port}`));
    }

    if (open && viewerUrl && !browserOpened) {
      browserOpened = true;
      openBrowser(viewerUrl);
    }
  }

  pi.on("session_start", async (_event, ctx: any) => {
    let restored: { file?: string | null } | undefined;
    for (const entry of ctx.sessionManager.getEntries()) {
      if (entry.type === "custom" && entry.customType === "lesson-viewer") restored = entry.data as any;
    }
    if (restored?.file && fs.existsSync(restored.file)) {
      lessonFile = restored.file;
      await startServer(ctx, true);
    }
  });

  pi.on("message_end", async (event, ctx: any) => {
    const msg = event.message;
    if (!msg || !("role" in msg)) return;
    if (msg.role === "user") {
      const text = stripSkillBlocks(textFromMessage(msg).trim());
      if (/^learn(?:\s|$)/i.test(text)) await startServer(ctx, true);
      if (lessonFile && text) await withLock(() => append(`> [!quote] YOU\n> ${text.replace(/\n/g, "\n> ")}`));
      return;
    }
    if (msg.role === "assistant" && lessonFile) {
      const text = textFromMessage(msg);
      if (text) await withLock(() => append(text));
    }
  });

  pi.on("tool_call", async (event, _ctx) => {
    if (!lessonFile || (event as any).toolName !== "ask_user_question") return;
    const input = (event as any).input || {};
    const options = Array.isArray(input.options) ? input.options.map((o: any, i: number) => `${i + 1}. ${o.label}`) : [];
    await withLock(() => append(["## Question", "", input.question || "", input.details || "", ...options].filter(Boolean).join("\n")));
  });

  pi.on("tool_execution_update", async (event, _ctx) => {
    if (!lessonFile || (event as any).toolName !== "quiz") return;
    const id = String((event as any).toolCallId || "");
    if (loggedQuizQuestion.has(id)) return;
    const displayed = (event as any).partialResult?.details?.options as Array<{ index: number; label: string }> | undefined;
    if (!displayed?.length) return;
    loggedQuizQuestion.add(id);
    const input = (event as any).args || {};
    await withLock(() => append(["## Check", "", input.question || "", input.details || "", ...displayed.map((o) => `${o.index}. ${o.label}`)].filter(Boolean).join("\n")));
  });

  pi.on("tool_result", async (event, _ctx) => {
    if (!lessonFile || !QA_TOOLS.has((event as any).toolName)) return;
    const details = (event as any).details;
    if ((event as any).toolName === "quiz") {
      const title = details?.dontKnow ? "I don't know" : details?.correct ? "Correct ✓" : "Incorrect ✗";
      const type = details?.dontKnow ? "question" : details?.correct ? "success" : "failure";
      const answers = details?.dontKnow ? "I don't know" : (details?.answers || []).map((a: any) => `${a.index}. ${a.label}`).join(", ") || "(none)";
      const lines = [`> [!${type}] ${title}`, `> Your answer: ${answers}`];
      if (details?.note) lines.push(">", `> Note: ${details.note}`);
      if (details?.explanation) lines.push(">", ...String(details.explanation).split("\n").map((x) => `> ${x}`));
      await withLock(() => append(lines.join("\n")));
      return;
    }
    const answers: any[] = details?.answers || [];
    await withLock(() => append(`> [!example] Answer\n> ${answers.map((a) => a.label || a.value || "").filter(Boolean).join(", ") || "(no answer)"}`));
  });

  pi.registerCommand("lesson", {
    description: "Open the browser learning environment",
    handler: async (_args, ctx: any) => {
      await startServer(ctx, false);
      if (viewerUrl) {
        openBrowser(viewerUrl);
        ctx.ui.notify(`Lesson: ${viewerUrl}`, "success");
      }
    },
  });

  pi.registerCommand("lesson-stop", {
    description: "Stop the browser learning environment",
    handler: async (_args, ctx: any) => {
      if (!server) {
        ctx.ui.notify("Lesson viewer is not running", "warning");
        return;
      }
      await new Promise<void>((resolve) => server!.close(() => resolve()));
      server = null;
      viewerUrl = null;
      browserOpened = false;
      bridge.viewerActive = false;
      if (bridge.currentQuiz) bridge.cancelQuiz(bridge.currentQuiz.id);
      ctx.ui.setStatus("lesson-viewer", undefined);
      ctx.ui.notify("Lesson viewer stopped", "info");
    },
  });
}
