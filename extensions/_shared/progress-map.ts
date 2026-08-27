import * as fs from "node:fs";
import * as path from "node:path";

export type ProgressStage = "not-assessed" | "recognition" | "recall" | "application" | "production";

export interface ProgressTopic {
	node: string;
	topic: string;
	stage: ProgressStage;
	status: string;
	evidence: string;
	lastUpdated: string;
	score: number;
}

export interface ProgressNode {
	id: string;
	title: string;
	progress: number;
	topics: ProgressTopic[];
}

export interface ProgressTrack {
	id: string;
	prefix: string;
	title: string;
	progress: number;
	mastered: number;
	practising: number;
	reviewDue: number;
	notAssessed: number;
	nodes: ProgressNode[];
}

export interface ProgressMap {
	version: string;
	current: {
		track: string;
		node: string;
		topic: string;
		assessment: string;
		status: string;
		nextAction: string;
	};
	evidenceCount: number;
	tracks: ProgressTrack[];
}

interface LedgerEntry {
	node: string;
	topic: string;
	stage: ProgressStage;
	status: string;
	evidence: string;
	lastUpdated: string;
}

const TRACK_META: Record<string, { id: string; title: string }> = {
	A: { id: "python", title: "Python Foundation Sprint" },
	B: { id: "cs", title: "Computer Science" },
	C: { id: "swe", title: "Software Engineering" },
	D: { id: "maths", title: "Maths for ML" },
	E: { id: "ml", title: "Machine Learning" },
	F: { id: "applied-ai", title: "Applied AI Engineering" },
};

const STAGE_SCORE: Record<ProgressStage, number> = {
	"not-assessed": 0,
	recognition: 0.25,
	recall: 0.5,
	application: 0.75,
	production: 1,
};

function readText(file: string): string {
	try {
		return fs.readFileSync(file, "utf-8");
	} catch {
		return "";
	}
}

function normalize(value: string): string {
	return value
		.toLowerCase()
		.replace(/`/g, "")
		.replace(/\*\*/g, "")
		.replace(/\s+/g, " ")
		.trim();
}

function normalizeStage(value: string): ProgressStage {
	const stage = normalize(value);
	if (stage === "recognition") return "recognition";
	if (stage === "recall") return "recall";
	if (stage === "application") return "application";
	if (stage === "production") return "production";
	return "not-assessed";
}

function rowCells(line: string): string[] {
	return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
}

function parseLedger(state: string): LedgerEntry[] {
	const start = state.indexOf("## Progress ledger");
	if (start < 0) return [];
	const after = state.slice(start + "## Progress ledger".length);
	const nextHeading = after.search(/^##\s+/m);
	const section = nextHeading >= 0 ? after.slice(0, nextHeading) : after;
	const entries: LedgerEntry[] = [];
	for (const line of section.split("\n")) {
		if (!line.trim().startsWith("|")) continue;
		const cells = rowCells(line);
		if (cells.length < 6) continue;
		if (normalize(cells[0]) === "node" || /^-+$/.test(cells[0].replace(/:/g, ""))) continue;
		if (!/^[A-F]\d*$/i.test(cells[0])) continue;
		entries.push({
			node: cells[0].toUpperCase(),
			topic: cells[1],
			stage: normalizeStage(cells[2]),
			status: cells[3] || "not-assessed",
			evidence: cells[4] || "",
			lastUpdated: cells[5] || "",
		});
	}
	return entries;
}

function parseCurriculum(markdown: string): Array<{ prefix: string; nodes: Array<{ id: string; title: string; topics: string[] }> }> {
	const tracks = new Map<string, Array<{ id: string; title: string; topics: string[] }>>();
	let currentPrefix: string | null = null;
	let currentNode: { id: string; title: string; topics: string[] } | null = null;
	let collectNodeBullets = false;

	for (const raw of markdown.replace(/\r\n/g, "\n").split("\n")) {
		const line = raw.trim();
		const trackMatch = /^##\s+.*Track\s+([A-F])\s+—/i.exec(line);
		if (trackMatch) {
			currentPrefix = trackMatch[1].toUpperCase();
			if (!tracks.has(currentPrefix)) tracks.set(currentPrefix, []);
			currentNode = null;
			collectNodeBullets = false;
			continue;
		}
		if (/^##\s+/.test(line)) {
			currentPrefix = null;
			currentNode = null;
			collectNodeBullets = false;
			continue;
		}
		if (!currentPrefix || !TRACK_META[currentPrefix]) continue;

		const nodeMatch = new RegExp(`^###\\s+(${currentPrefix}\\d+)\\.\\s+(.+)$`, "i").exec(line);
		if (nodeMatch) {
			currentNode = { id: nodeMatch[1].toUpperCase(), title: nodeMatch[2].trim(), topics: [] };
			tracks.get(currentPrefix)!.push(currentNode);
			collectNodeBullets = true;
			continue;
		}
		if (/^###\s+/.test(line)) {
			currentNode = null;
			collectNodeBullets = false;
			continue;
		}

		const bullet = /^-\s+(.+)$/.exec(line);
		if (currentNode && collectNodeBullets) {
			if (bullet) {
				currentNode.topics.push(bullet[1].trim());
				continue;
			}
			if (line) collectNodeBullets = false;
			continue;
		}

		// Track F currently has no F0/F1 headings. Treat its bullet list as one node.
		if (currentPrefix === "F" && bullet) {
			let node = tracks.get("F")!.find((item) => item.id === "F");
			if (!node) {
				node = { id: "F", title: "Applied AI engineering", topics: [] };
				tracks.get("F")!.push(node);
			}
			node.topics.push(bullet[1].trim());
		}
	}

	return Array.from(tracks.entries()).map(([prefix, nodes]) => ({ prefix, nodes }));
}

