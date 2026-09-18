/**
 * Lean V1 side-effect idempotency (engine logic — not a Prisma table yet).
 *
 * For side-effecting nodes (e.g. SEND_EMAIL), derive a deterministic key:
 *   executionId + nodeId + logicalItemId
 *
 * On retry, if an action with this key already succeeded, skip re-sending.
 * Full IdempotencyKey table can be added later if needed.
 */

export type SideEffectKeyParts = {
  executionId: string;
  nodeId: string;
  /** e.g. employee id, candidate id */
  logicalItemId: string;
};

export function buildSideEffectKey(parts: SideEffectKeyParts): string {
  return `${parts.executionId}:${parts.nodeId}:${parts.logicalItemId}`;
}
