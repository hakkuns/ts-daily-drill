import type { Progress } from "./progress";
import type { Question } from "./types";

export const SESSION_SIZE = 5;

const shuffle = <T>(arr: T[]): T[] => {
	const copy = [...arr];
	for (let i = copy.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[copy[i], copy[j]] = [copy[j], copy[i]];
	}
	return copy;
};

export const selectQuestions = (allQuestions: Question[], progress: Progress): Question[] => {
	const available = allQuestions.filter((q) => q.difficulty <= progress.difficultyLevel);

	if (available.length === 0) return allQuestions.slice(0, SESSION_SIZE);

	const wrongJavaTrap: Question[] = [];
	const wrong: Question[] = [];
	const unanswered: Question[] = [];
	const correct: Question[] = [];

	for (const q of available) {
		const record = progress.questions[q.id];
		if (!record || record.attempts === 0) {
			unanswered.push(q);
		} else if (record.correctCount === 0) {
			if (q.java_trap) {
				wrongJavaTrap.push(q);
			} else {
				wrong.push(q);
			}
		} else if (record.correctCount < record.attempts) {
			// answered wrong at least once
			wrong.push(q);
		} else {
			correct.push(q);
		}
	}

	const selected: Question[] = [];

	const take = (pool: Question[], count: number): Question[] => {
		if (pool.length === 0) return [];
		const shuffled = shuffle(pool);
		return shuffled.slice(0, Math.min(count, shuffled.length));
	};

	// Priority 1: wrong java_trap
	selected.push(...take(wrongJavaTrap, SESSION_SIZE - selected.length));

	// Priority 2: wrong non-java_trap
	if (selected.length < SESSION_SIZE) {
		selected.push(...take(wrong, SESSION_SIZE - selected.length));
	}

	// Priority 3: unanswered
	if (selected.length < SESSION_SIZE) {
		selected.push(...take(unanswered, SESSION_SIZE - selected.length));
	}

	// Priority 4: correct
	if (selected.length < SESSION_SIZE) {
		selected.push(...take(correct, SESSION_SIZE - selected.length));
	}

	// If still not enough, use all questions (reset scenario)
	if (selected.length < SESSION_SIZE) {
		const fallback = allQuestions.filter((q) => !selected.some((s) => s.id === q.id));
		selected.push(...take(fallback, SESSION_SIZE - selected.length));
	}

	return selected.slice(0, SESSION_SIZE);
};

export const getSessionQuestions = (
	allQuestions: Question[],
	questionIds: string[]
): Question[] => {
	return questionIds
		.map((id) => allQuestions.find((q) => q.id === id))
		.filter((q): q is Question => q !== undefined);
};
