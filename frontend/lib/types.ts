// ====== Material ======
export interface Material {
  id: string;
  name: string;
  createdAt: string;
}

// ====== Product / ProductPart / PartPiece ======
export interface PartPiece {
  id: string;
  productPartId: string;
  edge1: number;
  edge2: number;
  edge3: number;
  thickness: number | null;
  width: number;
  height: number;
  materialId: string;
  material: Material;
  quantity: number;
  createdAt: string;
}

export interface ProductPart {
  id: string;
  productId: string;
  partName: string;
  createdAt: string;
  pieces: PartPiece[];
  product?: Product;
}

export interface Product {
  id: string;
  code: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
  parts: ProductPart[];
}

// ====== Order / OrderItem ======
export interface OrderItem {
  id: string;
  orderId: string;
  productPartId: string;
  productPart: ProductPart;
  setQuantity: number;
  createdAt: string;
}

export interface Order {
  id: string;
  orderCode: string;
  status: 'draft' | 'pending_cut' | 'cutting' | 'done';
  createdAt: string;
  items: OrderItem[];
  _count?: { items: number };
}

// ====== Cutting Batch ======
export interface CuttingBatchItem {
  id: string;
  cuttingBatchId: string;
  orderItemId: string;
  partPieceId: string;
  sheetIndex: number;
  sheetSize: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotated: boolean;
  createdAt: string;
  orderItem?: OrderItem;
  partPiece?: PartPiece;
}

export interface PackingReport {
  id: string;
  cuttingBatchId: string;
  totalSheets: number;
  totalVolumeM3: number | null;
  utilizationPct: number | null;
  pdfUrl: string | null;
  createdAt: string;
}

export interface CuttingBatch {
  id: string;
  materialId: string;
  material: Material;
  thickness: number;
  status: 'suggested' | 'confirmed' | 'cut';
  createdAt: string;
  items: CuttingBatchItem[];
  reports: PackingReport[];
  _count?: { items: number };
}

// ====== Suggestion ======
export interface PackingSuggestion {
  materialId: string;
  thickness: number;
  orderCodes: string[];
  separateSheets: number;
  combinedSheets: number;
  savedSheets: number;
  savedPct: number;
  message: string;
}

// ====== Packing ======
export interface PackingPiece {
  id: string;
  width: number;
  height: number;
  originalPieceId: string;
  orderItemId: string;
}

export interface SheetOption {
  name: string;
  width: number;
  height: number;
}

export interface PackedRect {
  x: number;
  y: number;
  w: number;
  h: number;
  rot: boolean;
  pieceData: PackingPiece;
}

export interface PackedBin {
  width: number;
  height: number;
  sheetName: string;
  rects: PackedRect[];
}

export interface PackedResult {
  totalSheets: number;
  efficiency: number;
  bins: PackedBin[];
}