export type OwnerOrderItem = {
  id?: string;
  name: string;
  quantity: number;
  price?: number;
  /** Server line total (unit + add-ons) × qty from order-service `itemTotal`. */
  lineTotal?: number;
  specialInstructions?: string;
  /** Selected add-ons for kitchen / owner bill. */
  modifiers?: string[];
};

export type OwnerOrderAddress = {
  formattedAddress?: string;
  flatNo?: string;
  building?: string;
  street?: string;
  landmark?: string;
  area?: string;
  city?: string;
  state?: string;
  pincode?: string;
  instructions?: string;
  contactName?: string;
  contactPhone?: string;
};

export type OwnerOrder = {
  id: string;
  orderNumber: string;
  status: string;
  items: OwnerOrderItem[];
  total?: number;
  fulfillmentLabel: string;
  fulfillmentTone: 'table' | 'delivery' | 'pickup';
  createdAt?: string;
  updatedAt?: string;
  customerName?: string;
  customerPhone?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  subtotal?: number;
  deliveryFee?: number;
  packagingCharge?: number;
  tax?: number;
  discount?: number;
  /** Customer payable total when kitchen fields are thin (KDS cards). */
  grandTotal?: number;
  specialInstructions?: string;
  deliveryAddress?: OwnerOrderAddress;
  rejectionReason?: string;
  scheduledFor?: string;
  /** When a scheduled ticket leaves the Scheduled tab for the live board (rings then). */
  kitchenReleaseAt?: string;
  isDelayed?: boolean;
  prepMinutes?: number;
  itemCount?: number;
  delayMinutes?: number;
  acceptBy?: string;
  promisedReadyAt?: string;
  /** Centralized bill from order-service (`bill.restaurant` for kitchen). */
  bill?: import('@/lib/order/restaurant-bill').CentralBillPayload | null;
  /** Rider trip status from `delivery:status` (order status stays OFD until receive). */
  deliveryTripStatus?: string;
};

export type DashboardInsight = {
  title: string;
  subtitle: string;
  trendPercent: number;
};

export type DashboardRevenueBar = {
  label: string;
  value: number;
};

export type DashboardMetrics = {
  /** From analytics overview: totalRevenue */
  grossRevenue: number | null;
  revenueTrendPercent: number | null;
  yesterdayRevenue: number | null;
  /** From analytics/revenue series when available */
  revenueBars: number[];
  /** Labeled series for the dashboard chart (API only) */
  revenueSeries: DashboardRevenueBar[];
  /** From analytics overview: totalOrders */
  totalOrders: number | null;
  /** From analytics overview: avgRating */
  rating: number | null;
  ratingMax: number;
  totalRatings: number | null;
  /** Not on restaurant-service overview — kept for the dashboard card. */
  avgDeliveryMinutes: number | null;
  isOnline: boolean;
};

export type DashboardQuickActions = {
  activeOrders: number;
  menuItems: number;
  activePromos: number;
  /** From review-service stats */
  totalReviews: number;
};

export type DashboardData = {
  restaurantId: string;
  restaurantName: string;
  city?: string;
  logoUrl?: string;
  insight: DashboardInsight;
  metrics: DashboardMetrics;
  quickActions: DashboardQuickActions;
  pendingOrders: OwnerOrder[];
};
