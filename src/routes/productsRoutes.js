import express from 'express';
import {
  createProduct,
  updateProducts,
  getProductsById,
  getProducts,
  deleteProductsById,
} from '../controllers/productsControllers.js';
const router = express.Router();

// Rutas publicas
router.get('/', getProducts);
router.get('/:id', getProductsById);

// Rutas privadas - Admin modifica productos

router.post('/', createProduct); // crear produto

router.put('/:id', updateProducts); // actualizar producto

router.delete('/:id', deleteProductsById); // borrar producto

export default router;
