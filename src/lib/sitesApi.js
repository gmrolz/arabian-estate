/**
 * Sites API — stub. Sites functionality is not used in Arabian Estate.
 * This file exists so any remaining imports compile without errors.
 */
export async function fetchSites() {
  return { data: [], error: null };
}

export async function createSite(site) {
  return { data: null, error: { message: 'Not implemented' } };
}

export async function updateSite(id, site) {
  return { data: null, error: { message: 'Not implemented' } };
}
