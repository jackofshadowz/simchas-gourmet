import { useRef, useState } from 'react';
import { Salad } from 'lucide-react';
import { createCheckoutSession } from '../utils/square';
import type { Dressing, OrderState, SaladTopping } from '../types';

// Constants
const BASE_PRICE = 12.00;

// Toppings - up to 4 allowed
const TOPPINGS: SaladTopping[] = [
  { id: 1, name: 'Red Pepper', price: 0, selected: false },
  { id: 2, name: 'Pickles', price: 0, selected: false },
  { id: 3, name: 'Cucumbers', price: 0, selected: false },
  { id: 4, name: 'Grape tomatoes', price: 0, selected: false },
  { id: 5, name: 'Caesar croutons', price: 0, selected: false },
  { id: 6, name: 'Craisins', price: 0, selected: false },
  { id: 7, name: 'Baby Corn', price: 0, selected: false },
  { id: 8, name: 'Chickpeas', price: 0, selected: false },
  { id: 9, name: 'Hard boiled egg', price: 0, selected: false },
];

// Dressings - choose 1
const DRESSINGS: Dressing[] = [
  { id: 1, name: 'Caesar', selected: false },
  { id: 2, name: 'Light Caesar', selected: false },
  { id: 3, name: 'Fat free Italian', selected: false },
  { id: 4, name: 'Honey Dijon', selected: false },
];

// Proteins - optional add-ons
const PROTEINS: SaladTopping[] = [
  { id: 1, name: 'Tuna', price: 4.00, selected: false },
  { id: 2, name: 'Smoked Turkey Breast', price: 4.00, selected: false },
  { id: 3, name: 'Grilled Chicken', price: 6.00, selected: false },
  { id: 4, name: 'Fried Shnitzel', price: 6.00, selected: false },
];

