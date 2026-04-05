/**
 * Environmental impact estimation for MedMarket transactions.
 *
 * Methodology
 * ───────────
 * Each delivered order represents medicines that were redirected before expiry,
 * avoiding pharmaceutical waste disposal (incineration).
 *
 * AVG_UNIT_WEIGHT_KG — 50 g per unit (conservative average for hospital prescription
 *   medicines: vials, blister packs, ampoules). Sourced from EMA packaging guidelines.
 *
 * CO2_PER_KG_WASTE — 6 kg CO₂e per kg of pharmaceutical waste prevented:
 *   • Avoided high-temperature incineration:  ~1.5 kg CO₂e/kg
 *   • Avoided embodied carbon (manufacturing + supply chain): ~4.5 kg CO₂e/kg
 *   Aligned with EPA pharmaceutical waste lifecycle guidance and EMA Environmental
 *   Risk Assessment framework.
 */

/** Average weight of one pharmaceutical unit in kg. */
export const AVG_UNIT_WEIGHT_KG = 0.05;

/** kg CO₂e avoided per kg of pharmaceutical waste prevented from disposal. */
export const CO2_PER_KG_WASTE = 6.0;

export interface ImpactInput {
  quantity: number;
  /** Already converted to plain number (not Prisma Decimal). */
  totalPrice: number;
}

export interface ImpactData {
  /** Total medicine units redirected from disposal. */
  unitsTransacted: number;
  /** Pharmaceutical waste avoided in kg. */
  wasteKg: number;
  /** CO₂ equivalent emissions prevented in kg. */
  co2Kg: number;
  /** Total medicine value recovered in EUR. */
  valueEur: number;
}

export function computeImpact(orders: ImpactInput[]): ImpactData {
  const unitsTransacted = orders.reduce((s, o) => s + o.quantity, 0);
  const valueEur = orders.reduce((s, o) => s + o.totalPrice, 0);
  const wasteKg = unitsTransacted * AVG_UNIT_WEIGHT_KG;
  const co2Kg = wasteKg * CO2_PER_KG_WASTE;
  return {
    unitsTransacted,
    wasteKg: Math.round(wasteKg * 10) / 10,
    co2Kg: Math.round(co2Kg * 10) / 10,
    valueEur,
  };
}
