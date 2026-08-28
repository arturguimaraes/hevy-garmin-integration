import { MappingSourceEnum } from '@/state'
import type { ExerciseMappingType, MatchCandidateType } from '@/state'

export const GOOD_MATCH_THRESHOLD = 0.5

/** A mapping counts as resolved when it's a manual pick or a confident auto-match. */
export function isGood(m: ExerciseMappingType | undefined): m is ExerciseMappingType {
  return m !== undefined && (m.source === MappingSourceEnum.Manual || m.score >= GOOD_MATCH_THRESHOLD)
}

export function candidateToMapping(
  hevyName: string,
  c: MatchCandidateType,
  source: MappingSourceEnum,
): ExerciseMappingType {
  return {
    hevyName,
    garminCategory: c.category,
    garminExercise: c.exercise,
    garminDisplayName: c.name,
    score: c.score,
    source,
  }
}

/** Identifies one exercise row being edited — routine-scoped so repeated titles don't collide. */
export interface EditTarget {
  rowId: string
  hevyName: string
}
