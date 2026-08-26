/**
 * Indian Rupee & Financial Formatter Utilities
 * Follows RBI & en-IN standard formatting (e.g. ₹12,00,000 or ₹2.4 Cr)
 */

export function formatINR(amount: number, compact: boolean = false): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return "₹0";
  }

  if (compact) {
    if (amount >= 10000000) {
      const cr = amount / 10000000;
      return `₹${cr % 1 === 0 ? cr : cr.toFixed(1)} Cr`;
    }
    if (amount >= 100000) {
      const l = amount / 100000;
      return `₹${l % 1 === 0 ? l : l.toFixed(1)} L`;
    }
    if (amount >= 1000) {
      const k = amount / 1000;
      return `₹${k % 1 === 0 ? k : k.toFixed(1)} K`;
    }
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumberIN(num: number): string {
  if (isNaN(num) || num === null || num === undefined) {
    return "0";
  }
  return new Intl.NumberFormat("en-IN").format(num);
}

export function parseINR(str: string): number {
  const cleaned = str.replace(/[^0-9]/g, "");
  return cleaned ? parseInt(cleaned, 10) : 0;
}
