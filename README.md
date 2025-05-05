# 🏓 ft_transcendence - Multiplayer Pong Game

![Pong Game Banner](https://raw.githubusercontent.com/UN-35/ft_transcendence/main/frontend/img/test.jpeg)

## Overview

**ft_transcendence** is a modern web-based implementation of the classic Pong game, featuring both local and networked multiplayer gameplay, user management, tournaments, and more. This project builds a complete web application with real-time multiplayer capabilities, user authentication, and responsive design.

## 🎮 Features

### Core Gameplay
- **Classic Pong Experience**: Faithful recreation of the original 1972 Pong game with modern enhancements
- **Tournament System**: Organize and participate in tournaments with multiple players
- **Matchmaking**: Automatically pair players for matches and track tournament progress
- **Local Multiplayer**: Play against a friend on the same device
- **Remote Multiplayer**: Challenge players over the internet
- **Real-time Gameplay**: Smooth, responsive gaming experience

### User Management
- **User Authentication**: Secure signup and login system
- **Profile Customization**: Upload avatars and update profile information
- **Friend System**: Add friends and see when they're online
- **Match History**: View your gaming statistics and past matches
- **Live Chat**: Communicate with other players in real-time
- **Google Authentication**: Login with your Google account

### Technical Features
- **Responsive Design**: Play on any device with a compatible browser
- **Multi-language Support**: Enjoy the game in English, French, and Spanish
- **HTTPS Security**: All connections are secured with SSL/TLS
- **Two-Factor Authentication**: Additional security layer for user accounts

## 🛠️ Technology Stack

- **Frontend**: TypeScript with Tailwind CSS
- **Backend**: Django with Channels for WebSocket support
- **Database**: PostgreSQL for data persistence
- **Containerization**: Docker for consistent deployment
- **Real-time Communication**: WebSockets for game synchronization and chat

## 📋 Prerequisites

- Docker and Docker Compose
- A modern web browser (Mozilla Firefox, Chrome, etc.)
- Minimum screen resolution of 1024x768 (responsive design supports various devices)

## 🚀 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/username/ft_transcendence.git
   cd ft_transcendence
   ```

2. **Build and run the application**
   ```bash
   make up
   ```
   This will start all services defined in the docker-compose.yml file.

3. **Access the application**
   - Open your browser and navigate to https://localhost:8443
   - Accept the self-signed certificate (for development purposes)

4. **Perform database migrations (if needed)**
   ```bash
   make migrate
   ```

5. **Stop the application**
   ```bash
   make down
   ```

## 📌 Project Structure

```
ft_transcendence/
├── accounts_service/      # User management microservice
├── game_service/          # Game logic microservice
├── frontend/              # Frontend assets and code
│   ├── css/               # Stylesheet files
│   ├── js/                # JavaScript/TypeScript files
│   │   └── game/          # Game-specific logic
│   └── img/               # Image assets
├── nginx/                 # Web server configuration
├── docker-compose.yml     # Container orchestration
└── Makefile               # Utility commands
```

## 🎯 Game Modes

### Local Play
Challenge a friend using the same keyboard:
- Player 1: Arrow keys (Up/Down)
- Player 2: W/S keys

### Tournament Mode
Create a tournament with multiple players, taking turns to compete. The system tracks progression and announces upcoming matches.

## 💻 API Documentation

Our application provides a RESTful API for various functionalities:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/accounts/api/signup/` | POST | Register a new user |
| `/accounts/api/login/` | POST | User authentication |
| `/accounts/api/profile/` | GET | Retrieve user profile |
| `/accounts/api/update_profile/` | POST | Update user profile |
| `/accounts/api/leaderboard/` | GET | Get player rankings |
| `/accounts/api/game_history/` | GET | Retrieve match history |

## 👥 Contributing

1. ([@Hiba](https://github.com/hiamedja))
2. ([@Kaouthar](https://github.com/kaoutharrr))
3. ([@UN35](https://github.com/UN-35))

## 🔒 Security Features

- Password hashing using industry-standard algorithms
- Protection against SQL injections and XSS attacks
- Input validation for all forms
- HTTPS for secure connections
- Two-factor authentication (2FA)

## 🌐 Browser Compatibility

The application is optimized for:
- Mozilla Firefox (latest version) - Primary supported browser
- Google Chrome (latest version)
- Safari (latest version)
- Edge (latest version)

## 📱 Mobile Support

The responsive design allows gameplay on various devices:
- Desktop computers
- Laptops
- Tablets
- Mobile phones (landscape orientation recommended)

## 🗣️ Languages

The interface is available in:
- 🇺🇸 English
- 🇫🇷 French
- 🇪🇸 Spanish

## ⚙️ Development Commands

```bash
# Start all services
make up

# Stop all services
make down

# Apply database migrations
make migrate

# Create database migrations
make makemigrations

# Create superuser
make createsuperuser

# Access shell
make shell

# View logs
make logs

# Clean Docker system
make fclean

# Restart services
make restart
```

## 📜 License

This project is part of the 42 school curriculum and is intended for educational purposes.

---

Enjoy the game! 🏓
ps:not so proud..
