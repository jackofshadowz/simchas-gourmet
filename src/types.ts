export interface SaladTopping {
  id?: number;
  name: string;
  price?: number;
  selected?: boolean;
}

export interface Dressing {
  id?: number;
  name: string;
  selected?: boolean;
}

export interface CustomerInfo {
  specialRequests?: string;
}

export interface OrderItem {
  name: string;
  quantity: number;
  amount?: number;
  price?: number;
}

export interface OrderState {
  toppings: SaladTopping[];
  dressing: Dressing | null;
  protein: SaladTopping | null;
  total: number;
  customerInfo: CustomerInfo;
  items: OrderItem[];
}

export interface CreateCheckoutRequest {
  amount: number;
  customerInfo: CustomerInfo;
  orderDetails: {
    items: OrderItem[];
    notes?: string;
    description?: {
      protein: string;
      toppings: string[];
      dressing: string;
      specialRequests: string;
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