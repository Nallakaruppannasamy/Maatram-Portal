/**
 * @file src/modules/user/index.ts
 * @description Entrypoint for the User module.
 */

export { default as userRouter } from './user.routes';
export { userService } from './user.service';
export { userRepository } from './user.repository';
export * from './user.types';
export * from './user.constants';
export * from './user.validator';
