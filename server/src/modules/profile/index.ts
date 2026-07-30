/**
 * @file src/modules/profile/index.ts
 * @description Entrypoint for the Profile module.
 */

export { default as profileRouter } from './profile.routes';
export { profileService } from './profile.service';
export { profileRepository } from './profile.repository';
export * from './profile.types';
export * from './profile.validator';
