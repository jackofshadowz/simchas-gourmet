import React, { useState } from 'react';
import { Package2, User, Phone, MapPin } from 'lucide-react';
import { createCheckoutSession } from '../utils/square';

interface ShabbosBoxOrder {
  main: 'FRIED SHNITZEL' | 'GRILLED CHICKEN BREAST' | 'STUFFED CAPONS';
  bakeryPackage: boolean;
  customerInfo: {
    name: string;
    phone: string;
    address: string;
  };
}

export function ShabbosBox() {
  const [order, setOrder] = useState<ShabbosBoxOrder>({
    main: 'FRIED SHNITZEL',
    bakeryPackage: false,
    customerInfo: {
      name: '',
      phone: '',
      address: ''
    }
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const basePrice = 89;
  const caponUpcharge = 10;
  const bakeryPackagePrice = 25;

  const total = basePrice + 
    (order.main === 'STUFFED CAPONS' ? caponUpcharge : 0) + 
    (order.bakeryPackage ? bakeryPackagePrice : 0);

  const handleMainSelection = (main: ShabbosBoxOrder['main']) => {
    setOrder({ ...order, main });
  };

  const handleBakeryPackageToggle = () => {
    setOrder({ ...order, bakeryPackage: !order.bakeryPackage });
  };

  const handleCustomerInfoChange = (field: 'name' | 'phone' | 'address', value: string) => {
    setOrder({
      ...order,
      customerInfo: {
        ...order.customerInfo,
        [field]: value
      }
    });
  };

  const validateForm = () => {
    if (!order.customerInfo.name.trim()) {
      setError('Please enter your name');
      return false;
    }
    if (!order.customerInfo.phone.trim()) {
      setError('Please enter your phone number');
      return false;
    }
    if (!order.customerInfo.address.trim()) {
      setError('Please enter your delivery address');
      return false;
    }
    return true;
  };

  const handlePayment = async () => {
    if (!validateForm()) {
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      // Format order items
      const items = [
        {
          name: `Shabbos Box with ${order.main}`,
          quantity: 1,
          amount: basePrice + (order.main === 'STUFFED CAPONS' ? caponUpcharge : 0)
        }
      ];

      if (order.bakeryPackage) {
        items.push({
          name: 'Bakery Package',
          quantity: 1,
          amount: bakeryPackagePrice
        });
      }

      const notes = `Main Course: ${order.main}${
        order.bakeryPackage ? '\nIncludes Bakery Package' : ''
      }`;

      const checkoutUrl = await createCheckoutSession({
        amount: total,
        customerInfo: order.customerInfo,
        orderDetails: {
          items,
          notes
        }
      });
      
      window.location.href = checkoutUrl;
    } catch (e) {
      console.error('Payment error:', e);
      setError('Failed to initialize payment. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="w-full h-64 relative overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=2000&q=80" 
          alt="Shabbos Food" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-50"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 shadow-text">The Shabbos Box</h1>
            <p className="text-xl md:text-2xl shadow-text">Complete Shabbos Menu for 4 People</p>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-6">Choose Your Main Course</h2>
            <div className="space-y-4">
              {(['FRIED SHNITZEL', 'GRILLED CHICKEN BREAST', 'STUFFED CAPONS'] as const).map((main) => (
                <button
                  key={main}
                  onClick={() => handleMainSelection(main)}
                  className={`w-full p-4 rounded-lg border text-left transition-colors ${
                    order.main === main
                      ? 'bg-red-50 border-red-700 text-red-900'
                      : 'border-gray-200 hover:border-red-300'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{main}</span>
                    {main === 'STUFFED CAPONS' && (
                      <span className="text-sm">+$10</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">Included Items</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                'COLESLAW (1 LB)',
                'GEFILTE FISH (4 SLICES)',
                'CHICKEN SOUP (1 QT)',
                'MATZAH BALLS',
                'POTATO KUGEL',
                'SUGAR SNAP PEAS',
                'CHOPPED LIVER (1/2 LB)',
                'EGG SALAD (1/2 LB)',
                'CHOLENT (2 LB)',
                'DELI ROLL (4 SLICES)'
              ].map((item) => (
                <div key={item} className="p-3 bg-gray-50 rounded-lg text-gray-700">
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-md p-6">
            <button
              onClick={handleBakeryPackageToggle}
              className={`w-full p-4 rounded-lg border transition-colors ${
                order.bakeryPackage
                  ? 'bg-red-50 border-red-700 text-red-900'
                  : 'border-gray-200 hover:border-red-300'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-lg">Add Bakery Package</h3>
                  <p className="text-sm text-gray-600">
                    Includes: 2 Challah Loaves, 6 Challah Rolls, and 1 LB Chocolate Chip Cookies
                  </p>
                </div>
                <span className="font-medium">+$25</span>
              </div>
            </button>
          </section>

          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-[#8B0000] mb-6">Contact Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center gap-2">
                    <User size={16} />
                    Your Name
                  </span>
                </label>
                <input
                  type="text"
                  value={order.customerInfo.name}
                  onChange={(e) => handleCustomerInfoChange('name', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#8B0000] focus:border-[#8B0000] transition-all"
                  placeholder="Enter your name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center gap-2">
                    <Phone size={16} />
                    Phone Number
                  </span>
                </label>
                <input
                  type="tel"
                  value={order.customerInfo.phone}
                  onChange={(e) => handleCustomerInfoChange('phone', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#8B0000] focus:border-[#8B0000] transition-all"
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center gap-2">
                    <MapPin size={16} />
                    Delivery Address
                  </span>
                </label>
                <input
                  type="text"
                  value={order.customerInfo.address}
                  onChange={(e) => handleCustomerInfoChange('address', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#8B0000] focus:border-[#8B0000] transition-all"
                  placeholder="Enter your delivery address"
                />
              </div>
            </div>
          </section>

          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-[#8B0000]">
              <Package2 size={24} />
              <span className="text-2xl font-bold">Total: ${total.toFixed(2)}</span>
            </div>
            {error && (
              <div className="w-full text-center text-red-600 bg-red-50 p-2 rounded">
                <p className="text-sm">{error}</p>
              </div>
            )}
            <button
              onClick={handlePayment}
              disabled={isLoading}
              className="bg-[#8B0000] text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-red-900 transition-colors w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <span>Place Order</span>
              )}
            </button>
          </div>

          <div className="text-center text-gray-600">
            <p className="font-medium">Free Delivery to:</p>
            <p>KEW GARDENS - KEW GARDENS HILLS - HILLCREST - FOREST HILLS</p>
          </div>
        </div>
      </main>

      <style>{`
        .shadow-text {
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
        }
      `}</style>
    </>
  );
}