import express from 'express';

import {
  addToCart,
  getCart,
  updateCart,
  deleteCart,
  clearCart,
  getCartTotal,
} from '../controllers/cartControllers.js';

const router = express.Router();

router.post('/add', addToCart); // añadir al carrito
router.get('/get/:id', getCart); // traer el carrito
router.put('/update/:id', updateCart); // actualizar carrito
router.delete('/removeProduct/:id', deleteCart); // borrar producto
router.delete('/clear/:id', clearCart); // limpiar carrito
router.get('/total/:id', getCartTotal); // total del carrito

export default router;
