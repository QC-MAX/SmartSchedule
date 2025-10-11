const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const sectionRoutes = require('./routes/sectionRoutes');
const electiveRoutes = require('./routes/electiveRoutes');

class SmartScheduleAPI {
    constructor() {
        this.app = express();
        
        // CORRECT PATHS - frontend is in ../frontend from backend folder
        this.projectRoot = path.resolve(__dirname, '..'); // This gives: C:\Users\SV044\Desktop\wish-be-smart\backend
        this.frontendPath = path.join(this.projectRoot, '../frontend'); // This goes: backend -> wish-be-smart -> frontend
        
        console.log(' Project root:', this.projectRoot);
        console.log(' Frontend path:', this.frontendPath);
        console.log(' Login path exists:', require('fs').existsSync(path.join(this.frontendPath, 'pages/login.html')));
        
        this.initializeMiddleware();
        this.initializeRoutes();
        this.initializeErrorHandling();
    }

    initializeMiddleware() {
        // CORS - Allow all origins for development
        this.app.use(cors({
            origin: '*',
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization']
        }));
        
        // Body parsing
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));
        
        //  SERVE FROM CORRECT FRONTEND PATH
        console.log('“ Serving frontend from:', this.frontendPath);
        this.app.use(express.static(this.frontendPath));
        
        // Request logging
        // Add this to app.js for debugging
this.app.use((req, res, next) => {
    console.log(`¨ ${req.method} ${req.path}`, req.body || '');
    next();
});
    }

    initializeRoutes() {
        // âœ… SERVE LOGIN PAGE WITH CORRECT PATH
        this.app.get(['/', '/login'], (req, res) => {
            res.sendFile(path.join(this.frontendPath, 'pages/login.html'));
        });

        // Health check
        this.app.get('/health', (req, res) => {
            res.json({ 
                status: 'OK', 
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            });
        });

        // API routes - ALL prefixed with /api
        this.app.use('/api', authRoutes);
        this.app.use('/api', courseRoutes);
        this.app.use('/api', sectionRoutes);
        this.app.use('/api', electiveRoutes);

       // âœ… SERVE DASHBOARD PAGES WITH CORRECT PATHS
this.app.get('/student-dashboard', (req, res) => {
    const dashboardPath = path.join(this.frontendPath, 'pages/student-dashboard.html');
    console.log('“ Serving student dashboard from:', dashboardPath);
    res.sendFile(dashboardPath);
});

this.app.get('/faculty-dashboard', (req, res) => {
    const dashboardPath = path.join(this.frontendPath, 'pages/faculty-dashboard.html');
    console.log('“ Serving faculty dashboard from:', dashboardPath);
    res.sendFile(dashboardPath);
});

// Add these fallback routes
this.app.get('/faculty-dashboard.html', (req, res) => {
    res.sendFile(path.join(this.frontendPath, 'pages/faculty-dashboard.html'));
});

this.app.get('/student-dashboard.html', (req, res) => {
    res.sendFile(path.join(this.frontendPath, 'pages/student-dashboard.html'));
});


        // 404 handler
        this.app.all('*', (req, res) => {
            res.status(404).json({ 
                error: 'Route not found',
                path: req.path,
                method: req.method
            });
        });
    }

    initializeErrorHandling() {
        // Global error handler
        this.app.use((err, req, res, next) => {
            console.error('âŒ Error:', err);
            res.status(err.statusCode || 500).json({
                error: err.message || 'Internal server error',
                ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
            });
        });
    }

    getApp() {
        return this.app;
    }
}

module.exports = new SmartScheduleAPI().getApp();