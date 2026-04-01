const API_TARGET = 'https://yttttttt.anshapi.workers.dev';

// Store valid keys and their expiry dates
const validKeys = new Map();

// Initialize with your 30-day key
const initKey = () => {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 30);
  validKeys.set('30day', expiryDate);
};

initKey();

// Helper to check if key is valid
function isKeyValid(key) {
  if (!validKeys.has(key)) return false;
  const expiryDate = validKeys.get(key);
  return new Date() < expiryDate;
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Check for API key
  const apiKey = req.headers['x-api-key'] || req.query.key;

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API key is required. Please provide x-api-key header or key query parameter.'
    });
  }

  // Validate API key
  if (!isKeyValid(apiKey)) {
    return res.status(403).json({
      success: false,
      error: 'Invalid or expired API key. This API key is only valid for 30 days.'
    });
  }

  // Get the mobile number from request
  const mobile = req.query.num || req.body?.num;

  if (!mobile) {
    return res.status(400).json({
      success: false,
      error: 'Mobile number is required. Please provide num parameter.'
    });
  }

  try {
    // Forward request to original API
    const originalUrl = `${API_TARGET}/?key=DARKOSINT&num=${mobile}`;
    
    const response = await fetch(originalUrl);
    const data = await response.json();

    // Modify the response
    if (data.success) {
      // Change the credit field
      data.credit = '@PurelyYour';
      
      // Add metadata about key validity
      const keyExpiry = validKeys.get(apiKey);
      data.key_valid_until = keyExpiry.toISOString();
      data.key_days_remaining = Math.ceil((keyExpiry - new Date()) / (1000 * 60 * 60 * 24));
    }

    // Return modified response
    return res.status(response.status).json(data);
    
  } catch (error) {
    console.error('Error fetching from target API:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch data from the source API',
      details: error.message
    });
  }
}
