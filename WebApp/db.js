const { MongoClient } = require('mongodb');

// Connection URI
const uri = 'mongodb+srv://adolfarchibald:adolfarchibald@cluster.tmuxi4l.mongodb.net/';
const dbName = 'IP_ML';

// Singleton client to reuse connection
let client;

async function connectToDatabase() {

    // Return cached connection if already connected
    if (client && client.topology && client.topology.isConnected()) {
        return client.db(dbName); 
    }

    // Try to connect and return the db after successful connection
    try {
        client = new MongoClient(uri);
        await client.connect();
        console.log('Connected to MongoDB!');
        return client.db(dbName);
    }
    catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        throw error;
    }
}

// Export the function to get the database instance
module.exports = { connectToDatabase };