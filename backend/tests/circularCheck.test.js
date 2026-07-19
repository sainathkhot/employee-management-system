const { wouldCreateCycle } = require('../src/utils/circularCheck');

// Simple in-memory org chart for testing: id -> managerId
// CEO(A) <- B <- C <- D   (E is a standalone employee)
const chart = {
  A: null,
  B: 'A',
  C: 'B',
  D: 'C',
  E: null,
};

const lookup = (id) => Promise.resolve(chart[id] ?? null);

describe('wouldCreateCycle', () => {
  test('allows clearing a manager (null) always', async () => {
    expect(await wouldCreateCycle('D', null, lookup)).toBe(false);
  });

  test('rejects an employee being their own manager', async () => {
    expect(await wouldCreateCycle('B', 'B', lookup)).toBe(true);
  });

  test('rejects assigning a descendant as manager (direct cycle)', async () => {
    // D reports (transitively) to A. Making A report to D would cycle.
    expect(await wouldCreateCycle('A', 'D', lookup)).toBe(true);
  });

  test('rejects assigning an indirect descendant as manager', async () => {
    // C is above D. Assigning C's manager to D creates a cycle since D -> C already.
    expect(await wouldCreateCycle('C', 'D', lookup)).toBe(true);
  });

  test('allows a valid new manager with no relation', async () => {
    expect(await wouldCreateCycle('E', 'B', lookup)).toBe(false);
  });

  test('allows reassigning to a manager further up a valid chain', async () => {
    expect(await wouldCreateCycle('D', 'A', lookup)).toBe(false);
  });

  test('detects pre-existing cycles in corrupted data without infinite looping', async () => {
    const corrupt = { X: 'Y', Y: 'X' };
    const corruptLookup = (id) => Promise.resolve(corrupt[id] ?? null);
    expect(await wouldCreateCycle('Z', 'X', corruptLookup)).toBe(true);
  });
});
