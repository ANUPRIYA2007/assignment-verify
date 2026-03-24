const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// Simple health check - no external dependencies
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok',
        message: 'API working',
        timestamp: new Date().toISOString()
    });
});

// Fallback
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Not found' });
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
    app.listen(PORT, () => console.log(`Server on port ${PORT}`));
}

module.exports = app;
