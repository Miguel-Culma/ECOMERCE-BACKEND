import mongoose from 'mongoose';
import { required } from 'zod/mini';
const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        name: {
          type: String,
          required: false,
        },
        price: {
          type: Number,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        imageURL: {
          type: String,
          required: false,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled', 'in_process'],
      default: 'pending',
    },
    // informacion especifica de Mercado Pago
    mercadoPagoData: {
      preferenceId: {
        type: String,
        required: false,
      },
      payerEmail: {
        type: String,
        required: false,
      },
      // campos minimos para webhook
      paymentId: {
        type: String,
        required: false,
      },
      paymentStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'cancelled', 'in_process'],
        default: 'pending',
      },
      transactionAmount: {
        type: Number,
        required: false,
      },
      paymentMethodId: {
        type: String,
        required: false,
      },
      paidAt: {
        type: Date,
        required: false,
      },
    },
    // informacion de envio
    shippingInfo: {
      firstName: {
        type: String,
        required: true,
      },
      lastName: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: false,
      },
      phone: {
        type: String,
        required: true,
      },
      address: {
        street: {
          type: String,
          required: true,
        },
        number: {
          type: String,
          required: true,
        },
        city: {
          type: String,
          required: true,
        },
        state: {
          type: String,
          required: true,
        },
        zipCode: {
          type: String,
          required: true,
        },
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model('Order', orderSchema);
