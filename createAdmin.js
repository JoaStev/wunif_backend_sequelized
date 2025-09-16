require('dotenv').config();
console.log('DB_HOST ->', JSON.stringify(process.env.DB_HOST));
console.log('DB_PORT ->', JSON.stringify(process.env.DB_PORT));
console.log('DB_NAME ->', JSON.stringify(process.env.DB_NAME));
console.log('DB_USER ->', JSON.stringify(process.env.DB_USER));
console.log('DB_PASS ->', JSON.stringify(process.env.DB_PASS));
console.log('DATABASE_URL ->', JSON.stringify(process.env.DATABASE_URL));
const bcrypt = require('bcrypt');
const { sequelize } = require('./db/sequelize');
const { User } = require('./models');

async function createAdmin() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();

    const email = 'admin1@icit.com';
    const password = 'Admin12345';
    const passwordHash = await bcrypt.hash(password, 10);
    const exists = await User.findOne({ where: { email } });
    if (exists) {
      console.log('Ya existe un admin con ese correo.');
      process.exit(0);
    }
    const user = await User.create({
      email,
      passwordHash,
      acudienteNombre: 'Administrador',
      acudienteDocumento: 'ADMIN',
      estudianteNombre: 'Admin',
      estudianteDocumento: 'ADMIN',
      estudianteNacimiento: new Date('2000-01-01'),
      gradoSeccion: 'ADMIN',
      direccion: 'Colegio ICIT',
      telefono: '0000000000',
      role: 'admin',
      isActive: true
    });
    console.log('Usuario admin creado:');
    console.log('Email:', email);
    console.log('Contraseña:', password);
    process.exit(0);
  } catch (err) {
    console.error('Error createAdmin:', err);
    process.exit(1);
  }
}

createAdmin();
