// ── Hevy data ─────────────────────────────────────────────────────────────────

export interface HevySet {
  type?: string; // "warmup" | "normal" | null
  reps?: number;
  weight_kg?: number;
  duration_seconds?: number;
}

export interface HevyExercise {
  title: string;
  sets: HevySet[];
  rest_seconds?: number;
}

export interface HevyRoutine {
  id: string;
  title: string;
  folder_id?: string | null;
  exercises: HevyExercise[];
}

// ── Exercise mapping ───────────────────────────────────────────────────────────

export interface MatchCandidate {
  name: string;
  category: string;
  exercise: string;
  score: number;
}

export interface ExerciseMapping {
  hevyName: string;
  garminCategory: string;
  garminExercise: string;
  garminDisplayName: string;
  score: number;
  source: 'auto' | 'manual';
}

// ── Push results ──────────────────────────────────────────────────────────────

export interface PushResult {
  title: string;
  workoutId: string | null;
  error: string | null;
}

// ── Wizard state ──────────────────────────────────────────────────────────────

export interface WizardState {
  step: 1 | 2 | 3 | 4 | 5;

  // Step 1 — stored in state only, never localStorage
  hevyApiKey: string;
  hevyUsername: string | null;

  // Step 2
  routines: HevyRoutine[];
  selectedRoutineIds: string[];

  // Step 3
  // Mappings ARE allowed in localStorage — they are not credentials.
  // Persisting them means returning users skip the review screen.
  mappings: Record<string, ExerciseMapping>;

  // Step 4 — stored in state only, never localStorage
  garminEmail: string;
  garminPassword: string;
  garminToken: string | null;
  garminSessionId: string | null;
  workoutNamePrefix: string;

  // Step 5
  pushResults: PushResult[];
}

// ── Wizard actions ─────────────────────────────────────────────────────────────

export type WizardAction =
  | { type: 'HEVY_KEY_CHANGED'; key: string }
  | { type: 'HEVY_VALIDATED'; username: string | null }
  | { type: 'ROUTINES_LOADED'; routines: HevyRoutine[] }
  | { type: 'ROUTINE_TOGGLED'; id: string }
  | { type: 'ALL_ROUTINES_TOGGLED'; selected: boolean }
  | { type: 'MAPPING_UPDATED'; hevyName: string; mapping: ExerciseMapping }
  | { type: 'MAPPINGS_BULK_LOADED'; mappings: Record<string, ExerciseMapping> }
  | { type: 'GARMIN_EMAIL_CHANGED'; email: string }
  | { type: 'GARMIN_PASSWORD_CHANGED'; password: string }
  | { type: 'GARMIN_MFA_PENDING'; sessionId: string }
  | { type: 'GARMIN_MFA_CANCELLED' }
  | { type: 'GARMIN_AUTHENTICATED'; token: string }
  | { type: 'WORKOUT_PREFIX_CHANGED'; prefix: string }
  | { type: 'PUSH_RESULT_ADDED'; result: PushResult }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'RESET' };
