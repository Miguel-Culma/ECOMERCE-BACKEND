import productModel from '../models/productModel.js';
import { productSchema } from '../schemas/productoSchema.js';
import { ZodError } from 'zod';
// crear producto
export const createProduct = async (req, res) => {
  try {
    console.log('entre a crear producto', req.body);
    const { name, description, price, stock, imageURL } = productSchema.parse(
      req.body
    );
    const product = await productModel.create({
      name,
      description,
      price,
      stock,
      imageURL,
    });
    return res
      .status(201)
      .json({ message: 'Producto creado correctamente', product });
  } catch (error) {
    console.log(error.message);
    if (error instanceof ZodError) {
      return res.status(400).json(
        error.issues.map((issue) => ({
          message: issue.message,
        }))
      );
    }

    return res
      .status(500)
      .json({ message: 'Error al crear el producto', error: error });
  }
};

export const updateProducts = async (req, res) => {
  console.log('entre a actualizarProducto', req.body, req.params.id);
  try {
    // validr los datos con zod
    const validateData = productSchema.partial().parse(req.body);

    // buscar y actualizar los productos
    const updateProduct = await productModel.findByIdAndUpdate(
      req.params.id,
      validateData,
      {
        new: true, // devuelve el documento actualizado
        runValidators: true, // ejecuta validaciones del schema
      }
    );

    // Producto no existe
    if (!updateProduct) {
      return res.status(400).json({ message: 'Producto no encontrado' });
    }

    // producto exuste
    return res.json(updateProduct);
  } catch (error) {
    console.log(error);
    res.json({ error: 'error al actualizar el producto' });
  }
};

export const getProductsById = async (req, res) => {
  try {
    console.log(req.params.id);
    const product = await productModel.findById(req.params.id);
    console.log(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Producto no encotrado' });
    }
    return res.status(200).json(product);
  } catch (error) {
    return res
      .status(500)
      .json({ error: 'Ocurrio un error al buscar el producto' });
  }
};

export const getProducts = async (req, res) => {
  try {
    const products = await productModel.find();
    return res.status(200).json(products);
  } catch (error) {
    return res
      .status(500)
      .json({ error: 'Ocurrio un error al buscar los productos' });
  }
};

export const deleteProductsById = async (req, res) => {
  try {
    const product = await productModel.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: 'producto eliminado' });
  } catch (error) {
    return res
      .status(500)
      .json({ error: 'Ocurrio un error al eliminar el producto' });
  }
};
