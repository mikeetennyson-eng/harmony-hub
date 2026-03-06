# Harmony Hub Backend

A Node.js/Express backend for the Harmony Hub music platform using MongoDB.

## Features

- 🔐 User Authentication & Authorization
- 🎵 Song Management & Streaming
- 💳 Purchase System
- 🎼 Custom Song Requests
- 👨‍💼 Admin Dashboard
- 📁 File Upload Support

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT
- **Language**: TypeScript

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   ```bash
   cp .env.example .env
   ```
   Update the `.env` file with your configuration:
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: A secure secret for JWT tokens
   - `PORT`: Server port (default: 5000)

3. **Start MongoDB**
   Make sure MongoDB is running locally or update `MONGODB_URI` for cloud MongoDB.

4. **Development**
   ```bash
   npm run dev
   ```

5. **Production Build**
   ```bash
   npm run build
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Songs
- `GET /api/songs` - Get all available songs
- `GET /api/songs/:id` - Get song details
- `GET /api/songs/user/purchased` - Get user's purchased songs

### Purchases
- `POST /api/purchases` - Create purchase
- `GET /api/purchases/history` - Get purchase history

### Custom Requests
- `POST /api/custom-requests` - Create custom request
- `GET /api/custom-requests/my-requests` - Get user's requests

### Admin (Admin only)
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/songs` - Manage songs
- `GET /api/admin/custom-requests` - Manage custom requests
- `GET /api/admin/users` - User management
- `GET /api/admin/purchases` - Purchase management

### Cloudflare R2 Setup
The backend now uploads song files to Cloudflare R2. To configure, add these
variables to `.env` in the backend folder:

```
CF_ACCOUNT_ID=your_account_id
CF_R2_BUCKET=your_bucket_name
CF_R2_ACCESS_KEY_ID=your_access_key
CF_R2_SECRET_ACCESS_KEY=your_secret_key
CF_R2_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
CF_R2_REGION=auto   # or public region of your bucket
```

Once set, restarting the server will enable file uploads and presigned download
links.


## Database Models

- **User**: User accounts with authentication
- **Song**: Song metadata and file references
- **Purchase**: Purchase transactions
- **CustomRequest**: Custom song requests

## Development

- Uses TypeScript for type safety
- Hot reload with `tsx watch`
- ESLint for code quality
- Prettier for code formatting

## Deployment

1. Build the project: `npm run build`
2. Set environment variables
3. Start the server: `npm start`

## Security Features

- Helmet for security headers
- Rate limiting
- Input validation with express-validator
- JWT authentication
- Password hashing with bcrypt