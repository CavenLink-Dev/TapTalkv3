import {
  getPreferenceForConcept,
  getPreferencesForUser,
  saveUserSymbolPreference,
} from '../../data/sqlite/repositories/preferenceRepository';

export const userPreferenceService = {
  getForUser: getPreferencesForUser,
  getForConcept: getPreferenceForConcept,
  save: saveUserSymbolPreference,
};
