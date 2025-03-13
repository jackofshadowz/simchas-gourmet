import { useState } from 'react';
import type { OrderState } from '../types';
import { createCheckoutSession } from '../utils/square';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderState;
}

export function PaymentModal({ isOpen, onClose, order }: PaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  const handlePayment = async () => {
    if (!customerName || !customerPhone) {
      setError('Please provide your name and phone number');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get customer information from form
      const customerInfo = {
        name: customerName,
        phone: customerPhone,
        address: customerAddress,
        specialRequests: order.customerInfo?.specialRequests || ''
      };

      // Create a more detailed order summary
      let orderSummary = `Order from Simchas Gourmet\n\n`;
      
      // Add each item with details
      order.items.forEach(item => {
        orderSummary += `${item.quantity}x ${item.name} - $${(item.price * item.quantity).toFixed(2)}\n`;
      });
      
      // Add protein if selected
      if (order.protein) {
        orderSummary += `\nProtein: ${order.protein.name}`;
      }
      
      // Add toppings if selected
      const selectedToppings = order.toppings.filter(t => t.selected);
      if (selectedToppings.length > 0) {
        orderSummary += `\n\nToppings: ${selectedToppings.map(t => t.name).join(', ')}`;
      }
      
      // Add dressing if selected
      if (order.dressing) {
        orderSummary += `\nDressing: ${order.dressing.name}`;
      }
      
      // Add total
      orderSummary += `\n\nTotal: $${order.total.toFixed(2)}`;
      
      // Add customer info
      orderSummary += `\n\nCustomer: ${customerInfo.name}`;
      orderSummary += `\nPhone: ${customerInfo.phone}`;
      if (customerInfo.address) {
        orderSummary += `\nAddress: ${customerInfo.address}`;
      }
      
      // Add special requests if provided
      if (customerInfo.specialRequests) {
        orderSummary += `\n\nSpecial Requests: ${customerInfo.specialRequests}`;
      }

      // Format order details
      const orderDetails = {
        items: order.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          amount: item.price
        })),
        notes: orderSummary
      };

      // Call our server-side implementation
      const checkoutUrl = await createCheckoutSession({
        amount: order.total * 100, // Convert to cents
        customerInfo,
        orderDetails
      });

      // Redirect to Square checkout
      window.location.href = checkoutUrl;
    } catch (e) {
      console.error('Payment error:', e);
      setError('Failed to initialize checkout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-semibold text-[#8B0000] mb-4">Complete Your Order</h2>
        
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Order Summary</h3>
          <div className="bg-gray-50 p-4 rounded">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between mb-2">
                <span>{item.quantity}x {item.name}</span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            
            {order.protein && (
              <div className="mt-2 pt-2 border-t">
                <p className="font-medium">Protein: {order.protein.name}</p>
              </div>
            )}
            
            {order.toppings.filter(t => t.selected).length > 0 && (
              <div className="mt-2">
                <p className="font-medium">Toppings:</p>
                <ul className="list-disc pl-5">
                  {order.toppings
                    .filter(t => t.selected)
                    .map((topping, index) => (
                      <li key={index}>{topping.name}</li>
                    ))}
                </ul>
              </div>
            )}
            
            {order.dressing && (
              <div className="mt-2">
                <p className="font-medium">Dressing: {order.dressing.name}</p>
              </div>
            )}
            
            {order.customerInfo?.specialRequests && (
              <div className="mt-2">
                <p className="font-medium">Special Requests:</p>
                <p className="text-sm italic">{order.customerInfo.specialRequests}</p>
              </div>
            )}
            
            <p className="text-lg font-bold mt-4 pt-2 border-t">Total: ${order.total.toFixed(2)}</p>
          </div>
        </div>
        
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Customer Information</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone <span className="text-red-600">*</span>
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="e.g., +1 123-456-7890"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address (Optional)
              </label>
              <textarea
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={2}
              />
            </div>
          </div>
        </div>

        {error && (
          <p className="mt-2 text-red-600 text-sm mb-4">{error}</p>
        )}

        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handlePayment}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-[#8B0000] text-white rounded-md hover:bg-red-900 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : 'Proceed to Checkout'}
          </button>
        </div>
      </div>
    </div>
  );
}