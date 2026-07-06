import { z } from 'zod';

export const registerSchema = z.object({
  userName: z
    .string()
    .min(3, 'Minimo 3 caracteres')
    .max(20, 'Maximo 20 caracteres'),

  userEmail: z.email('Correo invalido').min(6).max(254),

  userPass: z
    .string()
    .min(6, 'Minimo 6 caracteres')
    .max(254, 'Maximo 256 caracteres'),
});

export const loginSchema = z.object({
  userEmail: z.email('Correo invalido').min(6).max(254),
  userPass: z
    .string()
    .min(6, 'Minimo 6 caracteres')
    .max(254, 'Maximo 256 caracteres'),
});
