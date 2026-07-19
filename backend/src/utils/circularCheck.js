/**
 * Detects whether assigning `proposedManagerId` as the reporting manager of
 * `employeeId` would create a circular reporting chain (including the
 * trivial self-management cycle).
 *
 * @param {string} employeeId - id of the employee being updated
 * @param {string|null} proposedManagerId - id of the proposed manager (or null to clear)
 * @param {(id: string) => Promise<string|null>} getManagerId - async lookup:
 *        given an employee id, returns that employee's current manager id (or null)
 * @param {number} [maxDepth=1000] - safety cap against pathological/corrupt data
 * @returns {Promise<boolean>} true if the assignment WOULD create a cycle
 */
async function wouldCreateCycle(employeeId, proposedManagerId, getManagerId, maxDepth = 1000) {
  if (!proposedManagerId) return false; // clearing the manager can never cycle

  const empId = String(employeeId);
  let currentId = String(proposedManagerId);

  if (currentId === empId) return true; // self-management

  const visited = new Set();
  let depth = 0;

  while (currentId) {
    if (currentId === empId) return true;
    if (visited.has(currentId)) return true; // pre-existing cycle in the data
    visited.add(currentId);

    if (++depth > maxDepth) return true; // treat runaway chains as unsafe

    const next = await getManagerId(currentId);
    if (!next) break;
    currentId = String(next);
  }

  return false;
}

module.exports = { wouldCreateCycle };
