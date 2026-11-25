import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { badRequest } from '../utils/errors.js';
export default class AuthService {
  async authenticate(username, password) {
    if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) throw badRequest('Username and password are required');
    const user = await User.findOne({ where: { username, active: true } });
    if (!user || !(await bcrypt.compare(password, user.password_hash))) return null;
    return { id: user.id, username: user.username, role: user.role };
  }
}
