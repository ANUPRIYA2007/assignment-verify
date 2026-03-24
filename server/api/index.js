const express = require('express');
const cors = require('cors');

// Load routes
const authRoutes = require('../routes/authRoutes');
const assignmentRoutes = require('../routes/assignmentRoutes');
const submissionRoutes = require('../routes/submissionRoutes');
const lateRequestRoutes = require('../routes/lateRequestRoutes');
const adminRoutes = require('../routes/adminRoutes');
const teacherRoutes = require('../routes/teacherRoutes');

const app = express();

// CORS Middleware
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:3000',
        'https://assignment-verify.vercel.app',
        'https://evalyn-assignment-verify.vercel.app'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        status: 'ok', 
        message: 'Assignment Verify API is running',
        timestamp: new Date().toISOString()
    });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/late-requests', lateRequestRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teacher', teacherRoutes);

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Route not found', 
        path: req.path,
        method: req.method 
    });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error('Error:', err.message, err.stack);
    res.status(500).json({ 
        error: 'Internal server error',
        message: err.message
    });
});

module.exports = app;
