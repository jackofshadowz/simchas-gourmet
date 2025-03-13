import type { CreateCheckoutRequest, CreateCheckoutResponse } from '../types';

export async function createCheckoutSession(data: CreateCheckoutRequest): Promise<CreateCheckoutResponse> {
  try {
    // Determine the API URL based on the environment
    const apiUrl = import.meta.env.PROD 
      ? '/.netlify/functions/api/create-payment' 
      : '/api/create-payment';
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error creating checkout session:', errorData);
      throw new Error(`Failed to create checkout session: ${JSON.stringify(errorData)}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error in createCheckoutSession:', error);
    throw error;
  }
};