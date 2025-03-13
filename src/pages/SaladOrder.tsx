import { useState, useRef } from 'react';
import { Salad, MessageSquare } from 'lucide-react';
import type { SaladTopping, Dressing, OrderState, CustomerInfo } from '../types';
import { createCheckoutSession } from '../utils/square';

const TOPPINGS: SaladTopping[] = [
  { name: 'Red Pepper' },
  { name: 'Pickles' },
  { name: 'Cucumbers' },
  { name: 'Grape tomatoes' },
  { name: 'Caesar croutons' },
  { name: 'Craisins' },
  { name: 'Baby Corn' },
  { name: 'Chickpeas' },
  { name: 'Hard boiled egg' },
];

const DRESSINGS: Dressing[] = [
  { name: 'Caesar' },
  { name: 'Light Caesar' },
  { name: 'Fat free Italian' },
  { name: 'Honey Dijon' },
];

const PROTEINS: SaladTopping[] = [
  { name: 'Tuna', price: 4 },
  { name: 'Smoked Turkey Breast', price: 4 },
  { name: 'Grilled Chicken', price: 6 },
  { name: 'Fried Shnitzel', price: 6 },
];

const BASE_PRICE = 12;

export function SaladOrder() {
  const mainRef = useRef<HTMLDivElement>(null);
  const [order, setOrder] = useState<OrderState>({
    items: [],
    toppings: TOPPINGS.map(t => ({ ...t, selected: false })),
    dressing: null,
    protein: null,
    total: BASE_PRICE,
    customerInfo: {
      name: '',
      phone: '',
      address: '',
      specialRequests: '',
    },
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const selectedToppingsCount = order.toppings.filter(t => t.selected).length;

  const handleToppingToggle = (index: number) => {
    if (!order.toppings[index].selected && selectedToppingsCount >= 4) {
      return;
    }

    const newToppings = [...order.toppings];
    newToppings[index] = { ...newToppings[index], selected: !newToppings[index].selected };
    setOrder({ ...order, toppings: newToppings });
  };

  const handleDressingSelect = (dressing: Dressing) => {
    setOrder({ ...order, dressing: { ...dressing, selected: true } });
  };

  const handleProteinSelect = (protein: SaladTopping) => {
    if (order.protein?.name === protein.name) {
      setOrder({ ...order, protein: null, total: BASE_PRICE });
    } else {
      const total = BASE_PRICE + (protein.price || 0);
      setOrder({ ...order, protein: { ...protein, selected: true }, total });
    }
  };

  const handleCustomerInfoChange = (field: keyof CustomerInfo, value: string) => {
    setOrder({
      ...order,
      customerInfo: {
        ...order.customerInfo!,
        [field]: value,
      },
    });
  };

  const handleSubmitOrder = () => {
    if (selectedToppingsCount === 0 || !order.dressing) {
      alert('Please select at least one topping and a dressing!');
      return;
    }
    
    handlePayment();
  };

  const handlePayment = async () => {
    setError(null);
    setIsLoading(true);

    try {
      // Format the main salad item name to include toppings and special requests
      let mainItemName = order.toppings.filter(t => t.selected).length > 0
        ? `Custom Salad with ${order.toppings.filter(t => t.selected).map(t => t.name).join(', ')}`
        : 'Custom Salad (No toppings)';
        
      // Add dressing to the item name
      if (order.dressing) {
        mainItemName += ` - ${order.dressing.name} dressing`;
      }
      
      // Add special requests to the item name if present
      if (order.customerInfo?.specialRequests) {
        mainItemName += ` (Special Request: ${order.customerInfo.specialRequests})`;
      }

      // Format order items with detailed descriptions
      const items = [{
        name: mainItemName,
        quantity: 1,
        amount: BASE_PRICE
      }];

      if (order.protein) {
        items.push({
          name: `Add ${order.protein.name}`,
          quantity: 1,
          amount: order.protein.price || 0
        });
      }

      // Create a more detailed order summary
      let orderSummary = `Order from Simchas Gourmet\n\n`;
      
      // Add each item with details
      orderSummary += `Custom Salad - $${BASE_PRICE.toFixed(2)}\n`;
      
      // Add protein if selected
      if (order.protein) {
        orderSummary += `\n\nProtein: ${order.protein.name} - $${order.protein.price?.toFixed(2)}`;
      }
      
      // Add toppings if selected
      if (order.toppings.filter(t => t.selected).length > 0) {
        orderSummary += `\n\nToppings: ${order.toppings.filter(t => t.selected).map(t => t.name).join(', ')}`;
      } else {
        orderSummary += `\n\nToppings: None selected`;
      }
      
      // Add dressing if selected
      if (order.dressing) {
        orderSummary += `\nDressing: ${order.dressing.name}`;
      } else {
        orderSummary += `\nDressing: None selected`;
      }
      
      // Add total
      orderSummary += `\n\nTotal: $${order.total.toFixed(2)}`;
      
      // Add special requests if provided
      if (order.customerInfo?.specialRequests) {
        orderSummary += `\n\nSpecial Requests: ${order.customerInfo.specialRequests}`;
      }

      // Create a more detailed order description for Square
      const orderDescription = {
        base: 'Fresh Crispy Romaine',
        toppings: order.toppings.filter(t => t.selected).map(t => t.name),
        dressing: order.dressing?.name || 'None',
        protein: order.protein?.name || 'None',
        specialRequests: order.customerInfo?.specialRequests || ''
      };

      const checkoutResponse = await createCheckoutSession({
        amount: order.total,
        customerInfo: {
          name: '',
          phone: '',
          address: '',
          specialRequests: order.customerInfo?.specialRequests || ''
        },
        orderDetails: {
          items,
          notes: orderSummary,
          description: orderDescription
        }
      });
      
      window.location.href = checkoutResponse.payment_link.url;
    } catch (e) {
      console.error('Payment error:', e);
      setError('Failed to initialize payment. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="w-full h-48 relative overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=2000&q=80" 
          alt="Fresh Salad" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-50"></div>
      </div>

      <main ref={mainRef} className="container mx-auto px-4 py-8 flex-grow">
        <div className="max-w-3xl mx-auto space-y-8">
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">1. Start with Fresh Crispy Romaine</h2>
            <p className="text-gray-600">Every salad starts with a generous bed of fresh, crispy romaine lettuce.</p>
          </section>

          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">2. Choose up to 4 Toppings</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {order.toppings.map((topping, index) => (
                <button
                  key={topping.name}
                  onClick={() => handleToppingToggle(index)}
                  className={`p-3 rounded-lg border transition-colors ${
                    topping.selected
                      ? 'bg-red-50 border-red-700 text-red-900'
                      : 'border-gray-200 hover:border-red-300'
                  }`}
                  disabled={!topping.selected && selectedToppingsCount >= 4}
                >
                  {topping.name}
                </button>
              ))}
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Selected: {selectedToppingsCount}/4
            </p>
          </section>

          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">3. Choose Your Dressing</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {DRESSINGS.map((dressing) => (
                <button
                  key={dressing.name}
                  onClick={() => handleDressingSelect(dressing)}
                  className={`p-3 rounded-lg border transition-colors ${
                    order.dressing?.name === dressing.name
                      ? 'bg-red-50 border-red-700 text-red-900'
                      : 'border-gray-200 hover:border-red-300'
                  }`}
                >
                  {dressing.name}
                </button>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">4. Add Protein (Optional)</h2>
            <div className="grid grid-cols-2 gap-4">
              {PROTEINS.map((protein) => (
                <button
                  key={protein.name}
                  onClick={() => handleProteinSelect(protein)}
                  className={`p-3 rounded-lg border transition-colors ${
                    order.protein?.name === protein.name
                      ? 'bg-red-50 border-red-700 text-red-900'
                      : 'border-gray-200 hover:border-red-300'
                  }`}
                >
                  {protein.name} (+${protein.price})
                </button>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">5. Special Requests (Optional)</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="flex items-center gap-2">
                  <MessageSquare size={16} />
                  Any special instructions or dietary requirements?
                </span>
              </label>
              <textarea
                value={order.customerInfo?.specialRequests || ''}
                onChange={(e) => handleCustomerInfoChange('specialRequests', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#8B0000] focus:border-[#8B0000] transition-all"
                placeholder="Enter any special requests here"
                rows={3}
              />
            </div>
          </section>

          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-[#8B0000]">
              <Salad size={24} />
              <span className="text-2xl font-bold">Total: ${order.total.toFixed(2)}</span>
            </div>
            <button
              onClick={handleSubmitOrder}
              disabled={isLoading}
              className="bg-[#8B0000] text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-red-900 transition-colors w-full md:w-auto disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2"></div>
                  Processing...
                </>
              ) : (
                'Place Order'
              )}
            </button>
            
            {error && (
              <div className="mt-2 flex items-center gap-1 text-red-600 bg-red-50 p-2 rounded w-full md:w-auto">
                <p className="text-sm">{error}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}