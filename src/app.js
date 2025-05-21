require('dotenv').config();
require('express-async-errors');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const userRoutes = require('./routes/userRoutes');
const fileUploadRoutes = require('./routes/uploadRoutes');
// you will create this

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(compression());
app.use(express.json());
app.use(morgan('dev'));

app.use('/users', userRoutes);
app.use('/upload', fileUploadRoutes);
app.get('/health', (req, res) => res.status(200).send('API is healthy'));

// Centralized error handler (create in middlewares/errorHandler.js)
const errorHandler = require('./middlewares/errorHandler');
app.use(errorHandler);

module.exports = app;
