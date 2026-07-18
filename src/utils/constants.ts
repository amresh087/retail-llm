// src/utils/constants.ts

export const ROLES = {
  ADMIN: 'ADMIN',
  SUPPORT: 'SUPPORT',
  USER: 'USER',
  SHOPKEEPER: 'SHOPKEEPER',
  CUSTOMER: 'CUSTOMER',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];
