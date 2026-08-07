export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
  path: string;
  timestamp: string;
  details?: { errors?: string[] };
}

export type Role = 'ADMIN' | 'SELLER' | 'INVENTORY_MANAGER' | 'MANAGER' | 'AUDITOR';

export interface PageMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  meta: PageMeta;
}

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: Role;
  isActive?: boolean;
  createdAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthSession {
  tokens: AuthTokens;
  user: User;
}

/* ---------------- Catálogo ---------------- */
export interface ProductCode {
  id: number;
  codeType: 'OEM' | 'BARCODE' | 'SKU_ALT';
  codeValue: string;
}

export interface ProductCompat {
  id: number;
  vehicleBrand: string;
  vehicleModel: string;
  yearFrom?: number;
  yearTo?: number;
  engineType?: string;
}

export interface Product {
  id: number;
  sku: string;
  oemCode: string | null;
  name: string;
  category: string | null;
  brand: string | null;
  unit: string;
  stock: number;
  minStock: number;
  costPrice: string;
  basePrice: string;
  salePrice: string;
  imageUrl: string | null;
  isActive: boolean;
  codes?: ProductCode[];
  compat?: ProductCompat[];
  createdAt?: string;
}

export interface ProductPayload {
  sku: string;
  oemCode?: string;
  name: string;
  category?: string;
  brand?: string;
  unit?: string;
  costPrice: number;
  basePrice: number;
  salePrice: number;
  minStock?: number;
}

/* ---------------- Clientes / Proveedores ---------------- */
export interface Customer {
  id: number;
  code: string;
  name: string;
  documentType: string | null;
  documentNumber: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  isActive: boolean;
}

export interface Supplier {
  id: number;
  code: string;
  name: string;
  taxId: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  isActive: boolean;
}

/* ---------------- Ventas / Compras ---------------- */
export type DocType = 'NOTA' | 'FACTURA';

export interface SaleItem {
  id: number;
  productId: number;
  productSku: string;
  productName: string;
  quantity: number;
  unitCost: string;
  unitBase: string;
  unitSale: string;
  taxRate: string;
  taxAmount: string;
  lineTotal: string;
}

export interface SaleDocument {
  id: number;
  docType: DocType;
  docNumber: string;
  customerName: string;
  customerDoc: string | null;
  subtotal: string;
  taxRate: string;
  taxAmount: string;
  total: string;
  status: string;
  voidReason: string | null;
  userId: number;
  items: SaleItem[];
  createdAt: string;
}

export interface PurchaseItem {
  id: number;
  productId: number;
  productSku: string;
  productName: string;
  quantity: number;
  unitCost: string;
  lineTotal: string;
}

export interface PurchaseDocument {
  id: number;
  docNumber: string;
  supplierId: number;
  supplierName: string;
  invoiceNumber: string | null;
  subtotal: string;
  taxRate: string;
  taxAmount: string;
  total: string;
  status: string;
  voidReason: string | null;
  userId: number;
  items: PurchaseItem[];
  createdAt: string;
}

/* ---------------- Inventario ---------------- */
export interface StockMovement {
  id: number;
  productId: number;
  movementType: string;
  quantity: number;
  unitCost: string;
  unitBase: string;
  unitSale: string;
  concept: string | null;
  referenceType: string | null;
  referenceId: string | null;
  userId: number;
  createdAt: string;
  user?: User;
}

/* ---------------- Caja ---------------- */
export interface CashRegister {
  id: number;
  openedBy: number;
  initialBalance: string;
  expected: string;
  countedAmount: string | null;
  difference: string | null;
  status: 'OPEN' | 'CLOSED';
  closedBy: number | null;
  closedAt: string | null;
  openedAt: string;
}

export interface CashMovement {
  id: number;
  registerId: number;
  movementType: string;
  amount: string;
  description: string | null;
  referenceType: string | null;
  referenceId: string | null;
  userId: number;
  createdAt: string;
}

/* ---------------- Contabilidad ---------------- */
export interface Account {
  id: number;
  code: string;
  name: string;
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  parentId: number | null;
  isActive: boolean;
}

export interface JournalLine {
  id: number;
  accountId: number;
  debit: string;
  credit: string;
  account?: Account;
}

export interface JournalEntry {
  id: number;
  entryNumber: string;
  date: string;
  description: string | null;
  referenceType: string | null;
  referenceId: string | null;
  createdBy: number;
  createdAt: string;
  lines: JournalLine[];
}

/* ---------------- Bancos ---------------- */
export interface BankAccount {
  id: number;
  name: string;
  bank: string;
  accountType: string;
  accountNumber: string | null;
  currency: string;
  balance: string;
  isActive: boolean;
}

export interface BankMovement {
  id: number;
  accountId: number;
  movementType: string;
  amount: string;
  description: string | null;
  userId: number;
  createdAt: string;
}

/* ---------------- RR.HH. ---------------- */
export interface Employee {
  id: number;
  code: string;
  fullName: string;
  documentNumber: string | null;
  position: string | null;
  department: string | null;
  phone: string | null;
  email: string | null;
  hireDate: string | null;
  salary: string | null;
  isActive: boolean;
}

/* ---------------- Documentos / Auditoría ---------------- */
export interface DocRecord {
  id: number;
  name: string;
  fileType: string;
  category: string | null;
  filePath: string | null;
  referenceType: string | null;
  referenceId: string | null;
  uploadedBy: number | null;
  notes: string | null;
  createdAt: string;
}

export interface AuditLog {
  id: number;
  userId: number | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  metadata: Record<string, unknown> | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  user?: User;
}

/* ---------------- Configuración ---------------- */
export interface Setting {
  key: string;
  value: Record<string, unknown>;
  updatedAt?: string;
}

export interface TrialBalanceRow {
  code: string;
  name: string;
  debit: number;
  credit: number;
}
