// API endpoint for manual data refresh
// This can be called to trigger a data update

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // In a production environment, this would trigger the data fetch
    // For now, we just return success
    res.status(200).json({ 
      success: true, 
      message: 'Refresh triggered',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
