import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Text } from "@mariozechner/pi-tui";
import { Type } from "@sinclair/typebox";
import { getLearningBridge, type BridgeQuizAnswer } from "./_shared/learning-bridge.ts";

interface QuizOption { label: string; value: string; description?: string }
interface OptionAnswer { label: string; value: string; index: number }
interface QuizResponse { dontKnow: boolean; note?: string; answers: OptionAnswer[] }
type QuizMode = "single-select" | "multi-select";
type QuizStatus = "waiting" | "answered" | "unavailable";

interface QuizResultDetails {
  status: QuizStatus;
  question: string;
  context?: string;
  mode: QuizMode;
  answers: OptionAnswer[];
  correctIndices: number[];
  options?: Array<{ index: number; label: string }>;
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
  value: Type.Optional(Type.String({ description: "Stable machine-readable value. Defaults to label." })),
  description: Type.Optional(Type.String({ description: "Optional detail shown below the option." })),
});

const QuizParams = Type.Object({
  question: Type.String({ description: "Ask exactly one graded question." }),
  details: Type.Optional(Type.String({ description: "Optional context shown with the question." })),
  options: Type.Array(OptionSchema, { minItems: 2 }),
  multiSelect: Type.Optional(Type.Boolean()),
  correctAnswer: Type.Union([Type.String(), Type.Array(Type.String())]),
  explanation: Type.String({ description: "Explanation revealed after the learner answers." }),
  shuffle: Type.Optional(Type.Boolean({ description: "Defaults to true." })),
});

