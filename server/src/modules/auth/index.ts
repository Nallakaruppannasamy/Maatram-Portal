/**
 * @file src/modules/auth/index.ts
 * @description Entrypoint for the Authentication module.
 */

export { default as authRouter } from './auth.routes';
export { authService } from './auth.service';
export { authRepository } from './auth.repository';
export * from './auth.types';
export * from './auth.constants';
