const STORAGE_KEY = "ts-drill-progress";

export type QuestionRecord = {
	attempts: number;
	correctCount: number;
};

export type Session = {
	date: string;
	questionIds: string[];
	answers: Record<string, { selected: number; correct: boolean }>;
	completed: boolean;
};

export type Progress = {
	questions: Record<string, QuestionRecord>;
	difficultyLevel: 1 | 2 | 3;
	currentSession: Session | null;
};

const defaultProgress = (): Progress => ({
	questions: {},
	difficultyLevel: 1,
	currentSession: null,
});

export const loadProgress = (): Progress => {
	if (typeof window === "undefined") return defaultProgress();
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		if (!raw) return defaultProgress();
		const parsed = JSON.parse(raw) as unknown;
		if (
			typeof parsed !== "object" ||
			parsed === null ||
			!("questions" in parsed) ||
			!("difficultyLevel" in parsed)
		) {
			return defaultProgress();
		}
		return parsed as Progress;
	} catch {
		return defaultProgress();
	}
};

export const saveProgress = (progress: Progress): void => {
	if (typeof window === "undefined") return;
	window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
};

export const getTodayString = (): string => {
	const d = new Date();
	const yyyy = d.getFullYear();
	const mm = String(d.getMonth() + 1).padStart(2, "0");
	const dd = String(d.getDate()).padStart(2, "0");
	return `${yyyy}-${mm}-${dd}`;
};

export const isTodayCompleted = (progress: Progress): boolean => {
	const session = progress.currentSession;
	if (!session) return false;
	return session.date === getTodayString() && session.completed;
};

export const isTodayStarted = (progress: Progress): boolean => {
	const session = progress.currentSession;
	if (!session) return false;
	return session.date === getTodayString() && !session.completed;
};

export const recordAnswer = (
	progress: Progress,
	questionId: string,
	selected: number,
	isCorrect: boolean
): Progress => {
	const existing = progress.questions[questionId] ?? {
		attempts: 0,
		correctCount: 0,
	};
	const updatedRecord: QuestionRecord = {
		attempts: existing.attempts + 1,
		correctCount: isCorrect ? existing.correctCount + 1 : existing.correctCount,
	};

	const updatedSession: Session | null = progress.currentSession
		? {
				...progress.currentSession,
				answers: {
					...progress.currentSession.answers,
					[questionId]: { selected, correct: isCorrect },
				},
			}
		: null;

	return {
		...progress,
		questions: {
			...progress.questions,
			[questionId]: updatedRecord,
		},
		currentSession: updatedSession,
	};
};

export const startSession = (progress: Progress, questionIds: string[]): Progress => ({
	...progress,
	currentSession: {
		date: getTodayString(),
		questionIds,
		answers: {},
		completed: false,
	},
});

export const completeSession = (progress: Progress): Progress => {
	if (!progress.currentSession) return progress;
	return {
		...progress,
		currentSession: {
			...progress.currentSession,
			completed: true,
		},
	};
};

export const upgradeDifficultyIfEarned = (
	progress: Progress,
	allQuestions: { id: string; difficulty: number }[]
): Progress => {
	if (progress.difficultyLevel >= 3) return progress;

	const currentLevel = progress.difficultyLevel;
	const questionsAtLevel = allQuestions.filter((q) => q.difficulty === currentLevel);

	if (questionsAtLevel.length === 0) return progress;

	const answeredAtLevel = questionsAtLevel.filter(
		(q) => (progress.questions[q.id]?.attempts ?? 0) > 0
	);

	// Need to have answered at least 80% of questions at this difficulty
	if (answeredAtLevel.length < Math.ceil(questionsAtLevel.length * 0.8)) {
		return progress;
	}

	const correctAtLevel = answeredAtLevel.filter((q) => {
		const record = progress.questions[q.id];
		return record && record.correctCount > 0;
	});

	const correctRatio = correctAtLevel.length / questionsAtLevel.length;

	if (correctRatio >= 0.8) {
		const nextLevel = (currentLevel + 1) as 1 | 2 | 3;
		return { ...progress, difficultyLevel: nextLevel };
	}

	return progress;
};
