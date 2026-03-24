const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:3000',
    'https://assignment-verify.vercel.app',
    'https://evalyn-assignment-verify.vercel.app',
    /^https:\/\/.*\.vercel\.app$/
];

app.use(cors({
    origin: function(origin, callback) {
        if (!origin) {
            callback(null, true);
            return;
        }
        const isAllowed = allowedOrigins.some(allowed => {
            if (allowed instanceof RegExp) {
                return allowed.test(origin);
            }
            return origin === allowed;
        });
        callback(null, isAllowed);
    },
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Assignment Verify API is running.',
        timestamp: new Date().toISOString() 
    });
});

// Load routes - with error handling
try {
    const authRoutes = require('./routes/authRoutes');
    const assignmentRoutes = require('./routes/assignmentRoutes');
    const submissionRoutes = require('./routes/submissionRoutes');
    const lateRequestRoutes = require('./routes/lateRequestRoutes');
    const adminRoutes = require('./routes/adminRoutes');
    const teacherRoutes = require('./routes/teacherRoutes');

    // Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/assignments', assignmentRoutes);
    app.use('/api/submissions', submissionRoutes);
    app.use('/api/late-requests', lateRequestRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/teacher', teacherRoutes);
} catch (err) {
    console.error('Failed to load routes:', err);
    // Continue with just health check if routes fail to load
}

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found.' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    if (err.message && err.message.includes('Invalid file type')) {
        return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Internal server error.' });
});

// Only listen locally
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📦 Supabase URL: ${process.env.SUPABASE_URL}`);
    });
}

module.exports = app;
