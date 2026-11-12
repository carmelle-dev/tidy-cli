/**
 * Compte les fichiers par destination, du plus grand nombre au plus petit.
 * @param {Array<{ destination: string }>} plan
 * @returns {Array<[string, number]>} ex: [['Images', 312], ['Documents', 284]]
 */
export function countByDestination(plan) {
  const counts = new Map();

  for (const { destination } of plan) {
    counts.set(destination, (counts.get(destination) ?? 0) + 1);
  }

  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}