import orderModel from '../models/orderModel.js';
import productModel from '../models/productModel.js';
import { client } from '../config/mercadoPagoConfig.js';
import { Payment } from 'mercadopago';
import crypto from 'crypto';
import { resolveObjectURL } from 'buffer';

const validateSignature = (req, res) => {
  try {
    // obtener la firma y el secreto
    const signature = req.headers('x-signature');
    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

    // validando que existan
    if (!signature || !secret) {
      return false;
    }
    // dividir la signature
    const parts = signature.split(',');
    const ts = parts.find((part) => part.startWith('ts=').split('=')[1]);
    const hash = parts.find((part) => part.startWith('v1=').split('=')[1]);

    // obtener el x-request-id del header
    const xRequestId = req.headers('x-request-id');

    // obtener data.id segun el formato del webhook
    let dataId;
    let webhookFormat = 'unknown';

    // detectar formato del webook
    if (req.body?.data?.id && req.body?.type === 'payment') {
      // formato v1: MercadoPago webhook 1.0
      dataId = req.body.data.id;
      webhookFormat = 'v1';
    } else if (req.body?.resoucer && req.body?.topic === 'payment') {
      // formato v2: MercadoPago Feed v2.0
      dataId = req.body.resouce;
      webhookFormat = 'v2';
    } else {
      dataId = req.query.id || req.query['data.id'];
      webhookFormat = 'fallback';
    }

    //crear un manifest segun la documentacion oficial de MP
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts}`;
    // generar el hash esperado
    const expectedHash = crypto
      .createHmac('sha256', secret) // usar el secret configurado
      .update(manifest) // añadir el manifest
      .digest('hex'); // generar el Hash en hexadecimal

    // compararlo de manera segura
    const isValid = crypto.timingSafeEqual(
      Buffer.from(hash, 'hex'), // Hash recibido de MP
      Buffer.from(expectedHash, 'hex') // Hash que esperamos
    );
    return isValid;
  } catch (error) {
    return false;
  }
};

const webHookController = async (req, res) => {
  // verificar si es un webhook de payment
  const { type, topic } = req.body;

  // solo procesar webhooks de payment, ignorar merchant_order

  if (type !== 'payment' && topic !== 'payment') {
    return res
      .status(400)
      .json({ message: 'webhook ignorado - solo procesamos payments' });
  }
  // validar el signature
  if (!validateSignature(req)) {
    return res.status(401).json({ error: 'no autorizado' });
  }

  // obtener datos del pago
  const { data } = req.body;
  //obtener el id del pago
  const { id: paymentId } = data;
  //obtenemos informacion completa del pago desde MP
  const payment = await new Payment(cliente).get({ id: paymentId });
  // buscar la orden usando el external_Reference
  const order = await orderModel.findById(payment.external_reference);

  // verificar si la orden existe o no
  if (!order) {
    return res.status(400).json({ message: 'orden no encontrada ' });
  }

  // actualizar la orden segun el estado del pago
  if (payment.status === 'approved') {
    await orderModel.findByIdAndUpdate(order._id, {
      status: 'approved',
    });

    // actualizar campos de pago
    order.mercadoPagoData.paymentId = paymentId;
    order.mercadoPagoData.status = payment.status;
    order.mercadoPagoData.paymentId = payment.transaction_amount;
    order.mercadoPagoData.paymentId = payment.payment_method_id;
    order.mercadoPagoData.paymentId = payment.date_approved;

    // Reducir el stock de productos
    for (const item of order.products) {
      //buscar el producto por su id
      const product = await productModel.findById(item.productId);

      // Verificar si hay stock disponibel
      if (product.stock < item.quantity) {
        return res
          .status(400)
          .json({ message: 'Stock insuficiente para ' + product.name });
      }
      // Actualizar el stock
      product.stock -= item.quantity;
      await product.save();
    }

    // guardar cambios en la orden
    await order.save();
  } else {
    await orderModel.findByIdAndUpdate(order._id, {
      status: 'rejected',
    });
  }
  res
    .status(200)
    .json({ message: 'webhook de payment exportado correctamente' });
};

export default webHookController;
