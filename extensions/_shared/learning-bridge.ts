export type BridgeQuizMode = "single-select" | "multi-select";

export interface BridgeQuizOption {
	index: number;
	label: string;
	value: string;
	description?: string;
}

export interface BridgeQuizState {
	id: string;
	question: string;
	details?: string;
	mode: BridgeQuizMode;
	options: BridgeQuizOption[];
	createdAt: number;
}

export interface BridgeQuizAnswer {
	selectedValues: string[];
	dontKnow?: boolean;
	note?: string;
	useTerminal?: boolean;
}

interface PendingQuiz {
	state: BridgeQuizState;
	resolve: (answer: BridgeQuizAnswer) => void;
}

export interface LearningBridge {
	viewerActive: boolean;
	browserLastSeenAt: number;
	quizVersion: number;
	currentQuiz: BridgeQuizState | null;
	publishQuiz(state: BridgeQuizState): Promise<BridgeQuizAnswer>;
	resolveQuiz(id: string, answer: BridgeQuizAnswer): boolean;
	cancelQuiz(id: string): void;
}

const BRIDGE_KEY = Symbol.for("pabg92.learn.learningBridge.v1");

type GlobalWithBridge = typeof globalThis & { [BRIDGE_KEY]?: LearningBridge };

function createBridge(): LearningBridge {
	let pending: PendingQuiz | null = null;

	return {
		viewerActive: false,
		browserLastSeenAt: 0,
		quizVersion: 0,
		currentQuiz: null,

		publishQuiz(state: BridgeQuizState): Promise<BridgeQuizAnswer> {
			if (pending) {
				pending.resolve({ selectedValues: [], useTerminal: true });
			}
			this.currentQuiz = state;
			this.quizVersion++;
			return new Promise<BridgeQuizAnswer>((resolve) => {
				pending = { state, resolve };
			});
		},

		resolveQuiz(id: string, answer: BridgeQuizAnswer): boolean {
			if (!pending || pending.state.id !== id) return false;
			const done = pending;
			pending = null;
			this.currentQuiz = null;
			this.quizVersion++;
			done.resolve(answer);
			return true;
		},

		cancelQuiz(id: string): void {
			if (!pending || pending.state.id !== id) return;
			const done = pending;
			pending = null;
			this.currentQuiz = null;
			this.quizVersion++;
			done.resolve({ selectedValues: [], useTerminal: true });
		},
	};
}

export function getLearningBridge(): LearningBridge {
	const root = globalThis as GlobalWithBridge;
	if (!root[BRIDGE_KEY]) root[BRIDGE_KEY] = createBridge();
	return root[BRIDGE_KEY]!;
}