function normalizeOptions(input: Array<{ label: string; value?: string; description?: string }> | undefined): QuizOption[] {
  const seen = new Set<string>();
  return (input || []).map((option) => ({
    label: option.label.trim(),
    value: option.value?.trim() || option.label.trim(),
    description: option.description?.trim() || undefined,
  })).filter((option) => {
    if (!option.label) return false;
    if (seen.has(option.value)) throw new Error(`duplicate option value "${option.value}"`);
    seen.add(option.value);
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

function correctValues(value: string | string[]): string[] {
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

function resolveCorrect(answer: string | string[] | undefined, options: QuizOption[]): { indices: number[]; error?: string } {
  if (answer === undefined) return { indices: [], error: "correctAnswer is required" };
  const byValue = new Map(options.map((option, index) => [option.value, index + 1]));
  const indices: number[] = [];
  for (const value of correctValues(answer)) {
    const index = byValue.get(String(value).trim());
    if (index === undefined) return { indices: [], error: `correctAnswer "${value}" does not match an option value` };
    indices.push(index);
  }
  return { indices: [...new Set(indices)].sort((a, b) => a - b) };
}

function sameSet(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const aa = [...a].sort((x, y) => x - y);
  const bb = [...b].sort((x, y) => x - y);
  return aa.every((value, index) => value === bb[index]);
}

function unavailable(question: string, mode: QuizMode, message: string, correctIndices: number[] = []) {
  const details: QuizResultDetails = { status: "unavailable", question, mode, answers: [], correctIndices, message };
  return { content: [{ type: "text" as const, text: message }], details };
}

function responseFromBrowser(answer: BridgeQuizAnswer, options: QuizOption[]): QuizResponse | null {
  if (answer.useTerminal) return null;
  if (answer.dontKnow) return { dontKnow: true, note: answer.note, answers: [] };
  const answers: OptionAnswer[] = [];
  for (const value of answer.selectedValues || []) {
    const index = options.findIndex((option) => option.value === value);
    if (index >= 0) answers.push({ label: options[index].label, value: options[index].value, index: index + 1 });
  }
  if (!answers.length) return null;
  return { dontKnow: false, note: answer.note, answers };
}

async function terminalResponse(ctx: any, question: string, options: QuizOption[], mode: QuizMode): Promise<QuizResponse | null> {
  if (!ctx.hasUI) return null;
  if (mode === "single-select") {
    const labels = [...options.map((option) => option.label), DONT_KNOW_LABEL];
    const selected = await ctx.ui.select(question, labels);
    if (!selected) return null;
    if (selected === DONT_KNOW_LABEL) return { dontKnow: true, answers: [] };
    const index = labels.indexOf(selected);
    const option = options[index];
    return option ? { dontKnow: false, answers: [{ label: option.label, value: option.value, index: index + 1 }] } : null;
  }

  const prompt = options.map((option, index) => `${index + 1}. ${option.label}`).join("\n");
  const raw = await ctx.ui.input(`${question}\n${prompt}\nEnter numbers separated by commas, or 0 for I don't know:`);
  if (!raw) return null;
  if (raw.trim() === "0") return { dontKnow: true, answers: [] };
  const indices: number[] = Array.from(new Set<number>(raw.split(",").map((value: string) => Number.parseInt(value.trim(), 10)).filter((n: number) => n >= 1 && n <= options.length)));
  return { dontKnow: false, answers: indices.map((index) => ({ label: options[index - 1].label, value: options[index - 1].value, index })) };
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
  const selectedIndices = response.answers.map((answer) => answer.index);
  const correct = !response.dontKnow && sameSet(selectedIndices, correctIndices);
  const displayedOptions = options.map((option, index) => ({ index: index + 1, label: option.label }));
  const selected = response.dontKnow ? DONT_KNOW_LABEL : response.answers.map((answer) => `${answer.index}. ${answer.label}`).join(", ");
  const correctText = correctIndices.map((index) => `${index}. ${options[index - 1]?.label || "(unknown)"}`).join(", ");
  let text = response.dontKnow
    ? `User selected "I don't know" — a genuine knowledge gap rather than a guess.\nCorrect: ${correctText}`
    : `User answered ${correct ? "correctly" : "incorrectly"}.\nSelected: ${selected}\nCorrect: ${correctText}`;
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

export default function quizExtension(pi: ExtensionAPI) {
  const bridge = getLearningBridge();

  pi.registerTool({
    name: "quiz",
    label: "Quiz",
    description: "Ask one graded multiple-choice question. Browser is primary during learning sessions; terminal is fallback.",
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

      const browserReady = bridge.viewerActive && Date.now() - bridge.browserLastSeenAt < 5000;
      const waitingMessage = browserReady ? "Awaiting browser response..." : "Awaiting user response...";
      onUpdate?.({
        content: [{ type: "text", text: waitingMessage }],
        details: {
          status: "waiting",
          message: waitingMessage,
          options: options.map((option, index) => ({ index: index + 1, label: option.label })),
        },
      });

      let response: QuizResponse | null = null;
      let source: "browser" | "terminal" = "terminal";

      if (browserReady) {
        const browserWait = bridge.publishQuiz({
          id: toolCallId,
          question: params.question,
          details: params.details?.trim() || undefined,
          mode,
          options: options.map((option, index) => ({ index: index + 1, label: option.label, value: option.value, description: option.description })),
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
      return buildResult(params.question, params.details?.trim() || undefined, mode, options, response, resolved.indices, params.explanation.trim(), source);
    },

    renderCall(args, theme) {
      let text = theme.fg("toolTitle", theme.bold("quiz ")) + theme.fg("muted", args.question);
      if (getLearningBridge().viewerActive) text += theme.fg("dim", " [answer in browser]");
      return new Text(text, 0, 0);
    },

    renderResult(result, _options, theme) {
      const details = result.details as QuizResultDetails | undefined;
      if (!details) return new Text(result.content[0]?.type === "text" ? result.content[0].text : "", 0, 0);
      if (details.status === "waiting") return new Text(theme.fg("dim", details.message || "Waiting for answer..."), 0, 0);
      if (details.status !== "answered") return new Text(theme.fg("warning", details.message || details.status), 0, 0);
      const prefix = details.dontKnow ? theme.fg("warning", "? I don't know") : details.correct ? theme.fg("success", "✓ Correct") : theme.fg("error", "✗ Incorrect");
      const via = details.source ? theme.fg("dim", ` · ${details.source}`) : "";
      return new Text(`${prefix}${via}\n${theme.fg("muted", details.explanation || "")}`, 0, 0);
    },
  });
}
