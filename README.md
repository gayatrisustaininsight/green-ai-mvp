# Green AI MVP Backend

## Description
This is the backend service for the Green AI MVP project, providing API endpoints and business logic for the application.

## Prerequisites
- Node.js (v14 or higher)
- npm (Node Package Manager)

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd Backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add your environment variables:
```env
PORT=3000
# Add other environment variables as needed
```

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

## API Documentation

### Available Endpoints
- `GET /api/health` - Health check endpoint
- More endpoints will be documented here

## Testing
Run the test suite:
```bash
npm test
```

## Project Structure
```
src/
├── controllers/    # Request handlers
├── models/        # Data models
├── routes/        # API routes
├── services/      # Business logic
├── utils/         # Utility functions
└── app.js         # Application entry point
```

## Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Contact
For any queries or support, please reach out to the development team.
