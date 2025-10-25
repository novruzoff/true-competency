// src/lib/roles.ts
export type UserRole = 'trainee' | 'instructor' | 'committee' | 'admin';

export const ROLE_LABEL: Record<UserRole, string> = {
  trainee: 'IVUS Trainee',
  instructor: 'IVUS Instructors',
  committee: 'Competency Committee Member',
  admin: 'Platform Admin',
};

export const ROLE_HOME: Record<UserRole, string> = {
  trainee: '/trainee',
  instructor: '/instructor',
  committee: '/committee',
  admin: '/admin',
};