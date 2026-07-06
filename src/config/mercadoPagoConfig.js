import dotenv from 'dotenv';
// SDK de Mercado Pago
import { MercadoPagoConfig, Preference } from 'mercadopago';
dotenv.config();


// Agrega credenciales
export const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
