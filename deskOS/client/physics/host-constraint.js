import { get } from "./registry.js";
import { getHalfExtents } from "./bodies.js";

// Keeps an object's X/Z position within the bounds of its host (e.g. a
// monitor staying on top of a desk), reading the host's position and
// half-extents directly from its rigid body/collider.
function enforceHostConstraint(id) {
  const entry = get(id);
  if (!entry || !entry.hostId) return;

  const host = get(entry.hostId);
  if (!host) return;

  const hostPos = host.rigidBody.translation();
  const hostHalf = getHalfExtents(host.rigidBody);
  const objHalf = getHalfExtents(entry.rigidBody);

  const minX = hostPos.x - hostHalf.x + objHalf.x;
  const maxX = hostPos.x + hostHalf.x - objHalf.x;
  const minZ = hostPos.z - hostHalf.z + objHalf.z;
  const maxZ = hostPos.z + hostHalf.z - objHalf.z;

  const pos = entry.rigidBody.translation();
  const clampedX = Math.min(Math.max(pos.x, minX), maxX);
  const clampedZ = Math.min(Math.max(pos.z, minZ), maxZ);

  if (clampedX !== pos.x || clampedZ !== pos.z) {
    entry.rigidBody.setTranslation({ x: clampedX, y: pos.y, z: clampedZ }, true);
  }
}

export { enforceHostConstraint };
