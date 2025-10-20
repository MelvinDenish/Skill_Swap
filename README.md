# SkillSwap Platform

A full-stack platform for students to exchange skills.

## Tech Stack
- Backend: Spring Boot 3.3 + Java 21
- Frontend: React 18 + TypeScript + Vite
- Database: PostgreSQL 16
- Styling: Tailwind CSS

## Setup

1. Install PostgreSQL and create database:
```sql
CREATE DATABASE skillswap;
```

### Run backend
```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.jvmArguments="--enable-preview"
```

### Run frontend
```bash
cd frontend
npm install
npm run dev
```

### Or use Docker
```bash
docker-compose up --build
```

Access frontend at: http://localhost:5173
"# Skill_Swap" 
