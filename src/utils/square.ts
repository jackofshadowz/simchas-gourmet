import type { CreateCheckoutRequest, CreateCheckoutResponse } from '../types';

export async function createCheckoutSession(data: CreateCheckoutRequest): Promise<CreateCheckoutResponse> {
  try {
    // Determine the API URL based on the environment
    // In production, use the Netlify Functions path
    // In development, use the local server path
    const isProd = import.meta.env.PROD;
    const apiUrl = isProd 
      ? '/.netlify/functions/api/create-payment' 
      : '/api/create-payment';
    
    console.log('Creating checkout session with data:', data);
    console.log('Using API URL:', apiUrl);
    console.log('Environment:', isProd ? 'production' : 'development');
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    console.log('Received response status:', response.status);
    console.log('Response headers:', Object.fromEntries([...response.headers.entries()]));

    // First check if the response is OK
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      
      try {
        // Try to parse the error response as JSON
        const errorData = await response.json();
        console.error('Error creating checkout session:', errorData);
        
        // Format a more detailed error message if possible
        if (errorData.details && errorData.details.errors) {
          const errorDetails = errorData.details.errors.map((err: any) => err.detail || err.message || JSON.stringify(err)).join('; ');
          errorMessage = `Failed to create checkout session: ${errorDetails}`;
        } else if (errorData.error) {
          errorMessage = `Failed to create checkout session: ${errorData.error}`;
          if (errorData.message) {
            errorMessage += ` - ${errorData.message}`;
          }
        } else {
          errorMessage = `Failed to create checkout session: ${JSON.stringify(errorData)}`;
        }
      } catch (parseError) {
        // If we can't parse the response as JSON, use the status text
        errorMessage = `Failed to create checkout session: ${response.statusText || 'Unknown error'}`;
      }
      
      throw new Error(errorMessage);
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