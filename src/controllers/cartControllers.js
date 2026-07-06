import cartModel from '../models/cartModel.js';
import { cartSchema } from '../schemas/cartSchema.js';

// añadir al carrito
export const addToCart = async (req, res) => {
  try {
    console.log(req.body, 'bodyy');
    const { userId, productId, quantity } = cartSchema.parse(req.body);
    const cart = await cartModel.findOne({ userId });
    // Crear carrito si no existe el carrito
    if (!cart) {
      const cart = await cartModel.create({
        userId,
        products: [
          {
            productId,
            quantity,
          },
        ],
      });
      return res.json({ message: 'Carrito creado con exito', cart });
    }

    //verificar si el producto ya esta en el carrito
    let indexProduct;
    const sameProduct = cart.products.some((item, index) => {
      indexProduct = index;
      return item.productId.equals(productId);
    });

    // actualizar cantidad del producto
    if (sameProduct) {
      const newQuantity = quantity + cart.products[indexProduct].quantity;
      cart.products[indexProduct].quantity = newQuantity;
      await cart.save();
      return res
        .status(200)
        .json({ message: 'El producto ya se encuentra en el carrito' });
    }

    // agregar producto
    cart.products.push({ productId, quantity });
    await cart.save();
    return res
      .status(200)
      .json({ message: 'Producto agregado al carrito correctamente' });
  } catch (error) {
    console.log('ocurrio un error', error);

    return res.status(500).json({
      message: 'Error interno del servidor',
    });
  }
};

//traer el carrito
export const getCart = async (req, res) => {
  try {
    const userId = req.params.id;
    const cart = await cartModel
      .findOne({ userId })
      .populate('products.productId');
    return res.status(200).json(cart);
  } catch (error) {
    return res.json({ error: error.message });
  }
};

//actualizar el carrito
export const updateCart = async (req, res) => {
  try {
    const { userId, productId, quantity } = cartSchema.parse({
      userId: req.params.id,
      ...req.body,
    });
    const cart = await cartModel
      .findOne({ userId })
      .populate('products.productId');

    //verificar si el producto esta en el carrito
    const product = cart.products.find((item) =>
      item.productId._id.equals(productId)
    );

    // verificar si hay stock suficiente
    if (!(product.productId.stock > quantity) && product.productId.stock != 0) {
      return res.json('El Stock no es suficiente');
    }

    product.quantity = quantity;
    await cart.save();
    return res.json({
      data: cart.products,
    });
  } catch (error) {
    return res.json({ message: error.message });
  }
};

//eliminar producto del carrito
export const deleteCart = async (req, res) => {
  try {
    const { userId, productId, quantity } = cartSchema.parse({
      userId: req.params.id,
      productId: req.body.productId,
      quantity: 1,
    });
    console.log('eliminar carrito', userId, productId);

    const cart = await cartModel.findOne({ userId });
    //eliminar el producto carrito
    cart.products = cart.products.filter(
      (item) => item.productId.toString() !== productId
    );
    await cart.save();
    return res.json({
      data: cart.products,
    });
  } catch (error) {
    console.log(error.message);
    return res.json({ message: error.message });
  }
};
// limpiar carrito
export const clearCart = async (req, res) => {
  try {
    const userId = req.params.id;
    await cartModel.findOneAndDelete({ userId });

    return res.json({ message: 'Carrito limpiado con exito' });
  } catch (error) {
    console.log(error);
    return res.json({ error: error.message });
  }
};

//total del carrito
export const getCartTotal = async (req, res) => {
  try {
    const userId = req.params.id;
    const cart = await cartModel
      .findOne({ userId })
      .populate('products.productId');

    const totalCart = cart.products.reduce(
      (acc, item) => acc + item.productId.price * item.quantity,
      0
    );
    return res.status(200).json({ total: totalCart });
  } catch (error) {
    console.log('error', error);
    return res.json({ error: error });
  }
};
