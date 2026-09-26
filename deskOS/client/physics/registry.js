// Central lookup for every physics-backed object in the scene.
// id -> { mesh, rigidBody }
const registry = new Map();

function register(id, entry) {
  registry.set(id, entry);
}

function get(id) {
  return registry.get(id);
}

function all() {
  return registry;
}

export { register, get, all };
