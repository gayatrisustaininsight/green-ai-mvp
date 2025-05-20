const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const { successResponse, errorResponse } = require('../utils/response');

exports.register = async (req, res) => {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return errorResponse(res, {
        statusCode: 400,
        message: 'Email already exists'
    });

    const user = new User({ name, email, password });
    await user.save();

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

    return successResponse(res, {
        statusCode: 201,
        message: 'User registered successfully',
        data: {
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        }
    });
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return errorResponse(res, {
        statusCode: 400,
        message: 'Invalid credentials'
    });

    const valid = await user.comparePassword(password);
    if (!valid) return errorResponse(res, {
        statusCode: 400,
        message: 'Invalid credentials'
    });

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

    return successResponse(res, {
        message: 'Login successful',
        data: {
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        }
    });
};
