import * as THREE from "three";
import { initScene } from "./renderer/scene.js";
import { RAPIER, initWorld, getWorld, step } from "./physics/world.js";
import { createBodyFromCatalogItem, mmToM } from "./physics/bodies.js";
import { register, all } from "./physics/registry.js";
import { enforceHostConstraint } from "./physics/host-constraint.js";
import { syncMeshes } from "./physics/sync.js";
import { initDragControls } from "./interaction/drag-controls.js";

const DESK_COLOR = 0x8a6d4b;
const MONITOR_COLOR = 0x222222;
const FLOOR_THICKNESS_M = 0.05;

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

  const deskItem = catalog.products.find((p) => p.type === "desk_top");
  const monitorItem = catalog.products.find((p) => p.type === "monitor");

  // Desk rests directly on top of the floor.
  const deskHalfHeight = mmToM(deskItem.dimensions.height) / 2;
  const deskY = deskHalfHeight; // floor top is at y = 0
  const { rigidBody: deskBody, halfExtents: deskHalf } = createBodyFromCatalogItem(deskItem, {
    position: { x: 0, y: deskY, z: 0 },
    fixed: true
  });
  const deskMesh = boxMesh(deskItem.dimensions, DESK_COLOR);
  scene.add(deskMesh);
  register("desk", { mesh: deskMesh, rigidBody: deskBody, hostId: "floor" });

  // Monitor spawns above the desk and falls onto it under gravity;
  // enforceHostConstraint() then keeps it from sliding off the edges.
  const deskTopY = deskY + deskHalf.y;
  const monitorHalfHeight = mmToM(monitorItem.dimensions.height) / 2;
  const { rigidBody: monitorBody } = createBodyFromCatalogItem(monitorItem, {
    position: { x: 0, y: deskTopY + monitorHalfHeight + 0.3, z: 0 },
    fixed: false
  });
  const monitorMesh = boxMesh(monitorItem.dimensions, MONITOR_COLOR);
  scene.add(monitorMesh);
  register("monitor", { mesh: monitorMesh, rigidBody: monitorBody, hostId: "desk" });

  initDragControls({ camera, canvas, controls });
}

main().catch((err) => {
  console.error("deskOS failed to start:", err);
});
