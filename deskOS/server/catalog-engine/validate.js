const REQUIRED_FIELDS = ["sku", "type", "dimensions", "priceEur"];

function validateCatalog(catalog) {
  const errors = [];

  if (!catalog || !Array.isArray(catalog.products)) {
    throw new Error("Catalog is invalid: missing \"products\" array");
  }

  const seenSkus = new Set();

  for (const product of catalog.products) {
    const label = product && product.sku ? product.sku : "<unknown sku>";

    for (const field of REQUIRED_FIELDS) {
      if (product[field] === undefined || product[field] === null || product[field] === "") {
        errors.push(`Product "${label}" is missing required field "${field}"`);
      }
    }

    if (product.sku) {
      if (seenSkus.has(product.sku)) {
        errors.push(`Duplicate sku found: "${product.sku}"`);
      }
      seenSkus.add(product.sku);
    }

    if (product.type && catalog.types && !catalog.types[product.type]) {
      errors.push(`Product "${label}" references unknown type "${product.type}"`);
    }
  }

  const hostBySku = new Map();
  for (const product of catalog.products) {
    const hostSku = product && product.placement && product.placement.hostSku;
    if (!hostSku) continue;

    const label = product.sku ? product.sku : "<unknown sku>";

    if (hostSku === product.sku) {
      errors.push(`Product "${label}" placement.hostSku refers to itself`);
      continue;
    }

    if (!seenSkus.has(hostSku)) {
      errors.push(`Product "${label}" placement.hostSku "${hostSku}" does not exist in catalog`);
      continue;
    }

    if (product.sku) {
      hostBySku.set(product.sku, hostSku);
    }
  }

  for (const sku of hostBySku.keys()) {
    const visited = new Set();
    let current = sku;
    while (current && hostBySku.has(current)) {
      if (visited.has(current)) {
        errors.push(`Circular placement chain detected involving "${sku}"`);
        break;
      }
      visited.add(current);
      current = hostBySku.get(current);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Catalog validation failed:\n  - ${errors.join("\n  - ")}`);
  }

  return true;
}

export { validateCatalog };
