const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch');

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();
app.use(cors());
app.use(express.json());

// Get Square configuration
const SQUARE_API_URL = 'https://connect.squareup.com/v2';
const SQUARE_ACCESS_TOKEN = process.env.VITE_SQUARE_ACCESS_TOKEN;
const SQUARE_LOCATION_ID = 'L987EZA5K8RHY'; // Using the production location ID from memory
const SQUARE_APPLICATION_ID = process.env.VITE_SQUARE_APPLICATION_ID;

// Helper function to generate UUID
const generateUUID = () => {
  return uuidv4();
};

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
      
      if (desc.protein) {
        formattedNote += `- Protein: ${desc.protein}\n`;
      }
      
      if (desc.toppings && desc.toppings.length > 0) {
        formattedNote += `- Toppings: ${desc.toppings.join(', ')}\n`;
      }
      
      if (desc.dressing) {
        formattedNote += `- Dressing: ${desc.dressing}\n`;
      }
      
      if (desc.specialRequests && desc.specialRequests !== 'None') {
        formattedNote += `- Special Requests: ${desc.specialRequests}\n`;
      }
    }
  }
  
  return formattedNote;
};

// Create payment link endpoint
app.post('/api/create-payment', async (req, res) => {
  console.log('Create payment request received:', req.body);
  
  const { amount, orderDetails, customerInfo } = req.body;
  
  // Validate required fields
  if (!amount || !orderDetails || !orderDetails.items) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
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

  try {
    // Create a payment link using Square API directly
    console.log('Sending request to Square API:', JSON.stringify({
      idempotency_key: generateUUID(),
      order: {
        location_id: SQUARE_LOCATION_ID,
        line_items: lineItems,
        note: formatOrderDetails(orderDetails)
      },
      checkout_options: {
        redirect_url: `${process.env.URL || 'https://simchas-gourmet.netlify.app'}/order-success`,
        merchant_support_email: 'support@simchasgourmet.com',
        ask_for_shipping_address: true,
        allow_tipping: false,
        enable_coupon: false,
        enable_loyalty: false,
        app_fee_money: {
          amount: 0,
          currency: 'USD'
        },
        title: customerInfo?.specialRequests 
          ? `Simchas Gourmet Order (Special Requests)`
          : `Simchas Gourmet Order`
      }
    }));
    
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
          redirect_url: `${process.env.URL || 'https://simchas-gourmet.netlify.app'}/order-success`,
          merchant_support_email: 'support@simchasgourmet.com',
          ask_for_shipping_address: true,
          allow_tipping: false,
          enable_coupon: false,
          enable_loyalty: false,
          app_fee_money: {
            amount: 0,
            currency: 'USD'
          },
          title: customerInfo?.specialRequests 
            ? `Simchas Gourmet Order (Special Requests)`
            : `Simchas Gourmet Order`
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Square API error:', errorData);
      return res.status(response.status).json({
        error: 'Failed to create payment link',
        details: errorData
      });
    }

    const responseData = await response.json();
    console.log('Square API response:', responseData);
    
    return res.json(responseData);
  } catch (error) {
    console.error('Error creating payment link:', error);
    return res.status(500).json({
      error: 'Failed to create payment link',
      message: error.message
    });
  }
});

// Default route
app.get('/', (req, res) => {
  res.json({ message: 'Simchas Gourmet API is running' });
});

// Create a router to handle routes in Express
const router = express.Router();
router.use('/', app);

// Export the serverless function
module.exports.handler = serverless(app);
