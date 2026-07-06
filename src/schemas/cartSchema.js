import { z } from 'zod';
export const cartSchema = z.object({
  userId: z.string().length(24, 'usuario invalido').optional(),
  productId: z.string().length(24, 'producto invalido'),
  quantity: z.int().min(1, 'Minimo una unidad por producto'),
});
