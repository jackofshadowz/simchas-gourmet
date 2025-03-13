export interface SaladTopping {
  name: string;
  price?: number;
  selected?: boolean;
}

export interface Dressing {
  name: string;
  selected?: boolean;
}

export interface CustomerInfo {
  name: string;
  phone: string;
  address: string;
  specialRequests?: string;
}

export interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

export interface OrderState {
  toppings: SaladTopping[];
  dressing: Dressing | null;
  protein: SaladTopping | null;
  total: number;
  customerInfo?: CustomerInfo;
  items: OrderItem[];
}

export interface CreateCheckoutRequest {
  amount: number;
  customerInfo: CustomerInfo;
  orderDetails: {
    items: Array<{
      name: string;
      quantity: number;
      amount: number;
    }>;
    notes?: string;
    description?: {
      base?: string;
      toppings?: string[];
      dressing?: string;
      protein?: string;
      specialRequests?: string;
    };
  };
}

export interface CreateCheckoutResponse {
  payment_link: {
    id: string;
    version: number;
    description: string;
    order_id: string;
    url: string;
    long_url: string;
    created_at: string;
  };
  related_resources: {
    orders: Array<{
      id: string;
      location_id: string;
      source: {
        name: string;
      };
    }>;
  };
}

export interface SquareCheckoutResponse {
  checkout: {
    id: string;
    checkout_page_url: string;
    order_id: string;
    created_at: string;
  };
}