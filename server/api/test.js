const express = require('express');
const cors = require('cors');

const app = express();

// CORS
app.use(cors({
    origin: '*',
    credentials: true
}));

app.use(express.json());

// Simple health check - no dependencies
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'API is working',
        timestamp: new Date().toISOString()
    });
});

// Catch all
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Not found', path: req.path });
});

module.exports = app;
