const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod = null;

const connectDB = async () => {
  const customUri = process.env.MONGO_URI;

  // 1. If user provided a remote MongoDB URI (e.g. MongoDB Atlas)
  if (
    customUri &&
    customUri !== 'mongodb://127.0.0.1:27017/todo-app' &&
    customUri !== 'mongodb://localhost:27017/todo-app'
  ) {
    try {
      const conn = await mongoose.connect(customUri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`[MongoDB] Connected successfully to remote MongoDB: ${conn.connection.host}`);
      return;
    } catch (err) {
      console.warn(`[MongoDB] Failed to connect to remote URI: ${err.message}`);
    }
  }

  // 2. Try local MongoDB instance (if installed and running as a service)
  try {
    const conn = await mongoose.connect(
      customUri || 'mongodb://127.0.0.1:27017/todo-app',
      { serverSelectionTimeoutMS: 2000 }
    );
    console.log(`[MongoDB] Connected successfully to local MongoDB: ${conn.connection.host}`);
    return;
  } catch (localErr) {
    console.log('[MongoDB] Local MongoDB service is not running.');
    console.log('[MongoDB] Automatically launching embedded in-memory MongoDB database...');
  }

  // 3. Automatic fallback: In-memory MongoDB (zero configuration required)
  try {
    mongod = await MongoMemoryServer.create();
    const memoryUri = mongod.getUri();
    const conn = await mongoose.connect(memoryUri);
    console.log(`[MongoDB] Connected successfully to In-Memory MongoDB: ${conn.connection.host}`);
    console.log('[MongoDB] App is ready for all operations (Registration, Login, Tasks, Activity)!');
  } catch (memErr) {
    console.error('[MongoDB] Error starting in-memory database:', memErr.message);
  }
};

// Clean shutdown handler
process.on('SIGINT', async () => {
  if (mongod) {
    await mongod.stop();
  }
  process.exit(0);
});

module.exports = connectDB;
