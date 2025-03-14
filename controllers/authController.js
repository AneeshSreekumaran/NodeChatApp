require('dotenv').config();

const User = require('../models/User');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const mongoose = require('mongoose');

// Nodemailer setup
const transporter = nodemailer.createTransport({
    service: 'gmail', // or your email service
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
        type: 'PLAIN',
    },
});

// Helper function to generate OTP
const generateOTP = () => {
    return crypto.randomInt(100000, 999999).toString();
};

// Helper function to send OTP via email
const sendOTP = async (email, otp) => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your OTP for Registration',
            html: `<p>Your OTP is: <b>${otp}</b>. It will expire in ${process.env.OTP_EXPIRES} minutes.</p>`,
        });
    } catch (error) {
        console.error('Error sending OTP:', error);
        throw new Error('Failed to send OTP email.');
    }
};

exports.register = async (req, res) => {
    const session = await mongoose.startSession(); // Start a session
    session.startTransaction(); // Start a transaction

    try {
        const { username, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            await session.abortTransaction(); // Abort the transaction
            session.endSession(); // End the session
            return res.status(400).render('auth/register', { error: 'Email already registered.' });
        }

        // Generate OTP
        const otp = generateOTP();
        const otpExpires = Date.now() + (parseInt(process.env.OTP_EXPIRES) * 60 * 1000); // Expires in X minutes

        const newUser = new User({
            username,
            email,
            password,
            otp,
            otpExpires
        });

        // Save the user *within the transaction*
        await newUser.save({ session }); // Pass the session

        // Send OTP via email
        await sendOTP(email, otp);

        await session.commitTransaction(); // Commit the transaction
        session.endSession(); // End the session

        // Redirect to OTP verification page (create a new view for this)
        res.render('auth/verify-otp', { email: email, error: null }); // Pass email to the verify-otp view
    } catch (error) {
        console.error('Registration error:', error);
        await session.abortTransaction(); // Abort the transaction on error
        session.endSession(); // End the session
        res.status(500).render('auth/register', { error: 'Registration failed.' });
    }
};

exports.verifyOTP = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { email, otp } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).render('auth/verify-otp', { email, error: 'Invalid email or OTP.' });
        }

        if (user.otp !== otp || user.otpExpires < Date.now()) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).render('auth/verify-otp', { email, error: 'Invalid or expired OTP.' });
        }

        // Clear OTP fields in the database
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save({ session }); // Pass the session

        await session.commitTransaction();
        session.endSession();

        // Redirect to login page after successful verification
        res.redirect('/login');
    } catch (error) {
        console.error('OTP verification error:', error);
        await session.abortTransaction();
        session.endSession();
        res.status(500).render('auth/verify-otp', { email, error: 'OTP verification failed.' });
    }
};

// Login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user || !(await user.isValidPassword(password))) {
            return res.status(400).render('auth/login', { error: 'Invalid credentials.' });
        }

        // Set session
        req.session.userId = user._id;

        res.redirect('/dashboard');
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).render('auth/login', { error: 'Login failed.' });
    }
};

// Logout
exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/login');
    });
};