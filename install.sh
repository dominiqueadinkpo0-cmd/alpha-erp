#!/bin/bash

# ERP System - Local Installer
# Usage: bash install.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════╗"
    echo "║           ERP SYSTEM - INSTALLER                ║"
    echo "║         Installation Automatique                ║"
    echo "╚══════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_step() {
    echo -e "${YELLOW}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_command() {
    if command -v $1 &> /dev/null; then
        return 0
    else
        return 1
    fi
}

install_nodejs() {
    print_step "Installation de Node.js..."
    
    if check_command node; then
        NODE_VERSION=$(node -v)
        print_success "Node.js déjà installé ($NODE_VERSION)"
    else
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            if check_command apt-get; then
                curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
                sudo apt-get install -y nodejs
            elif check_command yum; then
                curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
                sudo yum install -y nodejs
            fi
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            if check_command brew; then
                brew install node@18
            else
                print_error "Veuillez installer Homebrew: https://brew.sh"
                exit 1
            fi
        fi
        print_success "Node.js installé"
    fi
}

install_postgresql() {
    print_step "Installation de PostgreSQL..."
    
    if check_command psql; then
        print_success "PostgreSQL déjà installé"
    else
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            if check_command apt-get; then
                sudo apt-get install -y postgresql postgresql-contrib
            elif check_command yum; then
                sudo yum install -y postgresql-server postgresql-contrib
                sudo postgresql-setup initdb
            fi
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            if check_command brew; then
                brew install postgresql@15
                brew services start postgresql@15
            fi
        fi
        print_success "PostgreSQL installé"
    fi
    
    sudo systemctl start postgresql 2>/dev/null || true
}

setup_database() {
    print_step "Configuration de la base de données..."
    
    DB_NAME="erp_database"
    DB_USER="erp_user"
    DB_PASS="erp_password_$(date +%s)"
    
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" 2>/dev/null || true
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || true
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null || true
    
    cat > backend/.env << EOF
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASS
JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || head -c 32 /dev/urandom | base64)
JWT_EXPIRES_IN=7d
EOF
    
    print_success "Base de données configurée"
}

install_backend() {
    print_step "Installation du backend..."
    
    cd backend
    npm install
    npm run migrate
    npm run seed
    cd ..
    
    print_success "Backend installé"
}

install_frontend() {
    print_step "Installation du frontend..."
    
    cd frontend
    npm install
    cd ..
    
    print_success "Frontend installé"
}

create_launcher() {
    print_step "Création du lanceur..."
    
    cat > start.sh << 'EOF'
#!/bin/bash

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Démarrage du système ERP...${NC}"

cd "$(dirname "$0")"

echo -e "${GREEN}Démarrage du backend (port 5000)...${NC}"
cd backend
npm start &
BACKEND_PID=$!
cd ..

sleep 3

echo -e "${GREEN}Démarrage du frontend (port 3000)...${NC}"
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Système ERP démarré avec succès!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""
echo -e "  Frontend:  ${GREEN}http://localhost:3000${NC}"
echo -e "  Backend:   ${GREEN}http://localhost:5000${NC}"
echo ""
echo -e "  Login:     ${GREEN}admin@erp.com${NC}"
echo -e "  Mot de passe: ${GREEN}admin123${NC}"
echo ""
echo -e "${BLUE}Appuyez sur Ctrl+C pour arrêter${NC}"
echo ""

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM
wait
EOF
    
    chmod +x start.sh
    
    cat > stop.sh << 'EOF'
#!/bin/bash
echo "Arrêt du système ERP..."
pkill -f "node src/server.js" 2>/dev/null || true
pkill -f "react-scripts start" 2>/dev/null || true
echo "Système arrêté."
EOF
    
    chmod +x stop.sh
    
    print_success "Lanceurs créés"
}

create_desktop_shortcut() {
    print_step "Création du raccourci bureau..."
    
    if [[ "$OSTYPE" == "linux-gnu"* ]] && [ -d "$HOME/Desktop" ]; then
        cat > ~/Desktop/ERP-System.desktop << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=ERP System
Comment=Système de Gestion ERP
Exec=bash $(pwd)/start.sh
Icon=system-software-update
Terminal=true
Categories=Office;Business;
EOF
        chmod +x ~/Desktop/ERP-System.desktop
        print_success "Raccourci créé sur le bureau"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        print_success "Sur Mac, utilisez le script start.sh"
    fi
}

create_windows_batch() {
    print_step "Création des scripts Windows..."
    
    cat > start.bat << 'EOF'
@echo off
echo Demarrage du systeme ERP...
cd /d "%~dp0"
start "ERP Backend" cmd /c "cd backend && npm start"
timeout /t 3 /nobreak > nul
start "ERP Frontend" cmd /c "cd frontend && npm start"
echo.
echo ========================================
echo   Systeme ERP demarre!
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:5000
echo   Login: admin@erp.com
echo   Mot de passe: admin123
echo ========================================
pause
EOF
    
    cat > install.bat << 'EOF'
@echo off
echo Installation du systeme ERP...
cd /d "%~dp0"

echo [1/4] Installation du backend...
cd backend
call npm install
call npm run migrate
call npm run seed
cd ..

echo [2/4] Installation du frontend...
cd frontend
call npm install
cd ..

echo.
echo Installation terminee!
echo Utilisez start.bat pour lancer le systeme.
pause
EOF
    
    print_success "Scripts Windows créés"
}

print_final_instructions() {
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║         INSTALLATION TERMINÉE!                  ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}Pour démarrer le système:${NC}"
    echo -e "  Linux/Mac:   ${GREEN}./start.sh${NC}"
    echo -e "  Windows:     ${GREEN}start.bat${NC}"
    echo ""
    echo -e "${BLUE}Accès:${NC}"
    echo -e "  Frontend:  ${GREEN}http://localhost:3000${NC}"
    echo -e "  Backend:   ${GREEN}http://localhost:5000${NC}"
    echo ""
    echo -e "${BLUE}Identifiants par défaut:${NC}"
    echo -e "  Email:       ${GREEN}admin@erp.com${NC}"
    echo -e "  Mot de passe: ${GREEN}admin123${NC}"
    echo ""
    echo -e "${BLUE}Pour arrêter:${NC}"
    echo -e "  Linux/Mac:   ${GREEN}./stop.sh${NC}"
    echo -e "  Windows:     ${GREEN}taskkill /F /IM node.exe${NC}"
    echo ""
}

print_header

install_nodejs
install_postgresql
setup_database
install_backend
install_frontend
create_launcher
create_desktop_shortcut
create_windows_batch

print_final_instructions
