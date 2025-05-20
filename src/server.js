const mongoose = require('mongoose');
const app = require('./app');
const { dbConnectionFunction } = require('./db/connection');

const PORT = process.env.PORT || 3001;



dbConnectionFunction().then(() => {
    console.log('Database connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => {
    console.error('Database connection error:', err);
    process.exit(1);
});