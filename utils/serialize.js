// Normaliza instancias Sequelize para que el frontend siga recibiendo _id y createdAt/updatedAt
function normalize(instance) {
  if (!instance) return instance;
  const obj = instance.toJSON ? instance.toJSON() : instance;
  if (obj.id && !obj._id) obj._id = String(obj.id);
  return obj;
}

function normalizeArray(arr) {
  return arr.map(i => normalize(i));
}

module.exports = { normalize, normalizeArray };