import express from 'express';
import cors from 'cors';
import { createServer } from 'vite';
import * as dotenv from 'dotenv';
import { webcrypto } from 'node:crypto';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Use the production URL
const SQUARE_API_URL = 'https://connect.squareup.com/v2';
// For sandbox testing
// const SQUARE_API_URL = 'https://connect.squareupsandbox.com/v2';
const SQUARE_ACCESS_TOKEN = process.env.VITE_SQUARE_ACCESS_TOKEN;
const SQUARE_LOCATION_ID = 'L987EZA5K8RHY'; // Override the environment variable
const SQUARE_APPLICATION_ID = process.env.VITE_SQUARE_APPLICATION_ID;

if (!SQUARE_ACCESS_TOKEN) {
  console.error('Missing required Square configuration');
  process.exit(1);
}

console.log('Square configuration loaded:', {
  locationId: SQUARE_LOCATION_ID,
  applicationId: SQUARE_APPLICATION_ID ? SQUARE_APPLICATION_ID.substring(0, 5) + '...' : 'Not provided',
  tokenFirstFive: SQUARE_ACCESS_TOKEN.substring(0, 5) + '...'
});

// Test endpoint to verify Square API token
app.get('/api/test-square-token', async (req, res) => {
  try {
    // Try a simpler endpoint first
    const response = await fetch(`${SQUARE_API_URL}/locations`, {
      method: 'GET',
      headers: {
        'Square-Version': '2023-09-25',
        'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const responseText = await response.text();
    console.log('Square API test response status:', response.status);
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log('Square API test response:', JSON.stringify(responseData, null, 2));
    } catch (e) {
      console.error('Failed to parse Square API test response:', responseText.substring(0, 200));
      return res.status(500).json({
        error: 'Invalid response from Square API',
        details: 'Could not parse response as JSON'
      });
    }

    if (!response.ok) {
      console.error('Square API test error:', responseData);
      return res.status(response.status).json({
        error: 'Failed to test Square API token',
        details: responseData
      });
    }

    res.json({
      success: true,
      message: 'Square API token is valid',
      data: responseData
    });
  } catch (error) {
    console.error('Square API test error:', error);
    res.status(500).json({
      error: 'Failed to test Square API token',
      details: error.message || 'Unknown error'
    });
  }
});

function generateUUID() {
  const array = new Uint8Array(16);
  webcrypto.getRandomValues(array);
  
  array[6] = (array[6] & 0x0f) | 0x40;
  array[8] = (array[8] & 0x3f) | 0x80;
  
  const hex = Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
    
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}

app.post('/api/create-payment', async (req, res) => {
  try {
    const { amount, customerInfo, orderDetails } = req.body;

    // Validate required fields
    if (!amount || !orderDetails?.items) {
      return res.status(400).json({ 
        error: 'Missing required fields'
      });
    }

    // Format phone number to E.164 format (required by Square) if provided
    let formattedPhone = '';
    if (customerInfo?.phone) {
      formattedPhone = customerInfo.phone;
      // Remove any non-digit characters
      formattedPhone = formattedPhone.replace(/\D/g, '');
      // Ensure it has the country code
      if (!formattedPhone.startsWith('1') && formattedPhone.length === 10) {
        formattedPhone = '1' + formattedPhone;
      }
      // Add the + prefix
      formattedPhone = '+' + formattedPhone;
    }

    console.log('Creating Square checkout with:', {
      locationId: SQUARE_LOCATION_ID,
      amount,
      customerInfo: { 
        ...customerInfo, 
        phone: formattedPhone ? formattedPhone.substring(0, 5) + '...' : 'Not provided',
        specialRequests: customerInfo?.specialRequests ? 'Special requests included' : 'No special requests'
      },
      orderItems: orderDetails.items.length,
      notes: orderDetails.notes ? 'Order notes included' : 'No notes'
    });

    // Create line items for the order
    const lineItems = orderDetails.items.map(item => {
      // Check for either price or amount property
      const itemPrice = item.price !== undefined ? item.price : (item.amount !== undefined ? item.amount : 0);
      // Ensure price is a number and convert to cents
      const priceInCents = Math.round((parseFloat(itemPrice) || 0) * 100);
      
      // Create a detailed item name if it's the main salad item
      let itemName = item.name;
      
      // Don't modify the item name here since we're already doing it in SaladOrder.tsx
      // This avoids duplication of the special requests in the item name
      
      console.log(`Item: ${itemName}, Price: ${itemPrice}, Price in cents: ${priceInCents}`);
      
      return {
        name: itemName,
        quantity: String(item.quantity),
        base_price_money: {
          amount: priceInCents,
          currency: 'USD'
        }
      };
    });

    // Helper function to format order details
    const formatOrderDetails = (details) => {
      if (!details) return '';
      
      let formattedNote = '';
      
      // Add notes if available
      if (details.notes) {
        formattedNote = details.notes;
      } else {
        formattedNote = 'Order Details:\n\n';
        
        // Add items
        if (details.items && details.items.length > 0) {
          formattedNote += 'Items:\n';
          details.items.forEach(item => {
            formattedNote += `- ${item.name} x${item.quantity}: $${(item.amount || 0).toFixed(2)}\n`;
          });
        }
        
        // Add description if available
        if (details.description) {
          const desc = details.description;
          formattedNote += '\nOrder Specifics:\n';
          
          if (desc.base) formattedNote += `- Base: ${desc.base}\n`;
          
          if (desc.toppings && desc.toppings.length > 0) {
            formattedNote += `- Toppings: ${desc.toppings.join(', ')}\n`;
          } else {
            formattedNote += '- Toppings: None selected\n';
          }
          
          if (desc.dressing) formattedNote += `- Dressing: ${desc.dressing}\n`;
          if (desc.protein) formattedNote += `- Protein: ${desc.protein}\n`;
          
          if (desc.specialRequests) {
            formattedNote += `\nSpecial Requests: ${desc.specialRequests}\n`;
          }
        }
      }
      
      return formattedNote;
    };

    try {
      // Create a payment link using Square API directly
      const response = await fetch(`${SQUARE_API_URL}/online-checkout/payment-links`, {
        method: 'POST',
        headers: {
          'Square-Version': '2023-09-25',
          'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          idempotency_key: generateUUID(),
          order: {
            location_id: SQUARE_LOCATION_ID,
            line_items: lineItems,
            // Add order details as a formatted note
            note: formatOrderDetails(orderDetails)
          },
          checkout_options: {
            redirect_url: `${process.env.NODE_ENV === 'production' ? 'https://your-domain.com' : 'http://localhost:5173'}/order-success`,
            merchant_support_email: 'support@simchasgourmet.com',
            ask_for_shipping_address: true,
            allow_tipping: false,
            enable_coupon: false,
            enable_loyalty: false,
            // Add customer name to the order title
            app_fee_money: {
              amount: 0,
              currency: 'USD'
            },
            title: customerInfo?.specialRequests || orderDetails.description?.specialRequests
              ? customerInfo?.name 
                ? `Order for ${customerInfo.name} (Special Requests)`
                : `Simchas Gourmet Order (Special Requests)`
              : customerInfo?.name 
                ? `Order for ${customerInfo.name}`
                : `Simchas Gourmet Order`
          },
          pre_populated_data: {
            // Only include email if it exists and is valid
            ...(customerInfo?.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerInfo.email) 
              ? { buyer_email: customerInfo.email } 
              : {}),
            // Only include phone if it's valid
            ...(formattedPhone.length >= 12 ? { buyer_phone_number: formattedPhone } : {}),
            // Only include name if provided
            ...(customerInfo?.name ? { buyer_name: customerInfo.name } : {})
          }
        })
      });

      const responseText = await response.text();
      console.log('Square API response status:', response.status);
      console.log('Square API response headers:', Object.fromEntries(response.headers.entries()));
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
        console.log('Square API response:', JSON.stringify(responseData, null, 2));
      } catch (e) {
        console.error('Failed to parse Square API response:', responseText.substring(0, 200));
        return res.status(500).json({
          error: 'Invalid response from Square API',
          details: 'Could not parse response as JSON'
        });
      }

      if (!response.ok) {
        console.error('Square API error:', responseData);
        return res.status(response.status).json({
          error: 'Failed to create checkout',
          details: responseData
        });
      }

      if (!responseData.payment_link?.url) {
        console.error('Invalid Square API response:', responseData);
        return res.status(500).json({
          error: 'Invalid response from Square API',
          details: 'Missing checkout URL'
        });
      }

      res.json({
        url: responseData.payment_link.url,
        orderId: responseData.payment_link.order_id || 'unknown'
      });
    } catch (error) {
      console.error('Square API error:', error);
      return res.status(500).json({
        error: 'Failed to create checkout',
        details: error.message || 'Unknown error'
      });
    }
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ 
      error: 'Failed to create payment',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create Vite server
const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'spa',
});

// Use Vite's middleware
app.use(vite.middlewares);

const PORT = process.env.PORT || 5173;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});