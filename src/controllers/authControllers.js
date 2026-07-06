import { registerSchema, loginSchema } from '../schemas/authSchema.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';
import mongoose from 'mongoose';
import { ZodError } from 'zod';

export const registerUser = async (req, res) => {
  try {
    // clave secreta de JWT
    const JWT_SECRET = process.env.JWT_SECRET;

    const { userName, userEmail, userPass } = registerSchema.parse(req.body);

    // comprobar si el usuario existe
    const existUser = await userModel.findOne({ userEmail });
    if (existUser) {
      return res.status(200).json({ message: 'El usuario ya existe' });
    }

    //encriptar contraseña
    const hashedPassword = await bcrypt.hash(userPass, 10);

    // comprobar admin
    const isFirstUser = (await userModel.countDocuments()) === 0;

    // crear usuario
    const newUser = await userModel.create({
      email: userEmail,
      name: userName,
      password: hashedPassword,
      isAdmin: isFirstUser,
    });

    //generar un JWT
    const token = jwt.sign({ userid: newUser._id }, JWT_SECRET, {
      expiresIn: '1h',
    });

    // Enviar el JWT al navegador dentro de una cookie
    res
      .cookie(
        'accessToken', // Nombre de la cookie
        token, // Valor de la cookie (el JWT generado)
        {
          // Impide que JavaScript del frontend acceda a la cookie - Protege contra ataques XSS
          httpOnly: true,

          // La cookie solo se enviará por HTTPS en producción
          secure: process.env.NODE_ENV === 'production',

          // Controla cuándo el navegador envía la cookie
          // 'none' permite peticiones entre dominios distintos
          // 'lax' es más flexible para desarrollo local
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',

          // Tiempo de vida de la cookie en milisegundos
          maxAge: 60 * 60 * 1000,
        }
      )
      .status(201)
      .json({
        message: 'usuario registrado con éxito',
      });
  } catch (error) {
    res.status(400).json({ error: error });
  }
};

export const loginUser = async (req, res) => {
  try {
    //obtener la clave secreta del entorno
    const JWT_SECRET = process.env.JWT_SECRET;

    //obtener usuario y contraseña
    const { userEmail, userPass } = loginSchema.parse(req.body);
    // console.log(userEmail, userPass);

    // buscar al usuario en la bd por email
    const user = await userModel.findOne({ email: userEmail });
    // comparar contraseñas
    const isPassValid = await bcrypt.compare(userPass, user.password); // true o false

    if (!user) {
      return res.status(400).json({ message: 'Credenciales invalidas' });
    }
    if (!isPassValid) {
      return res.status(400).json({ message: 'Credenciales invalidas' });
    }
    //generar un JWT
    const token = jwt.sign(
      { userid: user._id, userName: user.name },
      JWT_SECRET,
      {
        expiresIn: '1h',
      }
    );

    const userData = {
      id: user._id,
      userName: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    };

    res
      .cookie('accessToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 60 * 60 * 100,
      })
      .status(200)
      .json(userData);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json(
        error.issues.map((issue) => ({
          message: issue.message,
        }))
      );
    }

    return res
      .status(500)
      .json({ message: 'Error al iniciar sesion', error: error });
  }
};

export const profile = async (req, res) => {
  //extraer el accesstoken enviado por el cliente
  const token = req.cookies.accessToken;

  try {
    // decodificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await userModel.findById(decoded.userid);
    if (!user) {
      return res.status(404).json({ message: 'usuario no encontrado' });
    }
    return res.status(200).json({
      id: user._id,
      email: user.email,
      isAdmin: user.isAdmin,
      userName: user.name,
    });
  } catch (error) {
    return res.status(404).json({ message: 'No autorizado' });
  }
};

export const logOutUser = (req, res) => {
  try {
    console.log('entre en cerrar sesion');
    return res
      .clearCookie('accessToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      })
      .status(200)
      .json({ message: 'Cierre de sesion exitoso' });
  } catch (error) {
    console.log('error', error);
  }
};
