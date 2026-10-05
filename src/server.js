import app from './app.js';
import { connectDB } from './config/database.js';
import { config, validateConfig, warnIfMailConfigMissing } from './config/config.js';

const startServer = async () => {
  try {
    validateConfig();
    warnIfMailConfigMissing();
    await connectDB();
  } catch (error) {
    console.error('No se pudo iniciar el servidor:', error.message);
    process.exit(1);
  }

  app.listen(config.port, () => {
    console.log(`Servidor corriendo en el puerto ${config.port} (${config.nodeEnv})`);
  });
};

startServer();
