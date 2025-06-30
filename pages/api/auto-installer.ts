// API route: /api/auto-installer
import { NextApiRequest, NextApiResponse } from 'next';

const userController = require('../../backend/controllers/userController');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const next = (error?: any) => {
    if (error) {
      console.error('Auto-installer API Error:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  };

  try {
    return userController.getAutoInstaller(req, res, next);
  } catch (error) {
    console.error('Auto-installer Handler Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
