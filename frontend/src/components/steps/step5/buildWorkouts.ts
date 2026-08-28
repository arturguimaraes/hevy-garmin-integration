import type { ExerciseMappingType, HevyRoutineType } from '@/state'
import type { WorkoutExercisePayloadType } from '@/api'

export function todayIso(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Collapses a Hevy routine's sets into the single sets/reps/weight summary
 * Garmin expects, ignoring warm-up sets and taking the heaviest working set.
 */
export function buildExercises(
  routine: HevyRoutineType,
  mappings: Record<string, ExerciseMappingType>,
): WorkoutExercisePayloadType[] {
  return routine.exercises
    .filter((ex) => mappings[ex.title])
    .map((ex) => {
      const mapping = mappings[ex.title]
      const allSets = ex.sets
      const workSets = allSets.filter((s) => s.type !== 'warmup')
      const activeSets = workSets.length > 0 ? workSets : allSets

      const weighted = activeSets.filter((s) => s.weight_kg != null && s.weight_kg > 0)
      const top =
        weighted.length > 0
          ? weighted.reduce((a, b) => (a.weight_kg! > b.weight_kg! ? a : b))
          : null
      const repCounts = activeSets.map((s) => s.reps).filter((r): r is number => r != null)
      const hasDuration = activeSets.some((s) => s.duration_seconds != null)

      return {
        hevyName: ex.title,
        garminCategory: mapping.garminCategory,
        garminExercise: mapping.garminExercise,
        sets: activeSets.length || 1,
        reps: top?.reps ?? (repCounts.length > 0 ? Math.max(...repCounts) : 10),
        weightKg: top ? Math.round(top.weight_kg! * 10) / 10 : null,
        restSeconds: ex.rest_seconds ?? 90,
        timed: hasDuration && repCounts.length === 0,
      }
    })
}
