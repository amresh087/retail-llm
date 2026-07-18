export const ROLES = {
ADMIN: 'ADMIN',
SHOPKEEPER: 'SHOPKEEPER',
CUSTOMER: 'CUSTOMER'
} as const;


export type Role = typeof ROLES[keyof typeof ROLES];


export const isAdmin = (role: string) => role === ROLES.ADMIN;
export const isShopkeeper = (role: string) => role === ROLES.SHOPKEEPER;
export const isCustomer = (role: string) => role === ROLES.CUSTOMER;