import { NextApiRequest, NextApiResponse } from 'next';
import { storeCode } from '../../../lib/codeCache';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { deviceCode, verificationCode } = req.body;
      
      if (!deviceCode || !verificationCode) {
        return res.status(400).json({ error: 'Device code and verification code are required' });
      }
      
      // Store the code in the cache
      storeCode(deviceCode, verificationCode);
      
      res.status(200).json({ 
        success: true, 
        message: 'Code stored successfully',
        timestamp: Date.now()
      });
      
    } catch (error) {
      res.status(500).json({ error: 'Failed to store verification code' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
