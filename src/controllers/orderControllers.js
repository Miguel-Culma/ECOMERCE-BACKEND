import { Preference } from 'mercadopago'; //genera la orden de pago
import { client } from '../config/mercadoPagoConfig.js'; // autenticacion con Mercado Pago
import orderModel from '../models/orderModel.js';

// instancia de preferncia
const preferences = new Preference(client);

export const createOrder = async (req, res) => {
  try {
    const { items, payer, shippingInfo } = req.body; // informacion de la orden

    // validaciones antes de crear la orden
    if (!items || !items.length) {
      return res.status(400).json({
        success: false,
        message: 'Se requieren items para crear la orden',
      });
    }

    if (!payer || !payer.email) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere email del comprador',
      });
    }

    // crear la orden en la base de datos
    const newOrder = new orderModel({
      products: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.unit_price,
      })),
      totalAmount: items.reduce(
        (total, item) => total + item.unit_price * item.quantity,
        0
      ),
      status: 'pending',
      shippingInfo: shippingInfo,
      mercadoPagoData: {
        payerEmail: payer.email,
      },
    });

    const savedOrder = await newOrder.save();

    // crear prefencia en mercado pago con external preference

    // crea el checkout oficial.
    const result = await preferences.create({
      body: {
        // datos del pago
        items: items,
        payer: {
          email: payer.email,
        },
        external_reference: savedOrder._id.toString(), // guarda a que orden pertence el pago
        back_urls: {
          success: `${process.env.FRONTEND_URL}/payment/success`,
          failure: `${process.env.FRONTEND_URL}/payment/success`, // URLs que redirigen al usuario después del pago
          pending: `${process.env.FRONTEND_URL}/payment/success`,
        },
        notification_url: `${process.env.BACKEND_URL || 'http://localhost:3001/api/webhook'}`,
      },
      metadata: {
        order_id: savedOrder._id.toString(), // Guarda el ID del checkout
      },
    });

    console.log('Resultado de la preferencia creada', result);
    // Obtener el identificador de la preferencia

    savedOrder.mercadoPagoData.preferenceId = result.id;
    await savedOrder.save();
    return res.status(201).json({
      success: true,
      message: 'orden creada exitosamente',
      paymentUrl: result.init_point,
      preferenceId: result.id,
    });
  } catch (error) {
    console.log('Error al crear la orden', error);
    return res.status(500).json({
      success: false,
      message: 'Error al crear la orden',
      error: error.message,
    });
  }
};
