import type {
  User,
  Hospital,
  Listing,
  Order,
  Category,
  UserRole,
  ListingStatus,
  MedicineCondition,
  OrderStatus,
} from "@prisma/client";

// Re-export Prisma types for convenience
export type {
  User,
  Hospital,
  Listing,
  Order,
  Category,
  UserRole,
  ListingStatus,
  MedicineCondition,
  OrderStatus,
};

// ─── Extended types with relations ───────────────────────────────────────────

// pricePerUnit is serialized to number (Prisma Decimal is not serializable to client components)
export type ListingWithRelations = Omit<Listing, "pricePerUnit"> & {
  pricePerUnit: number;
  hospital: Hospital;
  seller: Pick<User, "id" | "name" | "email" | "image">;
  category: Category | null;
};

export type OrderWithRelations = Order & {
  listing: Listing;
  buyer: Pick<User, "id" | "name" | "email">;
  buyerHospital: Hospital;
  sellerHospital: Hospital;
};

// ─── API / Form types ─────────────────────────────────────────────────────────

export interface CreateListingInput {
  title: string;
  description?: string;
  medicineName: string;
  genericName?: string;
  atcCode?: string;
  manufacturer?: string;
  batchNumber?: string;
  expiryDate: string;        // ISO date string from form
  quantity: number;
  unit: string;
  pricePerUnit: number;
  currency: string;
  condition: MedicineCondition;
  categoryId?: string;
}

export interface CreateOrderInput {
  listingId: string;
  quantity: number;
  notes?: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  hospitalName: string;
  hospitalCity: string;
  hospitalCountry: string;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─── Session ──────────────────────────────────────────────────────────────────

export interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: UserRole;
  hospitalId?: string | null;
}
