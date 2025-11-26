/**
 * ID Generation Utilities
 * 
 * Generates prefixed IDs using CUID2 for collision-resistant, 
 * URL-safe identifiers following industry best practices (Stripe, OpenAI pattern).
 */

import { init } from '@paralleldrive/cuid2'

const createId = init({ length: 12 });
/**
 * Generate a prefixed ID with CUID2
 * 
 * @param prefix - The prefix to use (e.g., 'prof', 'cont', 'usr')
 * @returns A prefixed ID string (e.g., 'prof_xK9j2mP4nQ8rL5tY7vW3zB1c')
 * 
 * @example
 * const profileId = generatePrefixedId('prof')
 * // Returns: 'prof_clx2k9j3m0000qzrmn1b2c3d4'
 */
export function generatePrefixedId(prefix: string): string {
  return `${prefix}_${createId()}`
}

/**
 * Prefix registry for reference
 * 
 * - prof_: Profile
 * - cont_: Contact Info
 * - usr_: User (future auth system)
 */

