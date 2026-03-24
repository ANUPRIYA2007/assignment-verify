const express = require('express');
const path = require('path');

const app = express();

// Serve static files from client/dist
app.use(express.static(path.join(__dirname, 'client/dist'), { maxAge: '1d' }));

// SPA routing - serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

const port = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Frontend server running on port ${port}`);
  });
}

module.exports = app;
