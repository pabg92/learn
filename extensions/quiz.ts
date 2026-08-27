import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Text } from "@mariozechner/pi-tui";
import { Type } from "@sinclair/typebox";
import { getLearningBridge, type BridgeQuizAnswer } from "./learning-bridge.ts";

interface QuizOption {
	label: string;
	value: string;
	description?: string;
}

interface OptionAnswer {
	label: string;
	value: string;
	index: number;
}

type QuizStatus = "answered" | "cancelled" | "unavailable";
type QuizMode = "single-select" | "multi-select";

interface DisplayedOption {
	index: number;
	label: string;
}

interface QuizResponse {
	dontKnow: boolean;
	note?: string;
	answers: OptionAnswer[];
}

interface QuizResultDetails {
	status: QuizStatus;
	question: string;
	context?: string;
	mode: QuizMode;
	answers: OptionAnswer[];
	correctIndices: number[];
	options?: DisplayedOption[];
	correct?: boolean;
	dontKnow?: boolean;
	note?: string;
	explanation?: string;
	message?: string;
	source?: "browser" | "terminal";
}

const DONT_KNOW_LABEL = "I don't know";

const OptionSchema = Type.Object({
	label: Type.String({ description: "Display label for the answer option." }),
	value: Type.Optional(Type.String({ description: "Stable value for grading. Defaults to the label." })),
	description: Type.Optional(Type.String({ description: "Optional detail shown with the option." })),
});

const QuizParams = Type.Object({
	question: Type.String({ description: "Ask exactly one graded question." }),
	details: Type.Optional(Type.String({ description: "Optional context shown with the question." })),
	options: Type.Array(OptionSchema, { minItems: 2 }),
	multiSelect: Type.Optional(Type.Boolean()),
	correctAnswer: Type.Union([Type.String(), Type.Array(Type.String())]),
	explanation: Type.String({ description: "Explanation revealed only after the answer." }),
	shuffle: Type.Optional(Type.Boolean({ description: "Defaults to true." })),
});

function normalizeOptions(raw: Array<{ label: string; value?: string; description?: string }> | undefined): QuizOption[] {
	const seen = new Set<string>();
	return (raw || []).map((o) => ({
		label: o.label.trim(),
		value: o.value?.trim() || o.label.trim(),
		description: o.description?.trim() || undefined,
	})).filter((o) => {
		if (!o.label) return false;
		if (seen.has(o.value)) throw new Error(`duplicate option value "${o.value}"`);
		seen.add(o.value);
		return true;
	});
}

function shuffleOptions(options: QuizOption[]): QuizOption[] {
	const out = [...options];
	for (let i = out.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[out[i], out[j]] = [out[j], out[i]];
	}
	return out;
}

function coerceCorrectAnswer(value: string | string[]): string[] {
	if (Array.isArray(value)) return value;
	const trimmed = value.trim();
	if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
		try {
			const parsed = JSON.parse(trimmed);
			if (Array.isArray(parsed)) return parsed.map(String);
		} catch {}
	}
	return [value];
}

function resolveCorrect(correctAnswer: string | string[], options: QuizOption[]): { indices: number[]; error?: string } {
	const wanted = coerceCorrectAnswer(correctAnswer);
	const byValue = new Map(options.map((o, i) => [o.value, i + 1]));
	const indices: number[] = [];
	for (const raw of wanted) {
		const index = byValue.get(String(raw).trim());
		if (!index) return { indices: [], error: `correctAnswer "${raw}" does not match an option value` };
		indices.push(index);
	}
	return { indices: [...new Set(indices)].sort((a, b) => a - b) };
}

function isCorrect(selected: number[], correct: number[]): boolean {
	if (selected.length !== correct.length) return false;
	const a = [...selected].sort((x, y) => x - y);
	const b = [...correct].sort((x, y) => x - y);
	return a.every((value, i) => value === b[i]);
}

function buildResult(
	question: string,
	context: string | undefined,
	mode: QuizMode,
	options: QuizOption[],
	response: QuizResponse,
	correctIndices: number[],
	explanation: string,
	source: "browser" | "terminal",
) {
	const selected = response.answers.map((a) => a.index);
	const correct = response.dontKnow ? false : isCorrect(selected, correctIndices);
	const displayedOptions = options.map((o, i) => ({ index: i + 1, label: o.label }));
	const correctText = correctIndices.map((i) => `${i}. ${options[i - 1]?.label ?? "(unknown)"}`).join(", ");
	let text: string;
	if (response.dontKnow) {
		text = `User selected "I don't know" — a genuine knowledge gap, not a guess.\nCorrect: ${correctText}`;
	} else {
		const selectedText = response.answers.map((a) => `${a.index}. ${a.label}`).join(", ") || "(none)";
		text = `User answered ${correct ? "correctly" : "incorrectly"}.\nSelected: ${selectedText}\nCorrect: ${correctText}`;
	}
	if (response.note) text += `\nUser's note: ${response.note}`;
	text += `\nExplanation: ${explanation}`;

	const details: QuizResultDetails = {
		status: "answered",
		question,
		context,
		mode,
		answers: response.answers,
		correctIndices,
		options: displayedOptions,
		correct,
		dontKnow: response.dontKnow,
		note: response.note,
		explanation,
		source,
	};
	return { content: [{ type: "text" as const, text }], details };
}

function unavailable(question: string, mode: QuizMode, message: string, correctIndices: number[] = []) {
	const details: QuizResultDetails = { status: "unavailable", question, mode, answers: [], correctIndices, message };
	return { content: [{ type: "text" as const, text: message }], details };
}

