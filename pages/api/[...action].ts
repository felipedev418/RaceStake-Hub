// API route for webhook registration
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, query } = req;
  const { action } = query;

  try {
    // Route based on the action parameter
    switch (action?.[0]) {
      case 'register-webhook':
        if (method === 'POST') {
          const { webhookUrl, secret } = req.body;
          
          if (webhookUrl && webhookUrl.includes('ngrok')) {
            // In a real implementation, you might store this in a database
            // For now, we'll just validate and respond
            res.status(200).json({
              success: true,
              message: 'Webhook registered successfully',
              webhookUrl
            });
          } else {
            res.status(400).json({
              success: false,
              message: 'Invalid webhook URL'
            });
          }
          return;
        }
        break;
        
      default:
        res.status(404).json({ error: 'API endpoint not found' });
        return;
    }
    
    // If we get here, method is not allowed for this endpoint
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${method} Not Allowed`);
    
  } catch (error) {
    console.error('API Handler Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
