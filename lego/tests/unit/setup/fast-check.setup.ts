/**
 * Fast-check setup and configuration
 * This file configures property-based testing for the project
 * 
 * Fast-check version: 4.5.3
 * Documentation: https://fast-check.dev/
 */

import fc from 'fast-check';

/**
 * Default configuration for property-based tests
 * All PBT tests should use at least these settings
 */
export const defaultPBTConfig: fc.Parameters<unknown> = {
  numRuns: 100,  // Minimum 100 iterations per property test
  verbose: false,
  seed: undefined, // Use random seed, can be set for reproducibility
};

/**
 * Extended configuration for more thorough testing
 */
export const thoroughPBTConfig: fc.Parameters<unknown> = {
  numRuns: 1000,
  verbose: true,
  seed: undefined,
};

/**
 * Example usage of fast-check with TypeScript:
 * 
 * import fc from 'fast-check';
 * import { defaultPBTConfig } from '../setup/fast-check.setup';
 * 
 * it('should satisfy property', () => {
 *   fc.assert(
 *     fc.property(
 *       fc.integer(),
 *       fc.string(),
 *       fc.boolean(),
 *       fc.constant(null),
 *       (num, str, bool, _) => {
 *         // Test logic here
 *         return true; // or use expect() assertions
 *       }
 *     ),
 *     defaultPBTConfig
 *   );
 * });
 * 
 * Note: fc.property in v4 requires exactly 4 arguments:
 * - 3 arbitraries (data generators)
 * - 1 predicate function
 * 
 * If you need fewer inputs, use fc.constant() for unused parameters.
 * If you need more inputs, use fc.tuple() or fc.record().
 */

export { fc };