function responseFromBrowser(answer: BridgeQuizAnswer, options: QuizOption[]): QuizResponse | null {
	if (answer.useTerminal) return null;
	if (answer.dontKnow) return { dontKnow: true, note: answer.note?.trim() || undefined, answers: [] };
	const wanted = new Set(answer.selectedValues || []);
	const answers = options
		.map((o, i) => ({ label: o.label, value: o.value, index: i + 1 }))
		.filter((o) => wanted.has(o.value));
	return { dontKnow: false, note: answer.note?.trim() || undefined, answers };
}

async function terminalResponse(ctx: any, question: string, options: QuizOption[], mode: QuizMode): Promise<QuizResponse | null> {
	if (!ctx.hasUI) return null;
	if (mode === "single-select") {
		const labels = [...options.map((o, i) => `${i + 1}. ${o.label}`), DONT_KNOW_LABEL];
		const selected = await ctx.ui.select(question, labels);
		if (!selected) return null;
		if (selected === DONT_KNOW_LABEL) return { dontKnow: true, answers: [] };
		const index = labels.indexOf(selected);
		const option = options[index];
		return option ? { dontKnow: false, answers: [{ label: option.label, value: option.value, index: index + 1 }] } : null;
	}

	const prompt = options.map((o, i) => `${i + 1}. ${o.label}`).join("\n");
	const raw = await ctx.ui.input(`${question}\n${prompt}\nEnter numbers separated by commas, or 0 for I don't know:`);
	if (!raw) return null;
	if (raw.trim() === "0") return { dontKnow: true, answers: [] };
	const parsed = raw.split(",").map((x: string) => Number.parseInt(x.trim(), 10)).filter((n: number) => n >= 1 && n <= options.length);
	const indices: number[] = Array.from(new Set<number>(parsed));
	const answers = indices.map((i) => ({ label: options[i - 1].label, value: options[i - 1].value, index: i }));
	return { dontKnow: false, answers };
}

export default function quizExtension(pi: ExtensionAPI) {
	const bridge = getLearningBridge();

	pi.registerTool({
		name: "quiz",
		label: "Quiz",
		description: "Ask one graded multiple-choice question with instant feedback. In learning sessions, the browser lesson viewer is the primary answer surface; terminal input remains a fallback.",
		parameters: QuizParams,
		async execute(toolCallId, params, signal, onUpdate, ctx) {
			const mode: QuizMode = params.multiSelect ? "multi-select" : "single-select";
			let options: QuizOption[];
			try {
				options = normalizeOptions(params.options);
			} catch (error) {
				return unavailable(params.question, mode, `quiz ${(error as Error).message}`);
			}
			if (params.shuffle !== false) options = shuffleOptions(options);
			const resolved = resolveCorrect(params.correctAnswer as string | string[], options);
			if (resolved.error) return unavailable(params.question, mode, `quiz ${resolved.error}`);
			if (signal?.aborted) return unavailable(params.question, mode, "Quiz cancelled", resolved.indices);

			const browserReady = bridge.viewerActive && (Date.now() - bridge.browserLastSeenAt) < 5000;
			onUpdate?.({
				content: [{ type: "text", text: browserReady ? "Awaiting browser response..." : "Awaiting user response..." }],
				details: { options: options.map((o, i) => ({ index: i + 1, label: o.label })) },
			});

			let response: QuizResponse | null = null;
			let source: "browser" | "terminal" = "terminal";

			if (browserReady) {
				const browserWait = bridge.publishQuiz({
					id: toolCallId,
					question: params.question,
					details: params.details?.trim() || undefined,
					mode,
					options: options.map((o, i) => ({ index: i + 1, label: o.label, value: o.value, description: o.description })),
					createdAt: Date.now(),
				});
				const browserAnswer = await Promise.race([
					browserWait,
					new Promise<BridgeQuizAnswer>((resolve) => setTimeout(() => resolve({ selectedValues: [], useTerminal: true }), 30 * 60 * 1000)),
				]);
				response = responseFromBrowser(browserAnswer, options);
				if (response) source = "browser";
			}

			if (!response) {
				response = await terminalResponse(ctx, params.question, options, mode);
				source = "terminal";
			}

			bridge.cancelQuiz(toolCallId);
			if (!response) return unavailable(params.question, mode, "Quiz cancelled", resolved.indices);
			return buildResult(
				params.question,
				params.details?.trim() || undefined,
				mode,
				options,
				response,
				resolved.indices,
				params.explanation.trim(),
				source,
			);
		},
		renderCall(args, theme) {
			let text = theme.fg("toolTitle", theme.bold("quiz ")) + theme.fg("muted", args.question);
			if (getLearningBridge().viewerActive) text += theme.fg("dim", " [answer in browser]");
			return new Text(text, 0, 0);
		},
		renderResult(result, _options, theme) {
			const details = result.details as QuizResultDetails | undefined;
			if (!details) return new Text(result.content[0]?.type === "text" ? result.content[0].text : "", 0, 0);
			if (details.status !== "answered") return new Text(theme.fg("warning", details.message || details.status), 0, 0);
			const prefix = details.dontKnow ? theme.fg("warning", "? I don't know") : details.correct ? theme.fg("success", "✓ Correct") : theme.fg("error", "✗ Incorrect");
			const via = details.source ? theme.fg("dim", ` · ${details.source}`) : "";
			return new Text(`${prefix}${via}\n${theme.fg("muted", details.explanation || "")}`, 0, 0);
		},
	});
}
