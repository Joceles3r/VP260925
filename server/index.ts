import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";

const app = express();

// CORS configuration
app.use(cors({
  origin: true,
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Basic API routes
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
    success: true, 
    message: 'VISUAL API is healthy',
    timestamp: new Date().toISOString()
  });
});

// Mock auth route
app.get('/api/auth/me', (req: Request, res: Response) => {
  res.json({ 
    success: true, 
    data: {
      id: '1',
      email: 'demo@visual.com',
      firstName: 'Demo',
      lastName: 'User',
      profileType: 'investor',
      balanceEUR: '10000.00',
      totalInvested: '0.00',
      totalGains: '0.00',
      simulationMode: true,
      kycVerified: false,
      isAdmin: false,
      isCreator: false
    }
  });
});

// Mock projects route  
app.get('/api/projects', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: [],
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0
    }
  });
});

// Serve client files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(process.cwd(), 'client/dist')));
  
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API route not found' });
    }
    res.sendFile(path.join(process.cwd(), 'client/dist/index.html'));
  });
}

// Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Server Error:', err);
  res.status(500).json({ 
    success: false,
    error: 'Internal Server Error'
  });
});

// Start server
const port = parseInt(process.env.PORT || '5000', 10);
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 VISUAL Platform server running on port ${port}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});