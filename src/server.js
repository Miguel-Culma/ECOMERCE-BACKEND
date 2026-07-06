import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDB, disconnectDB } from './config/configDB.js';
import authRoutes from './routes/authRoutes.js';
import productsRoutes from './routes/productsRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import webHookRoutes from './routes/webHookRoutes.js';
import cookieParser from 'cookie-parser';

dotenv.config();

const app = express();
app.use(express.json());

// Permite requests solo desde el frontend definido
// Habilita métodos HTTP específicos
// Permite headers usados para JSON y autenticación
// credentials:true permite enviar cookies/sesiones
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS', 'PUT'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'Set-Cookie'],
    credentials: true,
  })
);

// Lee automáticamente las cookies desde req.cookies
app.use(cookieParser());
const PORT = 3001;

// rutas API
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/cart', cartRoutes);
app.use('api/orders', orderRoutes);
app.use('api/webhook', webHookRoutes);
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en puerto: ${PORT}`);
    });
  })
  .catch((error) => {
    disconnectDB();
  });
