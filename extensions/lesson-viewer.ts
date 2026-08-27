/**
 * lesson-viewer — browser-first UI for learning sessions.
 *
 * Pi remains the tutor/runtime. This extension provides a localhost-only web UI
 * for reading lessons, answering quizzes, sending comments/questions back into
 * the active Pi conversation, and viewing an evidence-driven curriculum map.
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
			const n = heading[1].length;
			html.push(`<h${n}>${inlineMd(heading[2])}</h${n}>`);
			continue;
		}
		if (line.includes("|") && i + 1 < lines.length && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1])) {
			flushParagraph();
			closeList();
			const split = (row: string) => row.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
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
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Pi Learning</title>
<style>
:root{color-scheme:dark;--bg:#0b0d10;--panel:#12161b;--panel2:#171c22;--text:#e8edf2;--muted:#9aa6b2;--accent:#68d5c2;--warm:#f3bd55;--border:#26303a;--good:#75d98c;--bad:#ff7f7f;--blue:#6db7ff;--code:#0a0c0f}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--text);font:17px/1.68 ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}button,input,textarea{font:inherit}
header{position:sticky;top:0;z-index:20;background:rgba(11,13,16,.94);backdrop-filter:blur(12px);border-bottom:1px solid var(--border)}.header-inner{max-width:1120px;margin:auto;padding:12px 26px;display:flex;align-items:center;gap:18px}.brand{font-weight:750;white-space:nowrap}.nav{display:flex;gap:6px}.nav button{padding:6px 11px;background:transparent}.nav button.active{background:var(--panel2);border-color:#435160}.status{font-size:13px;color:var(--muted);margin-left:auto}.dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--good);margin-right:7px}
main{max-width:1120px;margin:auto;padding:40px 28px 180px}#lesson-view{max-width:900px}h1,h2,h3,h4{line-height:1.22;margin:1.6em 0 .55em}h1{font-size:2.35rem;margin-top:.2em}h2{font-size:1.65rem;color:var(--warm)}h3{font-size:1.25rem;color:#d7e0e8}p{margin:.8em 0}strong{color:#fff}a{color:var(--accent)}code{font-family:"SFMono-Regular",Consolas,monospace;background:#172027;color:#89e1d2;padding:.12em .34em;border-radius:5px}pre{position:relative;background:var(--code);border:1px solid var(--border);border-radius:12px;padding:36px 18px 18px;overflow:auto;margin:1.25em 0}pre code{background:none;padding:0;color:#e4ebf1}.code-label{position:absolute;top:9px;right:13px;font:12px/1 ui-monospace,monospace;color:var(--muted);text-transform:uppercase;letter-spacing:.06em}
blockquote,.callout{margin:1.2em 0;padding:15px 18px;border-left:3px solid var(--accent);background:var(--panel);border-radius:0 10px 10px 0}.callout-title{font-weight:700}.callout.question{border-left-color:var(--blue)}.callout.success{border-left-color:var(--good)}.callout.failure{border-left-color:var(--bad)}.callout.warning{border-left-color:var(--warm)}hr{border:0;border-top:1px solid var(--border);margin:2.2em 0}.table-wrap{overflow:auto}table{width:100%;border-collapse:collapse;background:var(--panel)}th,td{padding:10px 13px;border:1px solid var(--border);text-align:left}th{color:var(--warm)}
#progress-view{max-width:1060px}.progress-head{display:flex;justify-content:space-between;gap:24px;align-items:flex-start;margin-bottom:24px}.progress-head h1{margin:0 0 4px}.muted{color:var(--muted)}.current-card{background:var(--panel);border:1px solid var(--border);border-radius:14px;padding:16px 18px;min-width:300px}.current-label{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--accent);font-weight:750}.current-topic{font-size:18px;font-weight:700}.current-next{font-size:13px;color:var(--muted);margin-top:6px}.track-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(235px,1fr));gap:10px;margin:18px 0 30px}.track-card{text-align:left;background:var(--panel);border:1px solid var(--border);border-radius:12px;padding:14px;cursor:pointer;color:var(--text)}.track-card.active{border-color:var(--accent);box-shadow:0 0 0 1px rgba(104,213,194,.15)}.track-title{font-weight:720}.track-meta{display:flex;justify-content:space-between;color:var(--muted);font-size:13px;margin-top:4px}.bar{height:9px;background:#222a32;border-radius:99px;overflow:hidden;margin-top:10px}.bar>span{display:block;height:100%;background:var(--accent);border-radius:99px}.detail-head{display:flex;align-items:end;justify-content:space-between;gap:18px;margin:24px 0 12px}.detail-head h2{margin:0;color:var(--text)}.detail-pct{font-size:28px;font-weight:760}.stats{display:flex;gap:14px;flex-wrap:wrap;color:var(--muted);font-size:13px}.node-card{background:var(--panel);border:1px solid var(--border);border-radius:12px;margin:10px 0;overflow:hidden}.node-head{padding:13px 15px;display:flex;gap:14px;align-items:center;border-bottom:1px solid var(--border)}.node-id{font:700 13px ui-monospace,monospace;color:var(--accent)}.node-title{font-weight:700;flex:1}.node-pct{color:var(--muted);font-size:13px}.node-bar{width:120px}.topics{display:grid}.topic-row{display:grid;grid-template-columns:minmax(220px,1fr) 110px 120px;gap:12px;align-items:center;padding:10px 15px;border-top:1px solid rgba(38,48,58,.65)}.topic-row:first-child{border-top:0}.topic-name{font-size:14px}.pill{display:inline-flex;width:max-content;border:1px solid var(--border);border-radius:99px;padding:2px 8px;font-size:11px;color:var(--muted)}.pill.production,.pill.mastered{color:var(--good);border-color:rgba(117,217,140,.35)}.pill.application{color:var(--blue);border-color:rgba(109,183,255,.35)}.pill.recall{color:var(--warm);border-color:rgba(243,189,85,.35)}.topic-status{font-size:12px;color:var(--muted);text-align:right}.empty-progress{background:var(--panel);border:1px dashed var(--border);border-radius:12px;padding:20px;color:var(--muted)}
#interaction{position:fixed;left:0;right:0;bottom:0;z-index:30;background:rgba(11,13,16,.97);border-top:1px solid var(--border);box-shadow:0 -12px 35px rgba(0,0,0,.35)}.interaction-inner{max-width:1120px;margin:auto;padding:14px 28px}.quiz-card{background:var(--panel);border:1px solid var(--border);border-radius:12px;padding:15px}.quiz-title{font-weight:750;margin-bottom:6px}.quiz-details{color:var(--muted);font-size:14px;margin-bottom:10px}.options{display:grid;gap:7px;margin:10px 0}.option{display:flex;gap:9px;align-items:flex-start;padding:8px 10px;background:var(--panel2);border:1px solid var(--border);border-radius:8px}.option:hover{border-color:#435160}.option input{margin-top:6px}.option small{display:block;color:var(--muted)}
.row{display:flex;gap:9px;align-items:center}.grow{flex:1}textarea{width:100%;resize:vertical;min-height:48px;max-height:150px;background:var(--panel2);color:var(--text);border:1px solid var(--border);border-radius:8px;padding:9px 11px;outline:none}textarea:focus{border-color:var(--accent)}button{border:1px solid var(--border);background:#1a2229;color:var(--text);border-radius:8px;padding:8px 13px;cursor:pointer}button.primary{background:#155c52;border-color:#287d70}button:hover{filter:brightness(1.1)}button:disabled{opacity:.5;cursor:not-allowed}.ask-wrap{display:flex;gap:9px;align-items:flex-end}.ask-wrap textarea{min-height:46px}.hint{color:var(--muted);font-size:12px;margin-top:6px}.hidden{display:none!important}
@media(max-width:760px){main{padding:28px 18px 210px}.header-inner,.interaction-inner{padding-left:18px;padding-right:18px}.brand{display:none}.progress-head{flex-direction:column}.current-card{min-width:0;width:100%}.topic-row{grid-template-columns:1fr auto}.topic-status{display:none}.node-bar{display:none}.row,.ask-wrap{align-items:stretch;flex-direction:column}}
</style></head><body>
<header><div class="header-inner"><div class="brand">π · Learning Environment</div><div class="nav"><button id="nav-lesson" class="active">Lesson</button><button id="nav-progress">Progress</button></div><div class="status"><span class="dot"></span><span id="status">connecting…</span></div></div></header>
<main><section id="lesson-view"><div id="lesson">Waiting for the lesson…</div></section><section id="progress-view" class="hidden"><div id="progress">Loading progress…</div></section></main>
<div id="interaction"><div class="interaction-inner"><div id="quiz" class="hidden"></div><div id="ask" class="ask-wrap"><textarea id="message" placeholder="Ask Pi a question or add a comment…"></textarea><button id="send" class="primary">Send to Pi</button></div><div id="hint" class="hint">Your message goes into the same Pi session; replies appear above automatically.</div></div></div>
<script>
let lessonVersion='',quizVersion=-1,currentQuiz=null,sending=false,progressVersion='',progressData=null,selectedTrack='python';
const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pct=n=>Math.max(0,Math.min(100,Math.round((Number(n)||0)*100)));
async function api(url,opts){const r=await fetch(url,opts);if(!r.ok)throw new Error(await r.text());return r.headers.get('content-type')?.includes('json')?r.json():r.text()}
function setView(view){const progress=view==='progress';document.getElementById('lesson-view').classList.toggle('hidden',progress);document.getElementById('progress-view').classList.toggle('hidden',!progress);document.getElementById('nav-lesson').classList.toggle('active',!progress);document.getElementById('nav-progress').classList.toggle('active',progress)}
document.getElementById('nav-lesson').onclick=()=>setView('lesson');document.getElementById('nav-progress').onclick=()=>setView('progress');
function renderQuiz(q){
 const root=document.getElementById('quiz'),ask=document.getElementById('ask'),hint=document.getElementById('hint');
 if(!q){root.classList.add('hidden');ask.classList.remove('hidden');hint.textContent='Your message goes into the same Pi session; replies appear above automatically.';return}
 ask.classList.add('hidden');root.classList.remove('hidden');
 const type=q.mode==='multi-select'?'checkbox':'radio';
 root.innerHTML='<div class="quiz-card"><div class="quiz-title">'+esc(q.question)+'</div>'+(q.details?'<div class="quiz-details">'+esc(q.details)+'</div>':'')+'<div class="options">'+q.options.map(o=>'<label class="option"><input type="'+type+'" name="quiz-option" value="'+esc(o.value)+'"><span><strong>'+o.index+'. '+esc(o.label)+'</strong>'+(o.description?'<small>'+esc(o.description)+'</small>':'')+'</span></label>').join('')+'<label class="option"><input type="'+type+'" name="quiz-option" value="__dont_know__"><span><strong>I don\'t know</strong><small>Use this instead of guessing.</small></span></label></div><textarea id="quiz-note" placeholder="Optional note: explain your thinking, uncertainty, or why you chose this…"></textarea><div class="row" style="margin-top:9px"><button class="primary" id="submit-quiz">Submit answer</button><button id="terminal-quiz">Use terminal instead</button></div></div>';
 document.getElementById('submit-quiz').onclick=submitQuiz;document.getElementById('terminal-quiz').onclick=()=>submitQuiz(true);hint.textContent='Answer here; Pi will grade it and continue the same lesson. Terminal remains available as fallback.';
}
async function submitQuiz(useTerminal=false){if(!currentQuiz)return;const inputs=[...document.querySelectorAll('#quiz input:checked')];const values=inputs.map(x=>x.value);const dontKnow=values.includes('__dont_know__');if(!useTerminal&&!dontKnow&&values.length===0){alert('Choose an answer, or select I don\'t know.');return}const selected=dontKnow?[]:values.filter(v=>v!=='__dont_know__');const note=document.getElementById('quiz-note')?.value||'';try{await api('/api/quiz',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({quizId:currentQuiz.id,selectedValues:selected,dontKnow,note,useTerminal})})}catch(e){alert('Could not submit answer: '+e.message)}}
async function sendMessage(){const box=document.getElementById('message');const text=box.value.trim();if(!text||sending)return;sending=true;document.getElementById('send').disabled=true;try{await api('/api/message',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({message:text})});box.value=''}catch(e){alert('Could not send message: '+e.message)}finally{sending=false;document.getElementById('send').disabled=false}}
document.getElementById('send').onclick=sendMessage;document.getElementById('message').addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.metaKey||e.ctrlKey)){e.preventDefault();sendMessage()}});
function stageText(stage){return stage==='not-assessed'?'not assessed':stage}
function renderProgress(data){
 progressData=data;const root=document.getElementById('progress');if(!data||!Array.isArray(data.tracks)||!data.tracks.length){root.innerHTML='<div class="empty-progress">No curriculum progress data is available yet.</div>';return}
 if(!data.tracks.some(t=>t.id===selectedTrack))selectedTrack=data.tracks[0].id;
 const current=data.current||{};const track=data.tracks.find(t=>t.id===selectedTrack)||data.tracks[0];
 const cards=data.tracks.map(t=>'<button class="track-card '+(t.id===selectedTrack?'active':'')+'" data-track="'+esc(t.id)+'"><div class="track-title">'+esc(t.title)+'</div><div class="track-meta"><span>'+pct(t.progress)+'% evidence progress</span><span>'+t.mastered+' mastered</span></div><div class="bar"><span style="width:'+pct(t.progress)+'%"></span></div></button>').join('');
 const nodes=track.nodes.map(n=>'<div class="node-card"><div class="node-head"><div class="node-id">'+esc(n.id)+'</div><div class="node-title">'+esc(n.title)+'</div><div class="bar node-bar"><span style="width:'+pct(n.progress)+'%"></span></div><div class="node-pct">'+pct(n.progress)+'%</div></div><div class="topics">'+n.topics.map(t=>'<div class="topic-row"><div class="topic-name">'+esc(t.topic)+'</div><span class="pill '+esc(t.stage)+' '+esc(t.status)+'">'+esc(stageText(t.stage))+'</span><div class="topic-status">'+esc(t.status)+'</div></div>').join('')+'</div></div>').join('');
 const active='<div class="current-card"><div class="current-label">Current</div><div class="current-topic">'+esc(current.topic||current.node||'No active checkpoint')+'</div><div class="muted">'+esc([current.track,current.node,current.assessment].filter(Boolean).join(' · '))+'</div>'+(current.nextAction?'<div class="current-next">Next: '+esc(current.nextAction)+'</div>':'')+'</div>';
 root.innerHTML='<div class="progress-head"><div><h1>Living Learning Map</h1><div class="muted">Derived from curriculum + learner state + evidence. Reading a lesson does not increase progress.</div></div>'+active+'</div><div class="track-grid">'+cards+'</div><div class="detail-head"><div><h2>'+esc(track.title)+'</h2><div class="stats"><span>'+track.mastered+' mastered</span><span>'+track.practising+' practising</span><span>'+track.reviewDue+' review due</span><span>'+track.notAssessed+' not assessed</span><span>'+data.evidenceCount+' evidence files</span></div></div><div class="detail-pct">'+pct(track.progress)+'%</div></div>'+nodes;
 root.querySelectorAll('[data-track]').forEach(el=>el.onclick=()=>{selectedTrack=el.getAttribute('data-track');renderProgress(progressData)});
}
async function refresh(){try{const nearBottom=(innerHeight+scrollY)>=document.body.offsetHeight-240;const d=await api('/api/state',{cache:'no-store'});if(d.lessonVersion!==lessonVersion){lessonVersion=d.lessonVersion;document.getElementById('lesson').innerHTML=d.html||'<p>Waiting for the lesson…</p>';if(nearBottom)scrollTo({top:document.body.scrollHeight,behavior:'smooth'})}if(d.quizVersion!==quizVersion){quizVersion=d.quizVersion;currentQuiz=d.quiz;renderQuiz(currentQuiz)}if(d.progress&&d.progress.version!==progressVersion){progressVersion=d.progress.version;renderProgress(d.progress)}document.getElementById('status').textContent='live · '+new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}catch(e){document.getElementById('status').textContent='reconnecting…'}}
refresh();setInterval(refresh,600);
</script></body></html>`;
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
					if (req.method === "GET" && req.url === "/api/state") {
						bridge.browserLastSeenAt = Date.now();
						let markdown = "";
						let lessonVersion = "0";
						if (lessonFile && fs.existsSync(lessonFile)) {
							markdown = fs.readFileSync(lessonFile, "utf-8");
							const stat = fs.statSync(lessonFile);
							lessonVersion = `${stat.mtimeMs}-${stat.size}`;
						}
						const progress = buildProgressMap(ctx.cwd);
						res.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
						res.end(JSON.stringify({ lessonVersion, html: renderMarkdown(markdown), quizVersion: bridge.quizVersion, quiz: bridge.currentQuiz, progress }));
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