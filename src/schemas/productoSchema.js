import { z } from 'zod';

export const productSchema = z.object({
  name: z
    .string()
    .min(3, 'Minimo 3 caracteres en el nombre del producto')
    .max(50, 'Maximo 50 caracteres en el nombre del producto'),
  description: z
    .string()
    .min(10, 'Minimo 10 caracteres en la descripcion del producto')
    .max(500, 'Maximo 50 caracteres en la descripcion del producto'),
  price: z.number().min(0, 'El precio minimo es 0'),
  stock: z.number().min(0, 'El stock minimo es 0').int(),
  imageURL: z.url('Url invalida'),
});
