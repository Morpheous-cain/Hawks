/**
 * Kenyan payroll calculator (simplified, current tax bands).
 * PAYE: progressive bands. NSSF: 6% to upper tier 4200 cap. NHIF: scaled. NITA: 50/month.
 * Inputs basic + allowances → returns gross/paye/nhif/nssf/nita/net.
 */
export interface PayslipCalc {
  basic: number; allowances: number; gross: number;
  paye: number; nhif: number; nssf: number; nita: number;
  other_deductions: number; net: number;
}

export function computePAYE(taxable: number): number {
  // 2024 bands (KES/month)
  let tax = 0;
  const bands = [
    { upTo: 24000, rate: 0.10 },
    { upTo: 32333, rate: 0.25 },
    { upTo: 500000, rate: 0.30 },
    { upTo: 800000, rate: 0.325 },
    { upTo: Infinity, rate: 0.35 },
  ];
  let prev = 0;
  for (const b of bands) {
    if (taxable <= prev) break;
    const slice = Math.min(taxable, b.upTo) - prev;
    tax += slice * b.rate;
    prev = b.upTo;
  }
  // personal relief 2400
  return Math.max(0, tax - 2400);
}

export function computeNHIF(gross: number): number {
  if (gross < 6000) return 150;
  if (gross < 8000) return 300;
  if (gross < 12000) return 400;
  if (gross < 15000) return 500;
  if (gross < 20000) return 600;
  if (gross < 25000) return 750;
  if (gross < 30000) return 850;
  if (gross < 35000) return 900;
  if (gross < 40000) return 950;
  if (gross < 45000) return 1000;
  if (gross < 50000) return 1100;
  if (gross < 60000) return 1200;
  if (gross < 70000) return 1300;
  if (gross < 80000) return 1400;
  if (gross < 90000) return 1500;
  if (gross < 100000) return 1600;
  return 1700;
}

export function computeNSSF(gross: number): number {
  // Tier I (1-7000) 6% + Tier II (7001-36000) 6% capped at 4320 total (employee)
  const t1 = Math.min(gross, 7000) * 0.06;
  const t2 = Math.max(0, Math.min(gross, 36000) - 7000) * 0.06;
  return Math.round(t1 + t2);
}

export function computePayslip(basic: number, allowances: number, otherDeductions = 0): PayslipCalc {
  const gross = basic + allowances;
  const nssf = computeNSSF(gross);
  const taxable = gross - nssf;
  const paye = Math.round(computePAYE(taxable));
  const nhif = computeNHIF(gross);
  const nita = 50;
  const net = Math.max(0, gross - paye - nhif - nssf - nita - otherDeductions);
  return { basic, allowances, gross, paye, nhif, nssf, nita, other_deductions: otherDeductions, net };
}
