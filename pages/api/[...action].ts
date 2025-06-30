// API route for all backend operations
import { NextApiRequest, NextApiResponse } from 'next';

// Import your existing controller functions
const userController = require('../../backend/controllers/userController');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, query } = req;
  const { action } = query;

  // Mock next function for compatibility with Express middleware
  const next = (error?: any) => {
    if (error) {
      console.error('API Error:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  };

  try {
    // Route based on the action parameter
    switch (action?.[0]) {
      case 'auto-installer':
        if (method === 'GET') {
          return userController.getAutoInstaller(req, res, next);
        }
        break;
        
      case 'register-webhook':
        if (method === 'POST') {
          return userController.registerWebhook(req, res, next);
        }
        break;
        
      default:
        res.status(404).json({ error: 'API endpoint not found' });
        return;
    }
    
    // If we get here, method is not allowed for this endpoint
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${method} Not Allowed`);
    
  } catch (error) {
    console.error('API Handler Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
