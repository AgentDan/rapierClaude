// Central lookup for every physics-backed object in the scene.
// id -> { mesh, rigidBody, hostId }
const registry = new Map();

function register(id, entry) {
  registry.set(id, entry);
}

function unregister(id) {
  registry.delete(id);
}

function get(id) {
  return registry.get(id);
}

function all() {
  return registry;
}

export { registry, register, unregister, get, all };
