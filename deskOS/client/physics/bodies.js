import { RAPIER, getWorld } from "./world.js";

const MM_TO_M = 1 / 1000;

// The only place mm (catalog units) is converted to m (physics units).
function mmToM(mm) {
  return mm * MM_TO_M;
}

function createBodyFromCatalogItem(item, { position = { x: 0, y: 0, z: 0 }, fixed = false } = {}) {
  const world = getWorld();

  const halfExtents = {
    x: mmToM(item.dimensions.width) / 2,
    y: mmToM(item.dimensions.height) / 2,
    z: mmToM(item.dimensions.depth) / 2
  };

  const bodyDesc = fixed
    ? RAPIER.RigidBodyDesc.fixed()
    : RAPIER.RigidBodyDesc.dynamic();
  bodyDesc.setTranslation(position.x, position.y, position.z);

  const rigidBody = world.createRigidBody(bodyDesc);

  const colliderDesc = RAPIER.ColliderDesc.cuboid(halfExtents.x, halfExtents.y, halfExtents.z);
  world.createCollider(colliderDesc, rigidBody);

  return { rigidBody, halfExtents };
}

function getHalfExtents(rigidBody) {
  return rigidBody.collider(0).shape.halfExtents;
}

export { createBodyFromCatalogItem, mmToM, getHalfExtents };
