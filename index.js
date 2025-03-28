const express = require('express');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;

const API_KEY = 'AIzaSyD2CdHoW7NpyOMYFj9BCNE0xsYhKOFSOaI';

app.get('/proxy', async (req, res) => {
  const fileId = req.query.fileId;
  if (!fileId) {
    return res.status(400).send('Missing fileId parameter');
  }

  try {
    // Use the Google Drive API to get the file metadata
    const metadataUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?key=${API_KEY}&fields=webContentLink,size`;
    const metadataResponse = await axios.get(metadataUrl);
    const fileUrl = metadataResponse.data.webContentLink;
    const fileSize = parseInt(metadataResponse.data.size, 10);

    // Handle range requests for seeking
    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      const chunksize = (end - start) + 1;
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'audio/mpeg',
        'Accept-Encoding': 'identity',
        'Referer': 'https://drive.google.com/',
        'Range': `bytes=${start}-${end}`
      };

      const response = await axios({
        url: fileUrl,
        method: 'GET',
        responseType: 'stream',
        headers,
        maxRedirects: 5
      });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'audio/mpeg'
      });

      response.data.pipe(res);
    } else {
      // Full file request
      const response = await axios({
        url: fileUrl,
        method: 'GET',
        responseType: 'stream',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'audio/mpeg',
          'Accept-Encoding': 'identity',
          'Referer': 'https://drive.google.com/'
        },
        maxRedirects: 5
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      res.set('Content-Type', 'audio/mpeg');
      res.set('Accept-Ranges', 'bytes');
      res.set('Content-Length', fileSize);
      response.data.pipe(res);
    }
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