export function SaladOrder() {
  const mainRef = useRef<HTMLDivElement>(null);
  const [order, setOrder] = useState<OrderState>({
    items: [],
    toppings: TOPPINGS.map(t => ({ ...t, selected: false })),
    dressing: null,
    protein: null,
    total: BASE_PRICE,
    customerInfo: {
      specialRequests: '',
    },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Count selected toppings
  const selectedToppingsCount = order.toppings.filter(t => t.selected).length;

  const handleToppingToggle = (index: number) => {
    // Limit to 4 toppings
    if (!order.toppings[index].selected && selectedToppingsCount >= 4) {
      setError('You can only select up to 4 toppings');
      return;
    }

    const newToppings = [...order.toppings];
    newToppings[index].selected = !newToppings[index].selected;
    
    // Clear error message if we're at or below 4 toppings
    if (error === 'You can only select up to 4 toppings' && 
        (newToppings.filter(t => t.selected).length <= 4 || newToppings[index].selected === false)) {
      setError(null);
    }
    
    setOrder({
      ...order,
      toppings: newToppings,
    });
  };

  const handleDressingSelect = (index: number) => {
    const newDressings = DRESSINGS.map((d, i) => ({
      ...d,
      selected: i === index
    }));
    
    setOrder({
      ...order,
      dressing: newDressings[index]
    });
  };

  const handleProteinSelect = (index: number) => {
    // If already selected, deselect it
    if (order.protein?.id === PROTEINS[index].id) {
      setOrder({
        ...order,
        protein: null,
        total: calculateTotal(null)
      });
      return;
    }
    
    const selectedProtein = PROTEINS[index];
    
    setOrder({
      ...order,
      protein: selectedProtein,
      total: calculateTotal(selectedProtein)
    });
  };

  // Calculate total based on base price and protein
  const calculateTotal = (protein: SaladTopping | null): number => {
    let total = BASE_PRICE;
    
    // Add protein price if selected
    if (protein) {
      total += protein.price || 0;
    }
    
    return total;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that at least one topping is selected
    if (selectedToppingsCount === 0) {
      setError('Please select at least one topping');
      return;
    }
    
    // Validate that a dressing is selected
    if (!order.dressing) {
      setError('Please select a dressing');
      return;
    }
    
    handleCheckout();
  };

  const handleSpecialRequestsChange = (value: string) => {
    setOrder({
      ...order,
      customerInfo: {
        ...order.customerInfo,
        specialRequests: value
      }
    });
  };

  const handleCheckout = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Format toppings for display
      const toppingsSelected = order.toppings.filter(t => t.selected);
      const toppingsText = toppingsSelected.map(t => t.name).join(', ');

      // Calculate total price
      const totalPrice = order.total;

      // Create detailed item name including special requests
      let itemName = `Custom Salad - $${totalPrice.toFixed(2)}`;
      if (order.protein && order.protein.name) {
        itemName += `\nProtein: ${order.protein.name} (+$${order.protein.price?.toFixed(2)})`;
      }
      if (toppingsText) {
        itemName += `\nToppings (${toppingsSelected.length}/4): ${toppingsText}`;
      }
      if (order.dressing && order.dressing.name) {
        itemName += `\nDressing: ${order.dressing.name}`;
      }
      if (order.customerInfo.specialRequests) {
        itemName += `\nSpecial Requests: ${order.customerInfo.specialRequests}`;
      }

      // Create order details object
      const orderDetails = {
        items: [
          {
            name: itemName,
            quantity: 1,
            amount: totalPrice
          }
        ],
        notes: `Order from Simchas Gourmet\n\n${itemName}`,
        description: {
          protein: order.protein?.name || 'None',
          toppings: toppingsText ? toppingsText.split(', ') : [],
          dressing: order.dressing?.name || 'None',
          specialRequests: order.customerInfo.specialRequests || 'None'
        }
      };

      // Call the Square API to create a checkout session
      const checkoutData = {
        amount: totalPrice,
        orderDetails,
        customerInfo: order.customerInfo
      };

      console.log('Sending checkout data:', JSON.stringify(checkoutData, null, 2));
      
      try {
        const checkoutResponse = await createCheckoutSession(checkoutData);
        console.log('Checkout response:', JSON.stringify(checkoutResponse, null, 2));

        // Redirect to the Square checkout page
        if (checkoutResponse.payment_link && checkoutResponse.payment_link.url) {
          window.location.href = checkoutResponse.payment_link.url;
        } else {
          console.error('Invalid checkout response:', checkoutResponse);
          setError('Failed to create checkout link. Please try again. (Missing URL)');
          setIsLoading(false);
        }
      } catch (checkoutError: any) {
        console.error('Checkout error:', checkoutError);
        
        // Extract the error message if available
        let errorMessage = 'Failed to create checkout link. Please try again.';
        if (checkoutError.message) {
          errorMessage = checkoutError.message;
          // Clean up the error message if it's a JSON string
          try {
            const parsedError = JSON.parse(checkoutError.message.replace('Failed to create checkout session: ', ''));
            if (parsedError.details && parsedError.details.errors) {
              errorMessage = parsedError.details.errors.map((err: any) => err.detail).join('. ');
            }
          } catch (e) {
            // If parsing fails, use the original error message
          }
        }
        
        setError(errorMessage);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError(`Failed to initialize payment. Please try again.`);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-gray-800" ref={mainRef}>
      <div className="w-full h-48 relative overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=2000&q=80" 
          alt="Fresh Salad" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-50"></div>
      </div>
      
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="text-[#8B0000] text-center p-4 mb-8">
          <p className="font-bold text-xl">DELIVERED FRESH TO</p>
          <p className="font-bold text-xl">SHEVACH HIGH SCHOOL</p>
          <p className="font-bold text-xl">DAILY AT 12:00PM</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">1. Fresh Crispy Romaine</h2>
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <p className="font-medium">It all starts with a generous bed of fresh crispy romaine...</p>
              <div className="flex items-center mt-4">
                <div className="text-[#8B0000] p-4 flex items-center justify-center font-bold text-xl">
                  <span>Just</span>
                  <span className="text-3xl mx-1">$12</span>
                  <span>+tax</span>
                </div>
              </div>
            </div>
          </section>
          
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">2. Choose up to 4 toppings:</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {order.toppings.map((topping, index) => (
                <div 
                  key={index}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    topping.selected 
                      ? 'border-[#8B0000] bg-red-50' 
                      : 'border-gray-200 hover:border-[#8B0000] hover:bg-red-50'
                  } ${!topping.selected && selectedToppingsCount >= 4 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => handleToppingToggle(index)}
                >
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={topping.selected}
                      onChange={() => {}}
                      className="mr-3 h-5 w-5 accent-[#8B0000]"
                    />
                    <p className="font-medium">{topping.name}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Selected: {selectedToppingsCount}/4
            </p>
          </section>
          
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">3. Dress it up (choose 1):</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DRESSINGS.map((dressing, index) => (
                <div 
                  key={index}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    order.dressing?.name === dressing.name 
                      ? 'border-[#8B0000] bg-red-50' 
                      : 'border-gray-200 hover:border-[#8B0000] hover:bg-red-50'
                  }`}
                  onClick={() => handleDressingSelect(index)}
                >
                  <div className="flex items-center">
                    <input 
                      type="radio" 
                      checked={order.dressing?.name === dressing.name}
                      onChange={() => {}}
                      className="mr-3 h-5 w-5 accent-[#8B0000]"
                    />
                    <p className="font-medium">{dressing.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
          
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">4. And add some pizzaz if you'd like:</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PROTEINS.map((protein, index) => (
                <div 
                  key={index}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    order.protein?.name === protein.name 
                      ? 'border-[#8B0000] bg-red-50' 
                      : 'border-gray-200 hover:border-[#8B0000] hover:bg-red-50'
                  }`}
                  onClick={() => handleProteinSelect(index)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={order.protein?.name === protein.name}
                        onChange={() => {}}
                        className="mr-3 h-5 w-5 accent-[#8B0000]"
                      />
                      <p className="font-medium">{protein.name}</p>
                    </div>
                    <p className="font-medium text-[#8B0000]">+${protein.price?.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
          
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">5. Special Requests</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Any special requests for your salad?
              </label>
              <textarea
                value={order.customerInfo.specialRequests || ''}
                onChange={(e) => handleSpecialRequestsChange(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#8B0000] focus:border-[#8B0000] transition-all"
                rows={3}
                placeholder="E.g., Extra dressing on the side, light on the onions, etc."
              />
            </div>
          </section>

          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-[#8B0000]">
              <Salad size={24} />
              <span className="text-2xl font-bold">Total: ${order.total.toFixed(2)}</span>
            </div>
            
            {error && (
              <div className="bg-red-100 text-red-800 p-3 rounded-lg w-full text-center">
                {error}
              </div>
            )}
            
            <button
              type="submit"
              disabled={isLoading}
              className="bg-[#8B0000] text-white font-bold py-3 px-8 rounded-lg text-lg w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-red-900"
            >
              {isLoading ? 'Processing...' : 'CLICK HERE TO ORDER'}
            </button>
            
            <p className="text-sm text-gray-500 text-center">
              You'll be redirected to our secure payment processor to complete your order.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}