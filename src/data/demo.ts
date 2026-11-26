import type { Customer, Product } from '@/types/domain';

/**
 * Dados de demonstração — os MESMOS das telas do Figma (SPEC §11). Usados quando não há .env.
 * Mantenha a coerência: venda #1048 = R$ 456,32; caixa do dia = R$ 3.842,70 líquido.
 */
export const demoProducts: Product[] = [
  { id: 'p1', code: 'MET3020', name: 'Metalon 30x20 #18 6m', category_id: 'metalon', description: null, photo_url: null, cost_cents: 6140, price_cents: 8990, stock_qty: 24, min_stock: 5, active: true },
  { id: 'p2', code: 'CHG20', name: 'Chapa galvanizada nº 20', category_id: 'chapas', description: null, photo_url: null, cost_cents: 9800, price_cents: 14500, stock_qty: 3, min_stock: 5, active: true },
  { id: 'p3', code: 'PVC100', name: 'Tubo PVC 100mm 6m', category_id: 'hidraulica', description: null, photo_url: null, cost_cents: 5200, price_cents: 7950, stock_qty: 12, min_stock: 4, active: true },
  { id: 'p4', code: 'CIM50', name: 'Cimento CP-II 50kg', category_id: 'basicos', description: null, photo_url: null, cost_cents: 2900, price_cents: 3890, stock_qty: 0, min_stock: 10, active: true },
  { id: 'p5', code: 'DSC7', name: 'Disco de corte 7"', category_id: 'abrasivos', description: null, photo_url: null, cost_cents: 750, price_cents: 1290, stock_qty: 40, min_stock: 10, active: true },
  { id: 'p6', code: 'FVR18', name: 'Fita veda-rosca 18mm', category_id: 'hidraulica', description: null, photo_url: null, cost_cents: 210, price_cents: 450, stock_qty: 65, min_stock: 10, active: true },
  { id: 'p7', code: 'PSX14-2', name: 'Parafuso sextavado 1/4"', category_id: 'fixacao', description: null, photo_url: null, cost_cents: 22, price_cents: 45, stock_qty: 500, min_stock: 100, active: true },
  { id: 'p8', code: 'TRN12', name: 'Torneira plástica 1/2"', category_id: 'hidraulica', description: null, photo_url: null, cost_cents: 520, price_cents: 990, stock_qty: 6, min_stock: 2, active: false },
];

export const demoCategories = [
  { id: 'metalon', name: 'Metalon' }, { id: 'chapas', name: 'Chapas' }, { id: 'hidraulica', name: 'Hidráulica' },
  { id: 'eletrica', name: 'Elétrica' }, { id: 'basicos', name: 'Básicos' }, { id: 'fixacao', name: 'Fixação' }, { id: 'abrasivos', name: 'Abrasivos' },
];

export const demoCustomers: Customer[] = [
  { id: 'c1', name: 'Ana Lúcia Rocha', phone: '(61) 9 9811-2034', created_at: '2026-10-01' },
  { id: 'c2', name: 'Construtora Bom Tijolo', phone: '(61) 3344-1200', created_at: '2026-09-12' },
  { id: 'c3', name: 'Marcos Pereira', phone: '(61) 9 8123-4455', created_at: '2026-11-24' },
];
