import {
  getAllAttributions,
  getAttributionForSymbol,
  getAttributionSummary,
} from '../../data/sqlite/repositories/attributionRepository';

export const attributionService = {
  getForSymbol: getAttributionForSymbol,
  getAll: getAllAttributions,
  getSummary: getAttributionSummary,
};
