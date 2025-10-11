const { MongoClient } = require('mongodb');

let db;
let client;

const MONGODB_URI = "mongodb+srv://Roha:1234512345@cluster0.ctncent.mongodb.net/SamrtSchedular?retryWrites=true&w=majority";
const DB_NAME = 'SamrtSchedular';

async function connectDB() {
    try {
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        db = client.db(DB_NAME);
        console.log(' Connected to MongoDB:', DB_NAME);
        return db;
    } catch (error) {
        console.error('â Database connection failed:', error);
        throw error;
    }
}

function getDB() {
    if (!db) {
        throw new Error('Database not initialized. Call connectDB first.');
    }
    return db;
}

async function closeDB() {
    if (client) {
        await client.close();
        console.log('Database connection closed');
    }
}

module.exports = { connectDB, getDB, closeDB };