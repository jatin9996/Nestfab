export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  productCount: number;
};

export type ProductCard = {
  id: string;
  name: string;
  slug: string;
  pricePaise: number;
  compareAtPaise: number | null;
  stock: number;
  featured: boolean;
  codAllowed: boolean;
  material: string | null;
  category: { name: string; slug: string };
  imageUrl: string | null;
  imageAlt: string | null;
  rating: number | null;
  reviewCount: number;
};

export type Review = {
  id: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
  author: string;
};

export type ProductDetail = ProductCard & {
  description: string;
  highlights: string[];
  sku: string;
  weight: string | null;
  dimensions: string | null;
  care: string | null;
  images: { url: string; alt: string | null; kind?: "IMAGE" | "VIDEO" }[];
};

export type ProductDetailResponse = ProductDetail & { reviews: Review[] };

export type AdminProduct = ProductDetailResponse & {
  active: boolean;
  categoryId: string;
};

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: "CUSTOMER" | "ADMIN";
};

export type Address = {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

export type OrderItem = {
  id: string;
  name: string;
  sku: string;
  pricePaise: number;
  quantity: number;
  imageUrl: string | null;
};

export type Order = {
  orderNumber: string;
  accessToken: string;
  email: string;
  phone: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  subtotalPaise: number;
  discountPaise: number;
  shippingPaise: number;
  totalPaise: number;
  couponCode: string | null;
  shippingName: string;
  shippingLine1: string;
  shippingLine2: string | null;
  shippingCity: string;
  shippingState: string;
  shippingPincode: string;
  gstin: string | null;
  customerNote: string | null;
  createdAt: string;
  items: OrderItem[];
};

export type Quote = {
  lines: {
    productId: string;
    name: string;
    slug: string;
    quantity: number;
    unitPaise: number;
    linePaise: number;
    imageUrl: string | null;
    stock: number;
    codAllowed: boolean;
  }[];
  subtotalPaise: number;
  discountPaise: number;
  shippingPaise: number;
  totalPaise: number;
  couponCode: string | null;
  codAllowed: boolean;
  codBlocked: string[];
};

export type PaymentStart =
  | { mode: "cod" }
  | { mode: "demo"; orderNumber: string; amount: number; currency: string }
  | { mode: "already_paid" }
  | { mode: "error"; message: string }
  | {
      mode: "razorpay";
      keyId: string;
      razorpayOrderId: string;
      amount: number;
      currency: string;
      name: string;
      description: string;
      prefill: { name: string; email: string; contact: string };
    };
