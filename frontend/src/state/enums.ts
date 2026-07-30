export enum ActionTypeEnum {
  HevyKeyChanged = 'HEVY_KEY_CHANGED',
  HevyValidated = 'HEVY_VALIDATED',
  RoutinesLoaded = 'ROUTINES_LOADED',
  RoutineToggled = 'ROUTINE_TOGGLED',
  AllRoutinesToggled = 'ALL_ROUTINES_TOGGLED',
  MappingUpdated = 'MAPPING_UPDATED',
  MappingsBulkLoaded = 'MAPPINGS_BULK_LOADED',
  GarminEmailChanged = 'GARMIN_EMAIL_CHANGED',
  GarminPasswordChanged = 'GARMIN_PASSWORD_CHANGED',
  GarminMfaPending = 'GARMIN_MFA_PENDING',
  GarminMfaCancelled = 'GARMIN_MFA_CANCELLED',
  GarminAuthenticated = 'GARMIN_AUTHENTICATED',
  GarminSessionExpired = 'GARMIN_SESSION_EXPIRED',
  WorkoutPrefixChanged = 'WORKOUT_PREFIX_CHANGED',
  PushResultAdded = 'PUSH_RESULT_ADDED',
  NextStep = 'NEXT_STEP',
  PrevStep = 'PREV_STEP',
  Reset = 'RESET',
}

export enum MappingSourceEnum {
  Auto = 'auto',
  Manual = 'manual',
}

export enum GarminLoginStatusEnum {
  Ok = 'ok',
  MfaRequired = 'mfa_required',
}
