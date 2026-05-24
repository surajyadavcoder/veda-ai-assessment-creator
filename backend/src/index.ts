import express from 'express';
import cors from 'cors';
import http from 'http';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import assignmentRoutes from './routes/assignment';
import { setupWebSocket } from './utils/wsManager';

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

// Setup WebSocket
setupWebSocket(server);

// Routes
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));
app.use('/api/assignments', assignmentRoutes);

// MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/veda-ai')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default server;
