import { ActionTypeEnum, MappingSourceEnum } from './enums'

// ── Hevy data ─────────────────────────────────────────────────────────────────

export interface HevySetType {
  type?: string;
  reps?: number;
  weight_kg?: number;
  duration_seconds?: number;
}

export interface HevyExerciseType {
  title: string;
  sets: HevySetType[];
  rest_seconds?: number;
}

export interface HevyRoutineType {
  id: string;
  title: string;
  folder_id?: string | null;
  exercises: HevyExerciseType[];
}

// ── Exercise mapping ───────────────────────────────────────────────────────────

export interface MatchCandidateType {
  name: string;
  category: string;
  exercise: string;
  score: number;
}

export interface ExerciseMappingType {
  hevyName: string;
  garminCategory: string;
  garminExercise: string;
  garminDisplayName: string;
  score: number;
  source: MappingSourceEnum;
}

// ── Push results ──────────────────────────────────────────────────────────────

export interface PushResultType {
  title: string;
  workoutId: string | null;
  error: string | null;
}

// ── Wizard state ──────────────────────────────────────────────────────────────

export interface WizardStateType {
  step: 1 | 2 | 3 | 4 | 5;

  hevyApiKey: string;
  hevyUsername: string | null;

  routines: HevyRoutineType[];
  selectedRoutineIds: string[];

  // Persisted to localStorage (not credentials)
  mappings: Record<string, ExerciseMappingType>;

  garminEmail: string;
  garminPassword: string;
  garminToken: string | null;
  garminSessionId: string | null;
  workoutNamePrefix: string;

  pushResults: PushResultType[];
}

// ── Wizard actions ─────────────────────────────────────────────────────────────

export type WizardActionType =
  | { type: ActionTypeEnum.HevyKeyChanged; key: string }
  | { type: ActionTypeEnum.HevyValidated; username: string | null }
  | { type: ActionTypeEnum.RoutinesLoaded; routines: HevyRoutineType[] }
  | { type: ActionTypeEnum.RoutineToggled; id: string }
  | { type: ActionTypeEnum.AllRoutinesToggled; selected: boolean }
  | { type: ActionTypeEnum.MappingUpdated; hevyName: string; mapping: ExerciseMappingType }
  | { type: ActionTypeEnum.MappingsBulkLoaded; mappings: Record<string, ExerciseMappingType> }
  | { type: ActionTypeEnum.GarminEmailChanged; email: string }
  | { type: ActionTypeEnum.GarminPasswordChanged; password: string }
  | { type: ActionTypeEnum.GarminMfaPending; sessionId: string }
  | { type: ActionTypeEnum.GarminMfaCancelled }
  | { type: ActionTypeEnum.GarminAuthenticated; token: string }
  | { type: ActionTypeEnum.GarminSessionExpired }
  | { type: ActionTypeEnum.WorkoutPrefixChanged; prefix: string }
  | { type: ActionTypeEnum.PushResultAdded; result: PushResultType }
  | { type: ActionTypeEnum.NextStep }
  | { type: ActionTypeEnum.PrevStep }
  | { type: ActionTypeEnum.Reset };
