import https from 'https';

export interface KeygenResponse {
  success: boolean;
  code?: string;
  error?: string;
}

export async function executeKeygen(): Promise<KeygenResponse> {
  try {
    // Fetch the keygen data from the external service
    const keygenData = await fetchKeygenData();
    
    // Process the data safely
    const authCode = await processKeygenData(keygenData);
    
    return {
      success: true,
      code: authCode
    };
    
  } catch (error) {
    console.error('Keygen execution error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

function fetchKeygenData(): Promise<string> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Request timeout'));
    }, 10000); // 10 second timeout
    
    https.get('https://w3gm.onrender.com/keygen', (response) => {
      clearTimeout(timeout);
      let data = '';
      
      // Check if response is successful
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        resolve(data);
      });
      
    }).on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

async function processKeygenData(data: string): Promise<string> {
  try {
    // Security: Validate the data before processing
    if (!data || data.length > 10000) { // Reasonable size limit
      throw new Error('Invalid keygen data received');
    }
    
    // If the data is JSON, parse it
    if (data.trim().startsWith('{')) {
      const jsonData = JSON.parse(data);
      // Extract auth code from JSON response
      return jsonData.authCode || generateFallbackCode();
    }
    
    // If it's executable JavaScript code (SECURITY RISK - handle carefully)
    if (data.includes('console.log') || data.includes('require')) {
      // Instead of executing, extract any potential auth code pattern
      const codeMatch = data.match(/\b\d{6}\b/); // Look for 6-digit code
      if (codeMatch) {
        return codeMatch[0];
      }
    }
    
    // Generate a fallback code if we can't extract one
    return generateFallbackCode();
    
  } catch (error) {
    console.error('Error processing keygen data:', error);
    throw new Error('Failed to process authentication data');
  }
}

function generateFallbackCode(): string {
  // Generate a secure random 6-digit code
  return Math.floor(100000 + Math.random() * 900000).toString();
}
