import type { CreateCheckoutRequest, CreateCheckoutResponse } from '../types';

export async function createCheckoutSession(data: CreateCheckoutRequest): Promise<CreateCheckoutResponse> {
  try {
    // Determine the API URL based on the environment
    const isProd = import.meta.env.PROD;
    
    // In development, use the local server path with the correct port
    // In production, use the Netlify Functions path
    const apiUrl = isProd 
      ? '/.netlify/functions/api/create-payment' 
      : 'http://localhost:3001/api/create-payment';
    
    console.log('Creating checkout session with data:', JSON.stringify(data, null, 2));
    console.log('Using API URL:', apiUrl);
    console.log('Environment:', isProd ? 'production' : 'development');
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', JSON.stringify(Object.fromEntries([...response.headers.entries()]), null, 2));
    
    // First check if the response is OK
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Failed to create checkout session: ${errorText || 'Unknown error'}`);
    }

    // Parse the successful response
    const responseData = await response.json();
    console.log('Checkout session created:', responseData);
    
    return responseData;
  } catch (error) {
    console.error('Error in createCheckoutSession:', error);
    throw error;
  }
};