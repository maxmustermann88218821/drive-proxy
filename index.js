const express = require('express');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;

app.get('/proxy', async (req, res) => {
  const fileUrl = req.query.url;
  if (!fileUrl) {
    return res.status(400).send('Missing URL parameter');
  }

  try {
    const response = await axios({
      url: fileUrl,
      method: 'GET',
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'audio/mpeg',
        'Accept-Encoding': 'identity',
        'Referer': 'https://drive.google.com/' // Add Referer header to mimic a browser request
      },
      maxRedirects: 5 // Follow redirects
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    res.set('Content-Type', 'audio/mpeg');
    response.data.pipe(res);
  } catch (error) {
    console.error('Error fetching file:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    }
    res.status(500).send('Error fetching file');
  }
});

app.listen(port, () => {
  console.log(`Proxy server running on port ${port}`);
});