// productUtils.ts

const normalizeUnit = (unit?: string): string => {
  return String(unit ?? "").trim().toLowerCase();
};

export const getTotalItemQuantity = (
  isLoose: boolean,
  finalCartQty: number,
  product: any
) => {
  const qty = Number(finalCartQty ?? 0);

  // Loose product
  if (isLoose) {
    return {
      quantity: qty,
      unit: normalizeUnit(product?.unit) || "kg",
    };
  }

  const packetSize = Number(product?.packetSize ?? 1);
  const packetUnit = normalizeUnit(product?.packetUnit);

  let total = qty * packetSize;
  let unit = packetUnit;

  switch (packetUnit) {
    case "g":
    case "gm":
    case "gram":
    case "grams":
      if (total >= 1000) {
        total = total / 1000;
        unit = "kg";
      } else {
        unit = "g";
      }
      break;

    case "kg":
    case "kilogram":
    case "kilograms":
      unit = "kg";
      break;

    case "ml":
    case "millilitre":
    case "milliliter":
      if (total >= 1000) {
        total = total / 1000;
        unit = "l";
      } else {
        unit = "ml";
      }
      break;

    case "l":
    case "ltr":
    case "liter":
    case "litre":
      unit = "l";
      break;

    case "piece":
    case "pieces":
    case "pc":
    case "pcs":
      unit = "piece";
      total = qty;
      break;

    case "packet":
    case "pack":
      unit = "packet";
      total = qty;
      break;

    default:
      unit = packetUnit;
  }

  return {
    quantity: Number(total.toFixed(2)),
    unit,
  };
};