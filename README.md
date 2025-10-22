# SkillSwap Platform

A full-stack platform for students to exchange skills.

## Tech Stack
- Backend: Spring Boot 3.3 + Java 21
- Frontend: React 18 + TypeScript + Vite
- Database: PostgreSQL 16
- Styling: Tailwind CSS

## Getting Started (brand-new laptop)

Follow the steps for your operating system to install Docker, then run the stack.

### Windows 10/11 (WSL2 + Docker Desktop)
1. Open PowerShell as Administrator and enable WSL2:
   ```powershell
   wsl --install
   ```
   Reboot if prompted. This installs the WSL kernel and a default Ubuntu distro.
2. Install Docker Desktop for Windows:
   - Download: https://www.docker.com/products/docker-desktop/
   - During setup, ensure "Use WSL 2 based engine" is enabled.
3. Start Docker Desktop and ensure:
   - Containers are set to Linux mode.
   - Settings → Resources → WSL integration has your distro enabled.
4. Optional (corporate networks): Settings → Docker Engine → add a registry mirror and click Apply & Restart:
   ```json
   {
     "registry-mirrors": ["https://mirror.gcr.io"]
   }
   ```

### macOS (Intel or Apple Silicon)
1. Install Docker Desktop for Mac: https://www.docker.com/products/docker-desktop/
2. Start Docker Desktop and wait until it reports "Docker engine is running".

### Ubuntu/Debian Linux
1. Install Docker Engine and Compose plugin:
   ```bash
   sudo apt-get update
   sudo apt-get install -y ca-certificates curl gnupg
   sudo install -m 0755 -d /etc/apt/keyrings
   curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
   echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
   sudo apt-get update
   sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
   sudo usermod -aG docker $USER
   newgrp docker
   ```
   Log out/in if needed so your user can run `docker` without sudo.

## Clone and run
1. Clone the repository:
   ```bash
   git clone <REPO_URL> windsurf-project
   cd windsurf-project
   ```
2. Build and start all services:
   ```bash
   docker compose up -d --build
   ```
3. Open the apps:
   - Frontend: http://localhost:5173
   - Backend: http://localhost:8080

## Services and ports
- Postgres: `5432` (db: `skillswap`, user: `postgres`, password: `postgres`)
- Backend (Spring Boot): `8080`
- Frontend (Nginx serving Vite build): `5173`

## Development without Docker (optional)
You can run only the database with Docker and run apps locally.

### Start only Postgres
```bash
docker compose up -d postgres
```

### Backend (Java 21 + Maven)
From `backend/`:
```bash
mvn spring-boot:run -Dspring-boot.run.jvmArguments="--enable-preview" \
  -Dspring-boot.run.environment= \
  -Dspring-boot.run.profiles= 
```
Environment (set via shell or IDE):
- `SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/skillswap`
- `SPRING_DATASOURCE_USERNAME=postgres`
- `SPRING_DATASOURCE_PASSWORD=postgres`

### Frontend (Node 20)
From `frontend/`:
```bash
npm install
npm run dev
```
Open http://localhost:5173

## Useful commands
- Check container status:
  ```bash
  docker compose ps
  ```
- Tail logs:
  ```bash
  docker compose logs -f backend
  docker compose logs -f frontend
  ```
- Stop stack:
  ```bash
  docker compose down
  ```
- Reset DB (removes data volume):
  ```bash
  docker compose down -v
  ```

## Troubleshooting
- Docker not running / wrong context (Windows): open Docker Desktop; ensure context is `desktop-linux`.
- Image pulls timeout (corporate network): configure proxy in Docker Desktop (Settings → Resources → Proxies) and/or add registry mirror under Docker Engine (see above), then restart Docker.
- Port is already in use: change the host port mapping in `docker-compose.yml` under `ports:`.
- Compose warning: `version` key is deprecated; safe to ignore. Optionally remove the `version: '3.8'` line.
