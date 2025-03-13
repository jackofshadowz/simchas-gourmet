import { Client, Environment } from 'square';
import type { NextApiRequest, NextApiResponse } from 'next';

const client = new Client({
  environment: Environment.Sandbox,
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { amount, customerInfo, orderDetails } = req.body;

  try {
    const { result } = await client.paymentsApi.createPayment({
      sourceId: 'cnon:card-nonce-ok', // Replace with actual nonce from client
      idempotencyKey: crypto.randomUUID(),
      amountMoney: {
        amount: amount,
        currency: 'USD',
      },
      customerId: customerInfo.id,
      note: `Order: ${orderDetails.id}`,
    });

    res.status(200).json({ url: result.payment.url });
  } catch (error) {
    console.error('Square API error:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
}
