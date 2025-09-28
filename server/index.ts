import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  const mockProjects = [
    {
      id: 'proj-1',
      title: 'Documentaire sur l\'IA',
      description: 'Un documentaire innovant explorant l\'impact de l\'intelligence artificielle sur notre société.',
      category: 'documentaire',
      targetAmount: '5000.00',
      currentAmount: '1250.00',
      status: 'active',
      creatorId: 'creator-1',
      mlScore: '7.5',
      investorCount: 25,
      votesCount: 150,
      thumbnailUrl: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=800',
      creator: {
        id: 'creator-1',
        firstName: 'Marie',
        lastName: 'Dubois',
        profileImageUrl: null
      },
      createdAt: new Date().toISOString()
    },
    {
      id: 'proj-2',
      title: 'Court-métrage Animation',
      description: 'Une histoire touchante en animation 3D sur l\'amitié et le courage.',
      category: 'animation',
      targetAmount: '8000.00',
      currentAmount: '3200.00',
      status: 'active',
      creatorId: 'creator-2',
      mlScore: '8.2',
      investorCount: 42,
      votesCount: 280,
      thumbnailUrl: 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=800',
      creator: {
        id: 'creator-2',
        firstName: 'Thomas',
        lastName: 'Martin',
        profileImageUrl: null
      },
      createdAt: new Date().toISOString()
    }
  ];

  res.json({
    success: true,
    data: mockProjects,
    pagination: {
      page: 1,
      limit: 20,
      total: mockProjects.length,
      totalPages: 1
    }
  });
});

// Mock investments route
app.get('/api/investments', (req: Request, res: Response) => {
  const mockInvestments = [
    {
      id: 'inv-1',
      userId: '1',
      projectId: 'proj-1',
      amount: '50.00',
      currentValue: '52.50',
      roi: '0.05',
      votesGiven: 4,
      createdAt: new Date().toISOString(),
      project: {
        id: 'proj-1',
        title: 'Documentaire sur l\'IA',
        category: 'documentaire',
        status: 'active',
        thumbnailUrl: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=800'
      }
    }
  ];

  res.json({
    success: true,
    data: mockInvestments,
    pagination: {
      page: 1,
      limit: 20,
      total: mockInvestments.length,
      totalPages: 1
    }
  });
});

// Mock notifications route
app.get('/api/notifications', (req: Request, res: Response) => {
  const mockNotifications = [
    {
      id: 'notif-1',
      title: 'Nouveau projet disponible',
      message: 'Un nouveau documentaire vient d\'être publié et recherche des investisseurs.',
      type: 'new_project',
      isRead: false,
      createdAt: new Date().toISOString(),
      project: null
    }
  ];

  res.json({
    success: true,
    data: mockNotifications,
    pagination: {
      page: 1,
      limit: 20,
      total: mockNotifications.length,
      totalPages: 1
    }
  });
});

app.get('/api/books', (req: Request, res: Response) => {
  const mockBooks = [
    {
      id: '1',
      title: 'Guide du Réalisateur Indépendant',
      description: 'Un guide complet pour créer des films avec un budget limité.',
      author: { id: '1', firstName: 'Marie', lastName: 'Dubois' },
      price: 5,
      status: 'active',
      totalSales: 1250.00,
      votesCount: 89,
      monthlyRank: 3,
      createdAt: new Date().toISOString()
    }
  ];

  res.json({
    success: true,
    data: mockBooks,
    pagination: {
      page: 1,
      limit: 20,
      total: mockBooks.length,
      totalPages: 1
    }
  });
});

// Mock ads route for Petites Annonces
app.get('/api/ads', (req: Request, res: Response) => {
  const mockAds = [
    {
      id: '1',
      title: 'Recherche Cadreur Expérimenté',
      description: 'Nous recherchons un cadreur expérimenté pour un documentaire.',
      category: 'job',
      author: { id: '1', firstName: 'Marie', lastName: 'Dubois' },
      location: 'Paris, France',
      price: 2500,
      status: 'active',
      viewsCount: 45,
      createdAt: new Date().toISOString()
    }
  ];

  res.json({
    success: true,
    data: mockAds,
    pagination: {
      page: 1,
      limit: 20,
      total: mockAds.length,
      totalPages: 1
    }
  });
});

// Mock curiosity stats for dock
app.get('/api/curiosity-stats', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      liveViewers: Math.floor(Math.random() * 100) + 20,
      liveShows: Math.floor(Math.random() * 8) + 2,
      newCount: Math.floor(Math.random() * 15) + 5,
      topActive: Math.random() > 0.2
    }
  });
});

// Mock category toggles
app.get('/api/category-toggles', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      films: { visible: true, message: "" },
      videos: { visible: true, message: "" },
      documentaires: { visible: true, message: "" },
      voix_info: { visible: false, message: "Catégorie en travaux" },
      live_show: { visible: true, message: "" },
      livres: { visible: true, message: "" },
      petites_annonces: { visible: true, message: "" }
    }
  });
});

// Mock logout route
app.post('/api/logout', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Serve client files in production
if (process.env.NODE_ENV === 'production') {
  const clientDistPath = path.join(__dirname, '../dist/public');
  app.use(express.static(clientDistPath));
  
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API route not found' });
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
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