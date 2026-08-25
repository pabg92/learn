/**
 * lesson-viewer — live browser view for learning sessions.
 *
 * When the user types `learn`, this extension:
 *   - creates a Markdown lesson transcript under <project>/lessons/
 *   - starts a localhost-only HTTP server on a free port
 *   - opens the lesson in the default browser
 *   - mirrors assistant teaching text plus quiz/question Q&A into the lesson
 *
 * Pi remains the interactive surface for answering quizzes and giving short
 * commands. The browser is the comfortable reading surface for long-form
 * teaching content.
 *
 * No external dependencies, no framework, no database.
 *
 * Commands:
 *   /lesson       — open/re-open the current lesson in the browser
 *   /lesson-stop  — stop the local viewer server
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import * as fs from "node:fs";
import * as path from "node:path";
import * as http from "node:http";
import { spawn } from "node:child_process";

const QA_TOOLS = new Set(["quiz", "ask_user_question"]);

function textFromMessage(msg: any): string {
	if (!msg) return "";
	if (typeof msg.content === "string") return msg.content;
	if (!Array.isArray(msg.content)) return "";
	return msg.content
		.filter((c: any) => c.type === "text")
		.map((c: any) => String(c.text || ""))
		.join("\n\n")
		.trim();
}

function stripSkillBlocks(text: string): string {
	return text.replace(
		/<skill\b([^>]*)>[\s\S]*?<\/skill>/g,
		(_match, attrs: string) => {
			const name = /name="([^"]+)"/.exec(attrs)?.[1];
			return `> **Skill loaded:** ${name ?? "unknown"}`;
		},
	);
}

function safeName(date = new Date()): string {
	return date.toISOString().replace(/[:.]/g, "-").replace("T", "_").replace("Z", "");
}

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
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
		if (paragraph.length === 0) return;
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
			} else {
				code.push(line);
			}
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

		if (line.trim() === "") {
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

		// Simple GFM-style table support.
		if (line.includes("|") && i + 1 < lines.length && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1])) {
			flushParagraph();
			closeList();
			const split = (row: string) => row.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
			const headers = split(line);
			i++; // separator
			const rows: string[][] = [];
			while (i + 1 < lines.length && lines[i + 1].includes("|") && lines[i + 1].trim() !== "") {
				rows.push(split(lines[++i]));
			}
			html.push("<div class=\"table-wrap\"><table><thead><tr>" + headers.map((h) => `<th>${inlineMd(h)}</th>`).join("") + "</tr></thead><tbody>" + rows.map((r) => `<tr>${r.map((c) => `<td>${inlineMd(c)}</td>`).join("")}</tr>`).join("") + "</tbody></table></div>");
			continue;
		}

		const quote = /^>\s?(.*)$/.exec(line);
		if (quote) {
			flushParagraph();
			closeList();
			const body: string[] = [quote[1]];
			while (i + 1 < lines.length) {
				const next = /^>\s?(.*)$/.exec(lines[i + 1]);
				if (!next) break;
				body.push(next[1]);
				i++;
			}
			const first = body[0] || "";
			const callout = /^\[!(\w+)\]\s*(.*)$/.exec(first);
			if (callout) {
				const type = callout[1].toLowerCase();
				const title = callout[2] || type;
				html.push(`<aside class="callout ${escapeHtml(type)}"><div class="callout-title">${inlineMd(title)}</div><div>${body.slice(1).map((x) => x ? `<p>${inlineMd(x)}</p>` : "").join("")}</div></aside>`);
			} else {
				html.push(`<blockquote>${body.map((x) => inlineMd(x)).join("<br>")}</blockquote>`);
			}
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

	if (inCode) {
		html.push(`<pre><div class="code-label">${escapeHtml(codeLang || "code")}</div><code>${escapeHtml(code.join("\n"))}</code></pre>`);
	}
	flushParagraph();
	closeList();
	return html.join("\n");
}

function pageHtml(): string {
	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Pi Learning — Live Lesson</title>
<style>
:root{color-scheme:dark;--bg:#0b0d10;--panel:#12161b;--text:#e8edf2;--muted:#9aa6b2;--accent:#68d5c2;--warm:#f3bd55;--border:#26303a;--good:#75d98c;--bad:#ff7f7f;--code:#0a0c0f}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--text);font:17px/1.68 ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
header{position:sticky;top:0;z-index:10;background:rgba(11,13,16,.92);backdrop-filter:blur(12px);border-bottom:1px solid var(--border)}
.header-inner{max-width:980px;margin:auto;padding:14px 26px;display:flex;align-items:center;justify-content:space-between;gap:16px}.brand{font-weight:700}.status{font-size:13px;color:var(--muted)}.dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--good);margin-right:7px}
main{max-width:980px;margin:0 auto;padding:46px 28px 120px}h1,h2,h3,h4{line-height:1.22;margin:1.6em 0 .55em}h1{font-size:2.35rem;margin-top:.2em}h2{font-size:1.65rem;color:var(--warm);padding-top:.2em}h3{font-size:1.25rem;color:#d7e0e8}p{margin:.8em 0}strong{color:#fff}em{color:#c7d0d8}a{color:var(--accent)}
code{font-family:"SFMono-Regular",Consolas,monospace;background:#172027;color:#89e1d2;padding:.12em .34em;border-radius:5px}pre{position:relative;background:var(--code);border:1px solid var(--border);border-radius:12px;padding:36px 18px 18px;overflow:auto;margin:1.25em 0}pre code{background:none;padding:0;color:#e4ebf1}.code-label{position:absolute;top:9px;right:13px;font:12px/1 ui-monospace,monospace;color:var(--muted);text-transform:uppercase;letter-spacing:.06em}
blockquote,.callout{margin:1.2em 0;padding:15px 18px;border-left:3px solid var(--accent);background:var(--panel);border-radius:0 10px 10px 0}.callout-title{font-weight:700;margin-bottom:.35em}.callout.question{border-left-color:#6db7ff}.callout.success{border-left-color:var(--good)}.callout.failure{border-left-color:var(--bad)}.callout.warning{border-left-color:var(--warm)}.callout.quote{border-left-color:#7f8b96}.callout.abstract{border-left-color:var(--accent)}
hr{border:0;border-top:1px solid var(--border);margin:2.2em 0}li{margin:.3em 0}.table-wrap{overflow:auto;margin:1.2em 0}table{width:100%;border-collapse:collapse;background:var(--panel)}th,td{padding:10px 13px;border:1px solid var(--border);text-align:left}th{color:var(--warm)}
.empty{color:var(--muted);padding:40px 0}.footer-note{margin-top:60px;color:var(--muted);font-size:13px}
@media(max-width:650px){body{font-size:16px}main{padding:30px 18px 90px}.header-inner{padding:12px 18px}h1{font-size:2rem}}
</style>
</head>
<body>
<header><div class="header-inner"><div class="brand">π · Live Lesson</div><div class="status"><span class="dot"></span><span id="status">watching</span></div></div></header>
<main><div id="content" class="empty">Waiting for the lesson…</div><div class="footer-note">Answer questions in the Pi terminal. This page updates automatically.</div></main>
<script>
let version="";
async function refresh(){
 try{
  const nearBottom=(window.innerHeight+window.scrollY)>=(document.body.offsetHeight-180);
  const r=await fetch('/api/lesson',{cache:'no-store'}); const d=await r.json();
  if(d.version!==version){
   version=d.version; document.getElementById('content').className=''; document.getElementById('content').innerHTML=d.html||'<div class="empty">Waiting for the lesson…</div>';
   if(nearBottom) window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'});
  }
  document.getElementById('status').textContent='live · '+new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
 }catch(e){document.getElementById('status').textContent='reconnecting…'}
}
refresh(); setInterval(refresh,800);
</script>
</body></html>`;
}

export default function lessonViewer(pi: ExtensionAPI) {
	let lessonFile: string | null = null;
	let server: http.Server | null = null;
	let viewerUrl: string | null = null;
	let browserOpened = false;
	let writeLock: Promise<void> = Promise.resolve();
	const loggedQuizQuestion = new Set<string>();

	function withLock<T>(fn: () => T | Promise<T>): Promise<T> {
		const prev = writeLock;
		let release: () => void;
		writeLock = new Promise<void>((r) => { release = r; });
		return prev.then(fn).finally(() => release!());
	}

	function append(text: string): void {
		if (!lessonFile) return;
		try {
			fs.mkdirSync(path.dirname(lessonFile), { recursive: true });
			const existing = fs.existsSync(lessonFile) ? fs.readFileSync(lessonFile, "utf-8") : "";
			const prefix = existing.trim() ? "\n\n" : "";
			fs.writeFileSync(lessonFile, existing + prefix + text.trim() + "\n", "utf-8");
		} catch {
			// Keep learning even if the viewer file becomes unavailable.
		}
	}

	function newLessonFile(cwd: string): string {
		const dir = path.resolve(cwd, "lessons");
		fs.mkdirSync(dir, { recursive: true });
		return path.join(dir, `lesson-${safeName()}.md`);
	}

	function openBrowser(url: string): void {
		try {
			let child;
			if (process.platform === "darwin") child = spawn("open", [url], { detached: true, stdio: "ignore" });
			else if (process.platform === "win32") child = spawn("cmd", ["/c", "start", "", url], { detached: true, stdio: "ignore" });
			else child = spawn("xdg-open", [url], { detached: true, stdio: "ignore" });
			child.unref();
		} catch {
			// /lesson can still expose the URL via the status/notification.
		}
	}

	async function startServer(ctx: any, open = true): Promise<void> {
		if (server && viewerUrl) {
			if (open) openBrowser(viewerUrl);
			return;
		}
		server = http.createServer((req, res) => {
			if (req.url === "/api/lesson") {
				let markdown = "";
				let version = "0";
				try {
					if (lessonFile && fs.existsSync(lessonFile)) {
						markdown = fs.readFileSync(lessonFile, "utf-8");
						const stat = fs.statSync(lessonFile);
						version = `${stat.mtimeMs}-${stat.size}`;
					}
				} catch {}
				res.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
				res.end(JSON.stringify({ version, html: renderMarkdown(markdown) }));
				return;
			}
			res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
			res.end(pageHtml());
		});
		await new Promise<void>((resolve, reject) => {
			server!.once("error", reject);
			server!.listen(0, "127.0.0.1", () => resolve());
		});
		const address = server.address();
		const port = address && typeof address === "object" ? address.port : 0;
		viewerUrl = `http://127.0.0.1:${port}/`;
		const theme = ctx.ui.theme;
		ctx.ui.setStatus("lesson-viewer", theme.fg("accent", "📖 ") + theme.fg("dim", `lesson :${port}`));
		if (open && !browserOpened) {
			browserOpened = true;
			openBrowser(viewerUrl);
		}
	}

	async function ensureLearningView(ctx: any): Promise<void> {
		if (!lessonFile) {
			lessonFile = newLessonFile(ctx.cwd);
			const started = new Date().toLocaleString();
			fs.writeFileSync(lessonFile, `# Learning Session\n\n> Started ${started}\n`, "utf-8");
			pi.appendEntry("lesson-viewer", { file: lessonFile });
		}
		await startServer(ctx, true);
	}

	function quizQuestion(input: any, displayed?: Array<{ index: number; label: string }>): string {
		const options = displayed && displayed.length
			? displayed.map((o) => `${o.index}. ${o.label}`)
			: (Array.isArray(input.options) ? input.options.map((o: any, i: number) => `${i + 1}. ${o.label}`) : []);
		const body = [`## Check`, "", input.question || ""];
		if (input.details) body.push("", input.details);
		if (options.length) body.push("", ...options);
		return body.join("\n");
	}

	function quizResult(details: any): string {
		if (!details) return "";
		if (details.status === "cancelled") return "> [!warning] Quiz cancelled";
		if (details.status === "unavailable") return `> [!warning] Quiz unavailable\n> ${details.message || ""}`;
		const dontKnow = details.dontKnow === true;
		const correct = details.correct === true;
		const title = dontKnow ? "I don't know" : correct ? "Correct ✓" : "Incorrect ✗";
		const type = dontKnow ? "question" : correct ? "success" : "failure";
		const answers = dontKnow ? "I don't know" : (details.answers || []).map((a: any) => `${a.index}. ${a.label}`).join(", ") || "(none)";
		const correctIndices = (details.correctIndices || []).join(", ");
		const lines = [`> [!${type}] ${title}`, `> Your answer: ${answers}`, `> Correct answer: ${correctIndices}`];
		if (details.note) lines.push(">", ...String(details.note).split("\n").map((x) => `> Note: ${x}`));
		if (details.explanation) lines.push(">", ...String(details.explanation).split("\n").map((x) => `> ${x}`));
		return lines.join("\n");
	}

	pi.on("session_start", async (_event, ctx) => {
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
			const raw = textFromMessage(msg);
			const text = stripSkillBlocks(raw.trim());
			if (/^learn(?:\s|$)/i.test(text)) await ensureLearningView(ctx);
			if (!lessonFile || !text) return;
			await withLock(() => append(`> [!quote] YOU\n> ${text.replace(/\n/g, "\n> ")}`));
			return;
		}

		if (msg.role === "assistant") {
			if (!lessonFile) return;
			const text = textFromMessage(msg);
			if (!text) return;
			await withLock(() => append(text));
		}
	});

	pi.on("tool_call", async (event, _ctx) => {
		if (!lessonFile) return;
		const toolName = (event as any).toolName;
		if (toolName !== "ask_user_question") return;
		const input = (event as any).input || {};
		await withLock(() => append(quizQuestion(input)));
	});

	pi.on("tool_execution_update", async (event, _ctx) => {
		if (!lessonFile) return;
		if ((event as any).toolName !== "quiz") return;
		const id = String((event as any).toolCallId || "");
		if (loggedQuizQuestion.has(id)) return;
		const displayed = (event as any).partialResult?.details?.options as Array<{ index: number; label: string }> | undefined;
		if (!displayed?.length) return;
		loggedQuizQuestion.add(id);
		await withLock(() => append(quizQuestion((event as any).args || {}, displayed)));
	});

	pi.on("tool_result", async (event, _ctx) => {
		if (!lessonFile) return;
		const toolName = (event as any).toolName;
		if (!QA_TOOLS.has(toolName)) return;
		const details = (event as any).details;
		if (toolName === "quiz") {
			await withLock(() => append(quizResult(details)));
			return;
		}
		const answers: any[] = details?.answers || [];
		const text = answers.map((a) => a.label || a.value || "").filter(Boolean).join(", ") || "(no answer)";
		await withLock(() => append(`> [!example] Answer\n> ${text}`));
	});

	pi.registerCommand("lesson", {
		description: "Open the live browser lesson viewer",
		handler: async (_args, ctx: any) => {
			if (!lessonFile) await ensureLearningView(ctx);
			else await startServer(ctx, false);
			if (viewerUrl) {
				openBrowser(viewerUrl);
				ctx.ui.notify(`Lesson: ${viewerUrl}`, "success");
			}
		},
	});

	pi.registerCommand("lesson-stop", {
		description: "Stop the live browser lesson viewer server",
		handler: async (_args, ctx: any) => {
			if (!server) {
				ctx.ui.notify("Lesson viewer is not running", "warning");
				return;
			}
			await new Promise<void>((resolve) => server!.close(() => resolve()));
			server = null;
			viewerUrl = null;
			browserOpened = false;
			ctx.ui.setStatus("lesson-viewer", undefined);
			ctx.ui.notify("Lesson viewer stopped", "info");
		},
	});
}
