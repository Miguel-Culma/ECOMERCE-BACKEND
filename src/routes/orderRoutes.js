import express from 'express';
import { createOrder } from '../controllers/orderControllers.js';
const router = express.Router();

//crear nueva orden de compra y generar preferencia de MP
router.post('create', createOrder);

export default router;
