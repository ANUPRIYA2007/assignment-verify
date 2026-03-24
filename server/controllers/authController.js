const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
require('dotenv').config();

// Register a new user
exports.register = async (req, res) => {
    try {
        const { email, password, full_name, role } = req.body;

        if (!email || !password || !full_name) {
            return res.status(400).json({ error: 'Email, password, and full name are required.' });
        }

        const validRoles = ['student', 'teacher', 'admin'];
        const userRole = validRoles.includes(role) ? role : 'student';

        // Check if user already exists
        const { data: existing, error: existingError } = await supabase
            .from('users')
            .select('id')
            .eq('email', email);

        if (existing && existing.length > 0) {
            return res.status(400).json({ error: 'User with this email already exists.' });
        }

        if (existingError) {
            console.error('Check existing user error:', existingError);
            throw existingError;
        }

        // Hash password
        const salt = await bcrypt.genSalt(12);
        const password_hash = await bcrypt.hash(password, salt);

        // Prepare user data - only include student fields if role is student
        const userData = {
            email,
            full_name,
            role: userRole,
            password_hash,
            gender: req.body.gender
        };

        // Only include student-specific fields for student role
        if (userRole === 'student') {
            userData.register_number = req.body.register_number || null;
            userData.year_of_study = req.body.year_of_study || null;
            userData.section = req.body.section || null;
        }

        // Create user
        const { data: user, error } = await supabase
            .from('users')
            .insert(userData)
            .select()
            .single();

        if (error) throw error;

        // Generate JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'User registered successfully.',
            token,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                register_number: user.register_number || null,
                year_of_study: user.year_of_study || null,
                section: user.section || null,
                gender: user.gender || null
            }
        });
    } catch (err) {
        console.error('Register error:', err);
        let errorMessage = 'Registration failed. Please try again.';
        if (err.message && err.message.includes('column')) {
            errorMessage = 'Database schema error. Please contact administrator.';
        }
        res.status(500).json({ error: errorMessage });
    }
};

// Login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        // Find user
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email);

        if (error) {
            console.error('Get user error:', error);
            throw error;
        }

        if (!user || user.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const userData = user[0];

        // Compare password
        const isMatch = await bcrypt.compare(password, userData.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: userData.id, email: userData.email, role: userData.role, full_name: userData.full_name },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful.',
            token,
            user: {
                id: userData.id,
                email: userData.email,
                full_name: userData.full_name,
                role: userData.role,
                register_number: userData.register_number || null,
                year_of_study: userData.year_of_study || null,
                section: userData.section || null,
                gender: userData.gender || null
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed. Please try again.' });
    }
};

// Get current user profile
exports.getProfile = async (req, res) => {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('id, email, full_name, role, avatar_url, register_number, year_of_study, section, gender, created_at')
            .eq('id', req.user.id)
            .single();

        if (error || !user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        res.json({ user });
    } catch (err) {
        console.error('Profile error:', err);
        res.status(500).json({ error: 'Failed to fetch profile.' });
    }
};
