export enum Role {
  SuperAdmin = 'super_admin',
  BranchManager = 'branch_manager',
  Customer = 'customer',
}

export const ADMIN_ROLES = [Role.SuperAdmin, Role.BranchManager] as const;
export const ALL_ROLES = [...ADMIN_ROLES, Role.Customer] as const;
