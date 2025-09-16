const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    role: { type: DataTypes.ENUM('admin','user'), defaultValue: 'user' },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    acudienteNombre: { type: DataTypes.STRING, allowNull: false },
    acudienteDocumento: { type: DataTypes.STRING, allowNull: false },
    estudianteNombre: { type: DataTypes.STRING, allowNull: false },
    estudianteDocumento: { type: DataTypes.STRING, allowNull: false },
    estudianteNacimiento: { type: DataTypes.DATE, allowNull: false },
    gradoSeccion: { type: DataTypes.STRING, allowNull: false },
    direccion: { type: DataTypes.STRING, allowNull: false },
    telefono: { type: DataTypes.STRING, allowNull: false },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  }, {
    tableName: 'users',
    timestamps: true,
  });

  return User;
};