import mongoose from 'mongoose';
import dns from 'dns';

export const connectDB = async () => {
  try {
    // Solo cambia los DNS si estás desarrollando en tu PC local
    if (process.env.NODE_ENV !== 'production') {
      dns.setServers(['1.1.1.1', '8.8.8.8']);
    }

    const dbURI = process.env.MONGO_DB_URI.replace(
      '<db_username>',
      process.env.MONGO_DB_USER
    )
      .replace('<db_password>', process.env.MONGO_DB_PASSWORD)
      .replace('<db_name>', process.env.MONGO_DB_NAME);
    await mongoose.connect(dbURI);
    console.log('Conectado a la base de datos');
  } catch (error) {
    console.error('Error al conectarse a MongoDB', error);
  }
};

export const disconnectDB = async () => {
  try {
    mongoose.disconnect();
    console.log('Desconecado de la base de datos MongoDB');
  } catch (error) {
    console.error('Error al descoenctarse desde MongoDB: ', error);
  }
};
