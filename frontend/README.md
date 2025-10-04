# ExpenseTracker - Professional Expense Management System

A comprehensive expense management system built with React, TypeScript, and Django REST Framework. This application provides role-based access control for admins, managers, and employees to efficiently track and manage expenses.

## Features

- **Role-Based Access Control**: Different interfaces for Admin, Manager, and Employee roles
- **Expense Submission**: Easy expense submission with receipt uploads
- **Approval Workflow**: Multi-level approval process for expense requests
- **Dashboard Analytics**: Comprehensive statistics and reporting
- **Responsive Design**: Modern, mobile-friendly interface built with Tailwind CSS
- **Real-time Updates**: Live notifications and status updates

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Shadcn/UI** for component library
- **Framer Motion** for animations
- **React Hook Form** for form management

### Backend
- **Django 5.2** with Django REST Framework
- **JWT Authentication** for secure API access
- **SQLite** database (easily upgradeable to PostgreSQL)
- **Role-based permissions** and security

## Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- Python 3.11+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd expense-tracker
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Backend Setup**
   ```bash
   cd backend/expense
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py runserver
   ```

4. **Create a superuser (optional)**
   ```bash
   python manage.py createsuperuser
   ```

### Development

- Frontend runs on `http://localhost:8080`
- Backend API runs on `http://localhost:8000`
- Admin panel available at `http://localhost:8000/admin`

## Project Structure

```
expense-tracker/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Main application pages
│   │   ├── lib/            # API utilities and helpers
│   │   └── contexts/       # React context providers
│   └── public/             # Static assets
├── backend/                 # Django backend
│   └── expense/            # Main Django project
│       ├── authentication/ # User authentication app
│       ├── employees/      # Employee expense management
│       └── manager/        # Manager approval workflow
```

## User Roles

### Admin
- Complete system access
- User management
- System-wide expense overview
- Configuration management

### Manager
- Team expense approval
- Dashboard with team statistics
- Bulk approval operations
- Team member management

### Employee
- Expense submission
- Personal expense tracking
- Receipt uploads
- Status monitoring

## API Documentation

The backend provides a comprehensive REST API with the following main endpoints:

- `/api/auth/` - Authentication (login, register, token refresh)
- `/api/expenses/` - Expense CRUD operations
- `/api/manager/` - Manager-specific operations
- `/api/categories/` - Expense categories

## Building for Production

### Frontend
```bash
cd frontend
npm run build
```

### Backend
```bash
cd backend/expense
python manage.py collectstatic
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@expensetracker.com or create an issue in the repository.