function checkpointField(checkpoint: string, label: string): string {
	const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	return new RegExp(`^- ${escaped}:\\s*(.+)$`, "mi").exec(checkpoint)?.[1]?.trim() || "";
}

function nextAction(checkpoint: string): string {
	const match = /## Exact next action\s*\n+([\s\S]*?)(?=\n##\s+|$)/i.exec(checkpoint);
	if (!match) return "";
	return match[1].replace(/\s+/g, " ").trim();
}

function evidenceCount(dir: string): number {
	try {
		return fs.readdirSync(dir, { withFileTypes: true }).filter((entry) => entry.isFile() && entry.name.endsWith(".md") && entry.name.toLowerCase() !== "readme.md").length;
	} catch {
		return 0;
	}
}

function fileVersion(paths: string[], evidenceDir: string): string {
	const parts: string[] = [];
	for (const file of paths) {
		try {
			const stat = fs.statSync(file);
			parts.push(`${stat.mtimeMs}-${stat.size}`);
		} catch {
			parts.push("0");
		}
	}
	try {
		for (const entry of fs.readdirSync(evidenceDir).sort()) {
			const file = path.join(evidenceDir, entry);
			const stat = fs.statSync(file);
			parts.push(`${entry}:${stat.mtimeMs}-${stat.size}`);
		}
	} catch {}
	return parts.join("|");
}

export function buildProgressMap(cwd: string): ProgressMap {
	const curriculumFile = path.resolve(cwd, ".pi/curriculum/path.md");
	const stateFile = path.resolve(cwd, ".pi/learner/state.md");
	const checkpointFile = path.resolve(cwd, ".pi/learner/checkpoint.md");
	const evidenceDir = path.resolve(cwd, ".pi/learner/evidence");

	const curriculum = readText(curriculumFile);
	const state = readText(stateFile);
	const checkpoint = readText(checkpointFile);
	const ledger = parseLedger(state);
	const byKey = new Map(ledger.map((entry) => [`${entry.node}|${normalize(entry.topic)}`, entry]));

	const tracks: ProgressTrack[] = parseCurriculum(curriculum).map(({ prefix, nodes }) => {
		const meta = TRACK_META[prefix];
		const progressNodes: ProgressNode[] = nodes.map((node) => {
			const topics: ProgressTopic[] = node.topics.map((topic) => {
				const entry = byKey.get(`${node.id}|${normalize(topic)}`);
				const stage = entry?.stage || "not-assessed";
				const status = entry?.status || "not-assessed";
				const score = normalize(status) === "mastered" ? 1 : STAGE_SCORE[stage];
				return {
					node: node.id,
					topic,
					stage,
					status,
					evidence: entry?.evidence || "",
					lastUpdated: entry?.lastUpdated || "",
					score,
				};
			});
			const progress = topics.length ? topics.reduce((sum, topic) => sum + topic.score, 0) / topics.length : 0;
			return { id: node.id, title: node.title, progress, topics };
		});
		const allTopics = progressNodes.flatMap((node) => node.topics);
		const progress = allTopics.length ? allTopics.reduce((sum, topic) => sum + topic.score, 0) / allTopics.length : 0;
		return {
			id: meta.id,
			prefix,
			title: meta.title,
			progress,
			mastered: allTopics.filter((topic) => normalize(topic.status) === "mastered").length,
			practising: allTopics.filter((topic) => ["practising", "probing", "learning"].includes(normalize(topic.status))).length,
			reviewDue: allTopics.filter((topic) => normalize(topic.status) === "review-due").length,
			notAssessed: allTopics.filter((topic) => topic.stage === "not-assessed").length,
			nodes: progressNodes,
		};
	});

	return {
		version: fileVersion([curriculumFile, stateFile, checkpointFile], evidenceDir),
		current: {
			track: checkpointField(checkpoint, "Track"),
			node: checkpointField(checkpoint, "Curriculum node"),
			topic: checkpointField(checkpoint, "Lesson/topic"),
			assessment: checkpointField(checkpoint, "Assessment level"),
			status: checkpointField(checkpoint, "Status"),
			nextAction: nextAction(checkpoint),
		},
		evidenceCount: evidenceCount(evidenceDir),
		tracks,
	};
}
