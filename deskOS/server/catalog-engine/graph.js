// Compatibility rules between product types (by type, not sku).
const RULES = [
  { type: "monitor", requires: "desk_top" }
];

function checkCompatibility(items) {
  const typesPresent = new Set(items.map((item) => item.type));
  const problems = [];

  for (const rule of RULES) {
    if (typesPresent.has(rule.type) && !typesPresent.has(rule.requires)) {
      problems.push(`"${rule.type}" requires "${rule.requires}" to be present`);
    }
  }

  return {
    compatible: problems.length === 0,
    problems
  };
}

export { checkCompatibility };
