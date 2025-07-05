import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { deviceCode, verificationCode } = req.body;
    
    if (!deviceCode || !verificationCode) {
      return res.status(400).json({ error: 'Device code and verification code are required' });
    }
    
    // Generate expected code based on device code
    const hash = crypto.createHash('sha256').update(deviceCode).digest('hex');
    const expectedCode = hash.substring(0, 6).toUpperCase().replace(/[^0-9]/g, '').padStart(6, '0').substring(0, 6);
    
    if (verificationCode === expectedCode) {
      res.status(200).json({ 
        success: true, 
        message: 'Authentication successful',
        token: crypto.randomUUID() // Generate session token
      });
    } else {
      res.status(401).json({ 
        success: false, 
        message: 'Invalid verification code' 
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
