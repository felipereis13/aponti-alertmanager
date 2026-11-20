import { UserRepository } from '../repositories/user.repository';
import { CreateUserDTO, UpdateUserDTO, User } from '../models/user.model';
import { AppError } from '../middlewares/error.middleware';

export class UserService {
  constructor(private readonly userRepository = new UserRepository()) {}

  async listUsers(): Promise<User[]> {
    return this.userRepository.findAll();
  }

  async getUserById(id: number): Promise<User> {
    this.validateId(id);

    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    return user;
  }

  async createUser(data: CreateUserDTO): Promise<User> {
    if (!data.name || !data.name.trim()) {
      throw new AppError('O campo "name" é obrigatório.', 400);
    }

    if (!data.email || !data.email.trim() || !data.email.includes('@')) {
      throw new AppError('Um "email" válido é obrigatório.', 400);
    }

    const normalizedEmail = data.email.trim().toLowerCase();
    await this.ensureEmailAvailable(normalizedEmail);

    return this.userRepository.create({
      name: data.name.trim(),
      email: normalizedEmail,
      role: data.role?.trim() || 'user',
    });
  }

  async updateUser(id: number, data: UpdateUserDTO): Promise<User> {
    await this.getUserById(id);

    if (data.email !== undefined) {
      if (!data.email.trim() || !data.email.includes('@')) {
        throw new AppError('Informe um "email" válido.', 400);
      }

      const normalizedEmail = data.email.trim().toLowerCase();
      await this.ensureEmailAvailable(normalizedEmail, id);
      data.email = normalizedEmail;
    }

    if (data.name !== undefined) {
      if (!data.name.trim()) {
        throw new AppError('O campo "name" não pode ser vazio.', 400);
      }
      data.name = data.name.trim();
    }

    const updated = await this.userRepository.update(id, data);
    if (!updated) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    return updated;
  }

  async deleteUser(id: number): Promise<void> {
    await this.getUserById(id);
    await this.userRepository.delete(id);
  }

  private validateId(id: number): void {
    if (!Number.isInteger(id) || id <= 0) {
      throw new AppError('ID de usuário inválido.', 400);
    }
  }

  private async ensureEmailAvailable(email: string, currentUserId?: number): Promise<void> {
    const account = await this.userRepository.findByEmail(email);
    if (!account || account.id === currentUserId) {
      return;
    }

    const message = currentUserId === undefined
      ? 'Já existe um usuário cadastrado com este e-mail.'
      : 'Este e-mail já está em uso por outro usuário.';

    throw new AppError(message, 409);
  }
}

