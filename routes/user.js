const express = require('express');
const router = express.Router();
const User = require('../model/user');
const bcrypt = require('bcrypt');
const Joi = require('joi');

const authMiddleWare = require('../middleware/auth');

const jwt = require('jsonwebtoken');

const createUserSchema = Joi.object({
    name: Joi.string().min(3).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    deliveryAddress: Joi.string().min(5).required()
});

router.post('/', async (req, res) => {
    try {
        const { name, email, password, role, deliveryAddress } = req.body;
        const joiValidation = createUserSchema.validate(req.body);
        if (joiValidation.error) {
            return res.status(400).json({ message: joiValidation.error.details[0].message });
        }
        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            role: role || 'user',
            deliveryAddress
        });
        await newUser.save();
        const { accessToken, refreshToken } = generateTokens({ _id: newUser._id, name: newUser.name, role: newUser.role });

        const newHashedRefreshToken = await bcrypt.hash(refreshToken, 10)
        newUser.refreshToken = newHashedRefreshToken
        await newUser.save()

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: false, // change this secure to true for production
            sameSite: 'none',
            // domain: 'api.backend.com',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        })
        res.status(201).json({ message: 'User registered successfully', accessToken });
    } catch (error) {
        console.log('error :>> ', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        // validate the request body using Joi
        const joiValidation = loginSchema.validate(req.body);
        if (joiValidation.error) {
            return res.status(400).json({ message: joiValidation.error.details[0].message });
        }
        // find the user by email
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        } else {
            // compare the provided password with the hashed password in the database
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(400).json({ message: 'Invalid email or password' });
            } else {
                // generate a JWT token
                const { accessToken, refreshToken } = generateTokens({ _id: user._id, name: user.name, role: user.role })
                const newHashedRefreshToken = await bcrypt.hash(refreshToken, 10)
                user.refreshToken = newHashedRefreshToken
                await user.save()
                res.cookie('refreshToken', refreshToken, {
                    httpOnly: true,
                    secure: false, // change this secure to true for production
                    sameSite: 'none',
                    // domain: 'api.backend.com',
                    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
                })
                res.status(200).json({ message: 'Login successful', accessToken });
            }
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/', authMiddleWare, async (req, res) => {
    const user = await User.findById(req.user._id).select('-password');
    res.status(200).json({ message: 'User authenticated', user });

})

const generateTokens = (data) => {
    const accessToken = jwt.sign(data, process.env.ACCESS_TOKEN_KEY,
        { expiresIn: '1d' }
    )
    const refreshToken = jwt.sign({ _id: data._id }, process.env.REFRESH_TOKEN_KEY,
        { expiresIn: '7d' }
    )
    return { accessToken, refreshToken }
}

module.exports = router;