# E-Waste Facility Locator

A comprehensive web application for locating e-waste recycling facilities, managing recycling requests, and promoting environmental awareness through education and marketplace features.

## Features

### User Features
- **Facility Locator**: Find certified e-waste recycling centers near you
- **Educational Content**: Learn about e-waste environmental impact and health hazards
- **Recycling Requests**: Submit devices for recycling and earn credits
- **Device Pickup Service**: Schedule convenient home pickup with real-time tracking
- **Marketplace**: Buy and sell refurbished electronics
- **AI Chatbot**: Get answers to e-waste related questions
- **Credits System**: Earn credits for recycling devices

### Admin Features
- **Request Management**: Approve or reject user recycling requests
- **Pickup Management**: Manage device pickup requests with status tracking
- **Facility Management**: Add, edit, and manage recycling facilities
- **User Management**: View and manage registered users
- **Marketplace Moderation**: Monitor and moderate marketplace listings
- **Analytics Dashboard**: View system statistics and recent activity

## Technology Stack

### Frontend
- **HTML5/CSS3**: Modern responsive design
- **JavaScript (ES6+)**: Modular architecture with separate modules
- **Leaflet.js**: Interactive maps for facility locations
- **Socket.io Client**: Real-time pickup status updates
- **Font Awesome**: Icons and visual elements

### Backend
- **Node.js**: Server runtime
- **Express.js**: Web framework
- **MySQL**: Database management
- **JWT**: Authentication and authorization
- **bcryptjs**: Password hashing
- **Socket.io**: Real-time communication for pickup tracking

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- npm or yarn package manager

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ewaste-facility-locator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Database Setup**
   ```bash
   # Create MySQL database
   mysql -u root -p
   ```
   
   Then run the schema and seed files:
   ```sql
   source db/schema.sql
   source db/seed.sql
   ```

4. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=ewaste_locator
   JWT_SECRET=your_jwt_secret_key
   PORT=3000
   ```

5. **Start the application**
   ```bash
   npm start
   ```

6. **Access the application**
   - User Interface: http://localhost:3000
   - Admin Dashboard: http://localhost:3000/admin.html

## Real-time Pickup Tracking

The application includes real-time pickup status tracking using Socket.io:

### Features
- **Instant Updates**: Users see pickup status changes immediately
- **Fallback Polling**: Automatic fallback to polling if Socket.io is unavailable
- **Status Notifications**: Visual banners for pickup completion and progress
- **Admin Broadcasting**: Admin status updates are instantly sent to users

### Testing Real-time Updates

1. **Setup Test Scenario**:
   - Login as user (john@example.com / admin123)
   - Go to "Device Pickup" section
   - Create a pickup request

2. **Test Admin Updates**:
   - Open admin dashboard in another browser/tab
   - Login as admin (admin@ewaste.com / admin123)
   - Go to "Pickup Requests" tab
   - Update the pickup status to "scheduled" with note "Team assigned"

3. **Verify Real-time Updates**:
   - User page should instantly show updated status
   - Status badge should change color
   - Tracking note should appear
   - Visual highlight should appear on updated pickup

4. **Test Status Progression**:
   - Update status to "picked_up" → User sees progress banner
   - Update status to "completed" → User sees completion banner with credits
   - Credits should be automatically added to user account

### Disabling Real-time Features

To disable Socket.io and use polling only:
1. Remove Socket.io script from `frontend/index.html`
2. The system will automatically fall back to polling every 15 seconds

## Default Login Credentials

### Admin Account
- **Email**: admin@ewaste.com
- **Password**: admin123

### Test User Accounts
- **Email**: john@example.com, **Password**: admin123
- **Email**: jane@example.com, **Password**: admin123
- **Email**: mike@example.com, **Password**: admin123

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User/Admin login
- `GET /api/auth/profile` - Get current user profile

### Recycling Requests
- `POST /api/requests` - Submit recycling request
- `GET /api/requests/my-requests` - Get user's requests

### Pickup Requests
- `POST /api/pickups` - Create pickup request
- `GET /api/pickups/:userId` - Get user's pickup requests
- `GET /api/pickups/single/:id` - Get single pickup request
- `PUT /api/pickups/:id/cancel` - Cancel pending pickup

### Admin Endpoints
- `GET /api/admin/recycling-requests` - Get all recycling requests
- `PUT /api/admin/recycling-requests/:id/approve` - Approve request
- `PUT /api/admin/recycling-requests/:id/reject` - Reject request
- `GET /api/admin/pickups` - Get all pickup requests
- `PUT /api/admin/pickups/:id/status` - Update pickup status and tracking notes
- `GET /api/admin/users` - Get all users
- `GET /api/admin/stats/overview` - Get system statistics

### Facilities
- `GET /api/facilities` - Get all facilities
- `GET /api/facilities/nearby` - Get nearby facilities
- `POST /api/facilities` - Create facility (Admin only)

### Devices
- `GET /api/devices` - Get all devices
- `GET /api/devices/search` - Search devices
- `POST /api/devices/estimate` - Estimate device credits

### Marketplace
- `GET /api/marketplace` - Get marketplace listings
- `POST /api/marketplace` - Create listing
- `PUT /api/marketplace/:id` - Update listing
- `DELETE /api/marketplace/:id` - Delete listing

## Database Schema

### Key Tables
- **users**: User accounts with role-based access (user/admin)
- **recycling_requests**: User-submitted recycling requests
- **pickup_requests**: Device pickup scheduling and tracking
- **devices**: Device models with credit values and material content
- **facilities**: E-waste recycling facility locations
- **marketplace_listings**: User marketplace listings
- **educational_content**: Educational articles about e-waste

## User Workflow

1. **Registration/Login**: Users register or login with email/password
2. **Role Detection**: System checks user role and loads appropriate dashboard
3. **Request Submission**: Users select devices and submit recycling requests
4. **Pickup Scheduling**: Users can schedule convenient home pickup
5. **Real-time Tracking**: Users track pickup status with live updates
4. **Admin Review**: Admins review and approve/reject requests
5. **Credit Award**: Approved requests automatically add credits to user accounts
6. **Marketplace**: Users can buy/sell refurbished electronics

## Admin Workflow

1. **Admin Login**: Login with admin credentials
2. **Request Management**: Review pending recycling requests
3. **Pickup Management**: Update pickup status and add tracking notes
3. **Approval Process**: Approve requests to award credits to users
4. **Real-time Updates**: Status changes are instantly broadcast to users
4. **System Management**: Manage facilities, users, and marketplace listings
5. **Analytics**: Monitor system usage and activity

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access**: Separate user and admin permissions
- **Password Hashing**: bcrypt password encryption
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Protection**: Parameterized queries
- **Real-time Security**: Socket.io rooms restrict updates to authorized users

## Environmental Impact

The application promotes environmental responsibility by:
- Facilitating proper e-waste disposal
- Providing convenient home pickup services
- Educating users about environmental hazards
- Encouraging device reuse through marketplace
- Tracking recycling statistics and impact

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support or questions, please contact the development team or create an issue in the repository.