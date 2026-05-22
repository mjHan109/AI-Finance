/**
 * Financial flow calculation helpers.
 *
 * Savings Rate = (savings + investment) / income
 *
 * Transactions categorised as TRANSFER (계좌이체, 카드대금 etc.) are excluded
 * from both expense and savings calculations so they don't distort metrics.
 */

export type CategoryFlowType = "CONSUMPTION" | "SAVINGS" | "INVESTMENT" | "TRANSFER";

export interface FlowSummary {
  income: number;
  consumption: number;
  savings: number;
  investment: number;
  transfer: number;
  /** (savings + investment) / income, or null if income = 0 */
  savingsRate: number | null;
}

export function computeFlowSummary(
  income: number,
  expenseRows: { amount: number; flowType: CategoryFlowType | null }[],
): FlowSummary {
  let consumption = 0;
  let savings     = 0;
  let investment  = 0;
  let transfer    = 0;

  for (const row of expenseRows) {
    const ft = row.flowType ?? "CONSUMPTION";
    if      (ft === "SAVINGS")    savings    += row.amount;
    else if (ft === "INVESTMENT") investment += row.amount;
    else if (ft === "TRANSFER")   transfer   += row.amount;
    else                          consumption += row.amount;
  }

  const savingsRate = income > 0
    ? Math.round(((savings + investment) / income) * 100)
    : null;

  return { income, consumption, savings, investment, transfer, savingsRate };
}
