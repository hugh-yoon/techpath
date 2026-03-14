/**
 * Generates plausible random instructor names per department.
 * Names are synthetic and not real GT faculty.
 */
const FIRST_NAMES = [
	'James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda',
	'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
	'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa',
	'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley',
	'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle',
	'Kenneth', 'Carol', 'Kevin', 'Amanda', 'Brian', 'Dorothy', 'George', 'Melissa',
]

const LAST_NAMES = [
	'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
	'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
	'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
	'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
	'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen',
	'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera',
	'Campbell', 'Mitchell', 'Carter', 'Roberts', 'Chen', 'Phillips', 'Evans',
]

function shuffle<T>(arr: T[]): T[] {
	const out = [...arr]
	for (let i = out.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[out[i], out[j]] = [out[j], out[i]]
	}
	return out
}

/**
 * Deterministic "random" index from string seed (so same department yields same names).
 */
function seededIndex(seed: string, max: number): number {
	let h = 0
	for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
	return h % max
}

export function generateInstructorNamesForDepartment(
	department: string,
	count: number,
): string[] {
	const names = new Set<string>()
	const firstShuffle = shuffle(FIRST_NAMES)
	const lastShuffle = shuffle(LAST_NAMES)
	let n = 0
	for (let i = 0; i < 200 && names.size < count; i++) {
		const fi = (seededIndex(department + i, firstShuffle.length) + n) % firstShuffle.length
		const li = (seededIndex(department + 'x' + i, lastShuffle.length) + n) % lastShuffle.length
		names.add(`${firstShuffle[fi]} ${lastShuffle[li]}`)
		n++
	}
	return Array.from(names).slice(0, count)
}
