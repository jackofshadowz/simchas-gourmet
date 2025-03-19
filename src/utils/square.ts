import type { CreateCheckoutRequest, CreateCheckoutResponse } from '../types';

export async function createCheckoutSession(data: CreateCheckoutRequest): Promise<CreateCheckoutResponse> {
  try {
    // Determine the API URL based on the environment
    const apiUrl = import.meta.env.PROD 
      ? '/.netlify/functions/api/create-payment' 
      : '/api/create-payment';
    
    console.log('Creating checkout session with data:', data);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

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