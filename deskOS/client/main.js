import * as THREE from "three";
import { initScene } from "./renderer/scene.js";
import { RAPIER, initWorld, step } from "./physics/world.js";
import { createBodyFromCatalogItem, mmToM, getHalfExtents } from "./physics/bodies.js";
import { register, get, all } from "./physics/registry.js";
import { enforceHostConstraint } from "./physics/host-constraint.js";
import { syncMeshes } from "./physics/sync.js";
import { initDragControls } from "./interaction/drag-controls.js";

const TYPE_COLORS = {
  desk_top: 0x8a6d4b,
  monitor: 0x222222
};
const DEFAULT_COLOR = 0x888888;
const FLOOR_THICKNESS_M = 0.05;
const DROP_CLEARANCE_M = 0.3;

function boxMesh(dimensions, color) {
  const geometry = new THREE.BoxGeometry(
    mmToM(dimensions.width),
    mmToM(dimensions.height),
    mmToM(dimensions.depth)
  );
  const material = new THREE.MeshStandardMaterial({ color });
  return new THREE.Mesh(geometry, material);
}

function createFloor(world) {
  const halfExtents = { x: 2, y: FLOOR_THICKNESS_M / 2, z: 2 };
  const bodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(0, -halfExtents.y, 0);
  const rigidBody = world.createRigidBody(bodyDesc);
  const colliderDesc = RAPIER.ColliderDesc.cuboid(halfExtents.x, halfExtents.y, halfExtents.z);
  world.createCollider(colliderDesc, rigidBody);
  register("floor", { mesh: null, rigidBody, hostId: null });
  return { rigidBody, halfExtents };
}

function hostTopY(host) {
  const half = getHalfExtents(host.rigidBody);
  return host.rigidBody.translation().y + half.y;
}

function meshColorForType(type) {
  return TYPE_COLORS[type] ?? DEFAULT_COLOR;
}

function placeProducts(scene, products) {
  const queue = [...products];

  while (queue.length > 0) {
    const remaining = [];
    let placedThisPass = 0;

    for (const product of queue) {
      const hostSku = product.placement?.hostSku ?? null;
      const hostId = hostSku ?? "floor";
      const host = get(hostId);

      if (!host) {
        remaining.push(product);
        continue;
      }

      const isAnchored = hostSku == null;
      const productHalfHeight = mmToM(product.dimensions.height) / 2;
      const y = isAnchored
        ? hostTopY(host) + productHalfHeight
        : hostTopY(host) + productHalfHeight + DROP_CLEARANCE_M;

      const { rigidBody } = createBodyFromCatalogItem(product, {
        position: { x: 0, y, z: 0 },
        fixed: isAnchored
      });
      const mesh = boxMesh(product.dimensions, meshColorForType(product.type));
      scene.add(mesh);
      register(product.sku, { mesh, rigidBody, hostId });
      placedThisPass += 1;
    }

    if (placedThisPass === 0) {
      const leftover = remaining.map((p) => p.sku).join(", ");
      console.error(
        `Could not place products; host is missing or cyclic: ${leftover}`
      );
      break;
    }

    queue.length = 0;
    queue.push(...remaining);
  }
}

async function main() {
  const catalog = await fetch("/api/catalog").then((res) => res.json());

  const canvas = document.getElementById("scene-canvas");
  const world = await initWorld();

  const { scene, camera, controls } = initScene(canvas, {
    onFrame: () => {
      step();
      for (const id of all().keys()) {
        enforceHostConstraint(id);
      }
      syncMeshes();
    }
  });

  createFloor(world);
  placeProducts(scene, catalog.products);

  initDragControls({ camera, canvas, controls });
}

main().catch((err) => {
  console.error("deskOS failed to start:", err);
});
