# ELD Log Compliance System

A full-stack web application built with **Django** (backend) and **React** (frontend) to help truck drivers comply with FMCSA Hours of Service (HOS) regulations. Generates electronic logging device (ELD) records and provides trip management tools.

![Demo Screenshot](screenshot(300).png)

## Features
- **Trip Management**: Track pickup/dropoff locations and current cycles
- **HOS Compliance**: Automatically enforces 70-hour/8-day rule
- **Map Integration**: Visualize routes using Mapbox API
- **ELD Logs**: Generate FMCSA-compliant daily logs

## Technologies Used
### Frontend
- React.js
- Next.js
- Axios (API calls)
- React Router (Routing)
- React Map GL (Map integration)
- Shadcn and TailwindCSS

### Backend
- Django REST Framework
- PostgreSQL (Database)
- Python 3
- CORS Headers

### Tools
- Vercel (Frontend Hosting)
- Heroku (Backend Hosting)
- Git (Version Control)

## Installation
### Prerequisites
- Python 3.8+
- Node.js 16+
- PostgreSQL
- Mapbox Access Token

### Backend Setup
1. Clone repository:
   ```bash
   git clone https://github.com/KelvinMutuku/eld-log-app.git
   cd eld-log-app/backend
   ```

2. Create virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate # Linux/Mac
   venv\Scripts\activate # Windows
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure database:
   ```bash
   createdb triplog_db
   ```

5. Run migrations:
   ```bash
   python manage.py migrate
   ```

### Frontend Setup
1. Navigate to frontend:
   ```bash
   cd ../trip-logi-mapper
   ```

2. Install dependencies:
   ```bash
   npm install
   ```


## Configuration
### Backend Environment (backend/.env)
```env
SECRET_KEY=your_django_secret
DB_NAME=eld_logs
DB_USER=postgres
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432
```

## Running the Application
### Start Backend
```bash
cd backend
python manage.py runserver
```

### Start Frontend
```bash
cd trip-logi-mapper
npm run dev
```

## Project Structure
```
eld-log-app/
├── backend/
│   ├── api/              # Django app
│   │   ├── migrations/
│   │   ├── models.py       # Database models
│   │   ├── views.py        # API endpoints
│   ├── manage.py
│   └── settings.py         # Django configuration
│
└── trip-logi-mapper/
    ├── public/
    ├── src/
    │   ├── pages/     # React pages
    │   ├── index.tsx          # Main application
    │   
    └── package.json
```

## Contributing
1. Fork the repository
2. Create feature branch:
   ```bash
   git checkout -b feature/new-feature
   ```
3. Commit changes:
   ```bash
   git commit -m "Add new feature"
   ```
4. Push to branch:
   ```bash
   git push origin feature/new-feature
   ```
5. Open pull request

## License
MIT License

## Contact
For support or questions: [mutukuk553@gmail.com](mailto:mutukuk553@gmail.com)