const { connectDB, closeDB } = require('./src/db/connect');
const app = require('./src/app');

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        console.log('🔄 Starting SmartSchedule Server...');
        
        // Connect to MongoDB first
        await connectDB();
        console.log('✅ Database connected');
        
        // Start Express server
        app.listen(PORT, () => {
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`📊 API available at: http://localhost:${PORT}/api/`);
            console.log(`🏥 Health check: http://localhost:${PORT}/health`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        });

        // Graceful shutdown
        process.on('SIGINT', async () => {
            console.log('\n🛑 Shutting down gracefully...');
            await closeDB();
            process.exit(0);
        });
        
        process.on('SIGTERM', async () => {
            console.log('\n🛑 SIGTERM received, shutting down...');
            await closeDB();
            process.exit(0);
        });
        
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer();