import {
  getAllConcepts,
  getConceptById,
  getConceptsByLabel,
} from '../../data/sqlite/repositories/conceptRepository';
import { normalizeText } from './normalizeText';

export const conceptService = {
  getById: getConceptById,
  getAll: getAllConcepts,
  findByLabel(label: string) {
    return getConceptsByLabel(normalizeText(label, { mapAliases: true }));
  },
};
