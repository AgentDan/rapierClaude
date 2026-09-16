import * as THREE from "three";
import { all, get } from "../physics/registry.js";
import { enforceHostConstraint } from "../physics/host-constraint.js";

// Lets the user drag any registered object (desk, monitor, ...) across a
// horizontal plane at its own height with the mouse/pointer. OrbitControls
// is disabled for the duration of the drag so it doesn't fight for input.
function initDragControls({ camera, canvas, controls }) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const dragPlane = new THREE.Plane();
  const planeHit = new THREE.Vector3();
  const grabOffset = new THREE.Vector3();
  const UP = new THREE.Vector3(0, 1, 0);

  let draggedId = null;
  let draggedY = 0;
  let lastX = 0;
  let lastZ = 0;

  function updatePointer(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  function draggableMeshes() {
    const meshes = [];
    for (const [id, entry] of all()) {
      if (entry.mesh) {
        entry.mesh.userData.dragId = id;
        meshes.push(entry.mesh);
      }
    }
    return meshes;
  }

  function zeroVelocity(rigidBody) {
    if (rigidBody.isDynamic && rigidBody.isDynamic()) {
      rigidBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
      rigidBody.setAngvel({ x: 0, y: 0, z: 0 }, true);
    }
  }

  function onPointerDown(event) {
    updatePointer(event);
    raycaster.setFromCamera(pointer, camera);

    const hit = raycaster.intersectObjects(draggableMeshes(), false)[0];
    if (!hit) return;

    const id = hit.object.userData.dragId;
    const entry = get(id);
    if (!entry) return;

    const pos = entry.rigidBody.translation();
    draggedId = id;
    draggedY = pos.y;
    lastX = pos.x;
    lastZ = pos.z;
    dragPlane.setFromNormalAndCoplanarPoint(UP, hit.point);

    if (raycaster.ray.intersectPlane(dragPlane, planeHit)) {
      grabOffset.set(pos.x - planeHit.x, 0, pos.z - planeHit.z);
    } else {
      grabOffset.set(0, 0, 0);
    }

    zeroVelocity(entry.rigidBody);
    if (controls) controls.enabled = false;
    canvas.style.cursor = "grabbing";
    canvas.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event) {
    if (!draggedId) return;

    updatePointer(event);
    raycaster.setFromCamera(pointer, camera);
    if (!raycaster.ray.intersectPlane(dragPlane, planeHit)) return;

    const entry = get(draggedId);
    if (!entry) return;

    const targetX = planeHit.x + grabOffset.x;
    const targetZ = planeHit.z + grabOffset.z;

    entry.rigidBody.setTranslation({ x: targetX, y: draggedY, z: targetZ }, true);
    zeroVelocity(entry.rigidBody);
    enforceHostConstraint(draggedId); // may clamp the target (e.g. against the host's edge)

    // Use the actual post-clamp position so children move exactly as far as
    // the dragged object really did - not the (possibly further) raw target.
    const actual = entry.rigidBody.translation();
    const dx = actual.x - lastX;
    const dz = actual.z - lastZ;

    // Carry along anything resting on the dragged object, keeping its
    // position relative to the host unchanged (e.g. the monitor on the desk).
    for (const [id, child] of all()) {
      if (child.hostId !== draggedId) continue;
      const childPos = child.rigidBody.translation();
      child.rigidBody.setTranslation(
        { x: childPos.x + dx, y: childPos.y, z: childPos.z + dz },
        true
      );
      zeroVelocity(child.rigidBody);
    }

    lastX = actual.x;
    lastZ = actual.z;
  }

  function endDrag(event) {
    if (!draggedId) return;
    draggedId = null;
    if (controls) controls.enabled = true;
    canvas.style.cursor = "auto";
    if (event) canvas.releasePointerCapture(event.pointerId);
  }

  canvas.style.touchAction = "none";
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
}

export { initDragControls };
