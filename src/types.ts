/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface RABItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

export interface RABCategory {
  id: string;
  name: string;
  items: RABItem[];
}

export interface RABProject {
  id: string;
  title: string;
  description: string;
  categories: RABCategory[];
  taxRate: number; // e.g., 0.11 for 11%
  discount: number;
}
