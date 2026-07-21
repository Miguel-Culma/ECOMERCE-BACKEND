import crypto from 'crypto';
import { Payment } from 'mercadopago';
import { client } from '../config/mercadoPagoConfig.js';
import orderModel from '../models/orderModel.js';
import productModel from '../models/productModel.js';

const validateSignature = (req) => {
  try {
    const signature = req.headers['x-signature'];
    const requestId = req.headers['x-request-id'];
    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

    if (!signature || !requestId || !secret) {
      return false;
    }

    const parts = signature.split(',');

    const ts = parts.find((p) => p.startsWith('ts='))?.split('=')[1];
    const hash = parts.find((p) => p.startsWith('v1='))?.split('=')[1];

    if (!ts || !hash) {
      return false;
    }

    // Mercado Pago recomienda usar el query para validar la firma
    const dataId = req.query['data.id'] || req.query.id;

    if (!dataId) {
      return false;
    }

    const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;

    const expectedHash = crypto
      .createHmac('sha256', secret)
      .update(manifest)
      .digest('hex');

    //console.log('Manifest:', manifest);
    //console.log('Hash recibido:', hash);
    //console.log('Hash esperado:', expectedHash);

    return crypto.timingSafeEqual(
      Buffer.from(hash, 'hex'),
      Buffer.from(expectedHash, 'hex')
    );
  } catch (error) {
    console.error(error);
    return false;
  }
};

const pendingStatus = ['authorized', 'in_process', 'pending', 'in_mediation'];

const webHookController = async (req, res) => {
  try {
    //console.log('type:', req.body.type);
    const { type } = req.body;
    // validar el tipo de peticion
    if (type !== 'payment') {
      console.log('solo pagos --- ');
      return res.sendStatus(200);
    }
    // Validar firma
    if (!validateSignature(req)) {
      console.log('Firma inválida');
      return res.sendStatus(401);
    }

    // Obtener paymentId
    const paymentId =
      req.body?.data?.id ||
      req.body?.resource ||
      req.query['data.id'] ||
      req.query.id;

    if (!paymentId) {
      return res.status(400).json({
        message: 'No se recibió paymentId',
      });
    }

    console.log('PaymentId:', paymentId);

    // Consultar el pago
    const payment = await new Payment(client).get({
      id: paymentId,
    });
    // ver tambien la descripcion del pago
    console.log('Estado del pago:', payment.status);

    // Buscar la orden
    const order = await orderModel.findById(payment.external_reference);

    if (!order) {
      return res.status(404).json({
        message: 'Orden no encontrada',
      });
    }

    // Guardar información del pago
    order.mercadoPagoData.paymentId = payment.id;
    order.mercadoPagoData.paymentStatus = payment.status;
    order.mercadoPagoData.transactionAmount = payment.transaction_amount;
    order.mercadoPagoData.paymentMethodId = payment.payment_method_id;
    order.mercadoPagoData.paidAt = payment.date_approved;

    if (payment.status === 'approved') {
      order.status = 'approved';

      for (const item of order.products) {
        const product = await productModel.findById(item.productId);

        if (!product) continue;

        if (product.stock < item.quantity) {
          return res.status(400).json({
            message: `Stock insuficiente para ${product.name}`,
          });
        }

        product.stock -= item.quantity;

        await product.save();
      }
    } else if (pendingStatus.includes(payment.status)) {
      order.status = 'pending';
    } else {
      order.status = 'rejected';
    }

    await order.save();

    return res.sendStatus(200);
  } catch (error) {
    console.error(error);

    return res.sendStatus(500);
  }
};

export default webHookController;
