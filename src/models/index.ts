import { User } from './User';
import { Address } from './Address';

// Define associations
User.hasMany(Address, {
  foreignKey: 'userId',
  as: 'addresses',
  onDelete: 'CASCADE',
});

Address.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

export { User, Address };

