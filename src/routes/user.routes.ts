import { Router } from 'express';
import { UserController } from '../controllers/user.controller';

const userRoutes = Router();
const userController = new UserController();

userRoutes.route('/')
  .get(userController.findAll)
  .post(userController.create);

userRoutes.route('/:id')
  .get(userController.findById)
  .put(userController.update)
  .delete(userController.delete);

export { userRoutes };

