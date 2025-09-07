# Budget Manager

A full-stack budget management application with React frontend, Fastify API backend, and MongoDB database.

## Features

- 💰 Expense tracking with categories
- 🎯 Asset management with progress tracking
- 📊 Dashboard with financial summaries
- 🌍 Multi-language support (English/Turkish)
- 📱 Responsive design
- 🐳 Docker containerized deployment
- 🔒 Security best practices

## Tech Stack

- **Frontend:** React, Tailwind CSS, Vite
- **Backend:** Node.js, Fastify, Mongoose
- **Database:** MongoDB
- **Proxy:** Nginx
- **Deployment:** Docker, Docker Compose

## Quick Start with Docker

### Prerequisites

- Docker
- Docker Compose
- Make (optional, for convenience commands)

### Running the Application

1. Clone the repository:
```bash
git clone https://github.com/mehmetkirkoca/budget-manager.git
cd budget-manager
```

2. Start all services:
```bash
# Using Make (recommended)
make up

# Or using Docker Compose directly
docker-compose up -d
```

3. Access the application:
- **Application:** http://localhost
- **API Health:** http://localhost/health

### Available Make Commands

```bash
make help          # Show all available commands
make build         # Build all Docker images
make up            # Start all services
make down          # Stop all services
make restart       # Restart all services
make logs          # Show logs for all services
make logs-api      # Show API logs
make logs-ui       # Show UI logs
make clean         # Remove all containers and volumes
```

## Development

### Local Development (without Docker)

1. **Start MongoDB:**
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:7-jammy

# Or install MongoDB locally
```

2. **Start API:**
```bash
cd api
npm install
npm run dev
```

3. **Start UI:**
```bash
cd ui
npm install
npm run dev
```

### Environment Variables

**API (.env):**
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/budget-manager
```

**UI (.env):**
```env
VITE_API_URL=http://localhost:3000/api
```

## API Endpoints

### Expenses
- `GET /api/expenses` - Get all expenses
- `POST /api/expenses` - Create new expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `GET /api/expenses/by-category` - Get expenses grouped by category

### Assets
- `GET /api/assets` - Get all assets
- `POST /api/assets` - Create new asset
- `PUT /api/assets/:id` - Update asset
- `DELETE /api/assets/:id` - Delete asset
- `GET /api/assets/progress` - Get assets with progress data

### Summary
- `GET /api/summary` - Get financial summary

## Project Structure

```
budget-manager/
├── api/                    # Backend API
│   ├── src/
│   │   ├── controllers/   # Route controllers
│   │   ├── models/        # MongoDB models
│   │   ├── routes/        # API routes
│   │   └── config/        # Database config
│   ├── Dockerfile
│   └── package.json
├── ui/                     # Frontend React app
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── i18n.js        # Internationalization
│   ├── Dockerfile
│   └── package.json
├── nginx/                  # Nginx configuration
│   └── nginx.conf
├── docker-compose.yml      # Docker services
├── mongo-init.js          # MongoDB initialization
└── Makefile               # Development commands
```

## Docker Services

- **nginx** - Reverse proxy (Port 80)
- **ui** - React frontend (Internal port 8080)
- **api** - Fastify backend (Internal port 3000)
- **mongodb** - Database (Internal port 27017)

## Security Features

- Non-root containers
- Security headers
- Rate limiting
- Input validation
- Health checks

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.