#!/bin/bash
set -e

echo "🚀 VISUAL Platform - Production Deployment"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Step 1: Prepare environment
log_info "🔧 Preparing production environment..."

# Create production directories
mkdir -p /app/logs /app/uploads /app/dist

# Step 2: Install dependencies
log_info "📦 Installing dependencies..."

# Backend dependencies
if [ -f "backend/requirements.txt" ]; then
    pip install -r backend/requirements.txt
    log_info "✅ Backend dependencies installed"
fi

# Frontend dependencies (if needed)
if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
    cd frontend
    if command -v yarn &> /dev/null; then
        yarn install --production
    else
        npm install --production
    fi
    cd ..
    log_info "✅ Frontend dependencies installed"
fi

# Step 3: Configure environment
log_info "⚙️ Configuring production environment..."

# Create production env if not exists
if [ ! -f ".env.production" ]; then
    cat > .env.production << 'EOF'
NODE_ENV=production
PORT=8001
DATABASE_URL=postgresql://postgres:password@localhost:5432/visual_db
SESSION_SECRET=change-this-in-production-please-use-secure-random-key
ALLOWED_ORIGINS=*
LOG_LEVEL=info
EOF
    log_warn "Created .env.production - Please update with secure values!"
fi

# Step 4: Test backend
log_info "🧪 Testing backend API..."
cd backend
python -c "
import uvicorn
import server
print('✅ Backend imports successful')
" || {
    log_error "Backend test failed"
    exit 1
}
cd ..

# Step 5: Start production server
log_info "🚀 Starting production server..."

# Kill existing processes
pkill -f "uvicorn.*server:app" || true
pkill -f "python.*server.py" || true

# Start backend in background
cd backend
nohup python -m uvicorn server:app \
    --host 0.0.0.0 \
    --port 8001 \
    --workers 1 \
    --log-level info \
    --access-log \
    > /app/logs/backend.log 2>&1 &

BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Test backend health
if curl -f http://localhost:8001/api/health > /dev/null 2>&1; then
    log_info "✅ Backend started successfully (PID: $BACKEND_PID)"
else
    log_error "❌ Backend health check failed"
    cat /app/logs/backend.log
    exit 1
fi

# Step 6: Setup reverse proxy (simple)
log_info "🌐 Setting up web server..."

# Create simple HTML for frontend (fallback)
cat > /app/dist/index.html << 'EOF'
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VISUAL Platform</title>
    <style>
        body { font-family: 'Inter', system-ui; margin: 0; padding: 2rem; 
               background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
               color: white; min-height: 100vh; display: flex; 
               align-items: center; justify-content: center; }
        .container { text-align: center; max-width: 600px; }
        .logo { font-size: 3rem; font-weight: bold; margin-bottom: 1rem; }
        .subtitle { font-size: 1.2rem; opacity: 0.9; margin-bottom: 2rem; }
        .button { display: inline-block; padding: 0.8rem 2rem; 
                  background: rgba(255,255,255,0.2); border-radius: 0.5rem;
                  color: white; text-decoration: none; margin: 0.5rem;
                  transition: all 0.3s ease; }
        .button:hover { background: rgba(255,255,255,0.3); transform: translateY(-2px); }
        .status { margin-top: 2rem; padding: 1rem; 
                  background: rgba(255,255,255,0.1); border-radius: 0.5rem; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🎬 VISUAL</div>
        <div class="subtitle">Plateforme d'Investissement de Contenus Visuels</div>
        
        <p>Mix révolutionnaire entre streaming et crowdfunding</p>
        
        <a href="/api/health" class="button">🔍 API Status</a>
        <a href="/api/docs" class="button">📚 API Docs</a>
        
        <div class="status">
            <h3>🚀 Application Deployed Successfully!</h3>
            <p><strong>Backend API:</strong> <span id="api-status">Checking...</span></p>
            <p><strong>Version:</strong> 1.0.0</p>
            <p><strong>Environment:</strong> Production</p>
        </div>
    </div>
    
    <script>
        // Check API health
        fetch('/api/health')
            .then(res => res.json())
            .then(data => {
                document.getElementById('api-status').innerHTML = 
                    data.success ? '✅ Running' : '❌ Error';
            })
            .catch(() => {
                document.getElementById('api-status').innerHTML = '❌ Unreachable';
            });
    </script>
</body>
</html>
EOF

# Step 7: Final health check
log_info "🏥 Performing final health checks..."

# Test API endpoints
for endpoint in "health" "auth/me" "projects"; do
    if curl -f "http://localhost:8001/api/$endpoint" > /dev/null 2>&1; then
        log_info "✅ /api/$endpoint - OK"
    else
        log_warn "⚠️ /api/$endpoint - May have issues"
    fi
done

# Step 8: Display results
echo ""
log_info "🎉 VISUAL Platform deployed successfully!"
echo ""
echo "📊 Deployment Summary:"
echo "├── Backend API: http://localhost:8001"
echo "├── Health Check: http://localhost:8001/api/health"
echo "├── API Docs: http://localhost:8001/api/docs"
echo "├── Logs: /app/logs/"
echo "└── PID: $BACKEND_PID"
echo ""
echo "🔗 Quick Tests:"
echo "curl http://localhost:8001/api/health"
echo "curl http://localhost:8001/api/projects"
echo ""
log_info "Use 'ps aux | grep uvicorn' to check process status"
log_info "Use 'tail -f /app/logs/backend.log' to see live logs"
echo ""
log_info "✨ VISUAL Platform is ready for production!"