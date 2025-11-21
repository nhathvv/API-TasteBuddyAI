import { MongooseModuleOptions } from '@nestjs/mongoose';
import * as dotenv from 'dotenv';
dotenv.config();
const connectUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/test';
const connectOptions: MongooseModuleOptions = {
  auth: { username: process.env.MONGODB_USERNAME || 'root', password: process.env.MONGODB_PASSWORD || 'root' },
  authSource: 'admin',
  connectionFactory: (connection) => {
    connection.plugin(require('mongoose-autopopulate'));
    return connection;
  },
  retryWrites: false,
  retryReads: true,
  readConcern: { level: 'majority' },
  maxPoolSize: 50,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

export { connectUrl, connectOptions };
