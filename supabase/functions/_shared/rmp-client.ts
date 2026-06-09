import type { RmpProfessorSummary, RmpReviewRow } from './types.ts'

const RMP_GRAPHQL = 'https://www.ratemyprofessors.com/graphql'
const RMP_AUTH = 'Basic dGVzdDp0ZXN0'
/** Georgia Tech — legacy school id 361 */
const GT_SCHOOL_NODE_ID = 'U2Nob29sLTM2MQ=='

const SEARCH_QUERY = `query NewSearchTeachersQuery($query: TeacherSearchQuery!) {
  newSearch {
    teachers(query: $query) {
      edges {
        node {
          id
          legacyId
          firstName
          lastName
          department
          avgRating
          avgDifficulty
          numRatings
          wouldTakeAgainPercentRounded
        }
      }
    }
  }
}`

const RATINGS_QUERY = `query TeacherRatingsListQuery($id: ID!, $after: String) {
  node(id: $id) {
    ... on Teacher {
      legacyId
      avgRating
      avgDifficulty
      numRatings
      wouldTakeAgainPercentRounded
      department
      ratings(first: 50, after: $after) {
        edges {
          node {
            id
            legacyId
            comment
            class
            clarityRating
            difficultyRating
            wouldTakeAgain
            date
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
}`

async function rmpGraphql<T>(
	query: string,
	variables: Record<string, unknown>,
): Promise<T> {
	const res = await fetch(RMP_GRAPHQL, {
		method: 'POST',
		headers: {
			Authorization: RMP_AUTH,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ query, variables }),
	})
	if (!res.ok) throw new Error(`RMP GraphQL failed: ${res.status}`)
	const payload = await res.json()
	if (payload.errors?.length) {
		throw new Error(payload.errors[0].message ?? 'RMP GraphQL error')
	}
	return payload.data as T
}

export async function searchRmpProfessors(
	query: string,
): Promise<RmpProfessorSummary[]> {
	const data = await rmpGraphql<{
		newSearch: {
			teachers: {
				edges: Array<{
					node: {
						id: string
						legacyId: number
						firstName: string
						lastName: string
						department: string | null
						avgRating: number
						avgDifficulty: number
						numRatings: number
						wouldTakeAgainPercentRounded: number | null
					}
				}>
			}
		}
	}>(SEARCH_QUERY, {
		query: { text: query, schoolID: GT_SCHOOL_NODE_ID },
	})

	return (data.newSearch?.teachers?.edges ?? []).map(({ node }) => ({
		rmpProfessorId: String(node.legacyId),
		rmpNodeId: node.id,
		name: `${node.firstName} ${node.lastName}`.trim(),
		firstName: node.firstName,
		lastName: node.lastName,
		department: node.department,
		quality: node.avgRating,
		difficulty: node.avgDifficulty,
		wouldTakeAgain: node.wouldTakeAgainPercentRounded,
		ratingCount: node.numRatings,
	}))
}

export async function fetchRmpProfessorProfile(
	rmpNodeId: string,
): Promise<{
	summary: RmpProfessorSummary
	reviews: RmpReviewRow[]
}> {
	const reviews: RmpReviewRow[] = []
	let after: string | null = null
	let summary: RmpProfessorSummary | null = null

	do {
		const data = await rmpGraphql<{
			node: {
				legacyId: number
				avgRating: number
				avgDifficulty: number
				numRatings: number
				wouldTakeAgainPercentRounded: number | null
				department: string | null
				ratings: {
					edges: Array<{
						node: {
							id: string
							legacyId: number
							comment: string | null
							class: string | null
							clarityRating: number
							difficultyRating: number
							wouldTakeAgain: number | null
							date: string | null
						}
					}>
					pageInfo: { hasNextPage: boolean; endCursor: string | null }
				}
			} | null
		}>(RATINGS_QUERY, { id: rmpNodeId, after })

		const teacher = data.node
		if (!teacher) break

		if (!summary) {
			summary = {
				rmpProfessorId: String(teacher.legacyId),
				rmpNodeId,
				name: '',
				department: teacher.department,
				quality: teacher.avgRating,
				difficulty: teacher.avgDifficulty,
				wouldTakeAgain: teacher.wouldTakeAgainPercentRounded,
				ratingCount: teacher.numRatings,
			}
		}

		for (const { node } of teacher.ratings?.edges ?? []) {
			reviews.push({
				externalReviewId: String(node.legacyId),
				rating: Math.round(node.clarityRating),
				difficulty: node.difficultyRating,
				wouldTakeAgain: node.wouldTakeAgain === 1
					? true
					: node.wouldTakeAgain === 0
					? false
					: null,
				comment: node.comment,
				courseContext: node.class,
				termContext: node.date,
			})
		}

		const pageInfo = teacher.ratings?.pageInfo
		if (!pageInfo?.hasNextPage) break
		after = pageInfo.endCursor
	} while (after)

	if (!summary) {
		throw new Error(`RMP teacher not found: ${rmpNodeId}`)
	}

	return { summary, reviews }
}
