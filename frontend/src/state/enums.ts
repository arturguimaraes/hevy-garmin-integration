export enum ActionTypeEnum {
  RoutinesLoaded = 'ROUTINES_LOADED',
  RoutineToggled = 'ROUTINE_TOGGLED',
  AllRoutinesToggled = 'ALL_ROUTINES_TOGGLED',
  MappingUpdated = 'MAPPING_UPDATED',
  MappingsBulkLoaded = 'MAPPINGS_BULK_LOADED',
  GarminEmailChanged = 'GARMIN_EMAIL_CHANGED',
  GarminPasswordChanged = 'GARMIN_PASSWORD_CHANGED',
  GarminAuthenticated = 'GARMIN_AUTHENTICATED',
  GarminSessionExpired = 'GARMIN_SESSION_EXPIRED',
  WorkoutPrefixChanged = 'WORKOUT_PREFIX_CHANGED',
  PushResultsCleared = 'PUSH_RESULTS_CLEARED',
  PushResultAdded = 'PUSH_RESULT_ADDED',
  NextStep = 'NEXT_STEP',
  PrevStep = 'PREV_STEP',
  Reset = 'RESET',
}

export enum MappingSourceEnum {
  Auto = 'auto',
  Manual = 'manual',
}
