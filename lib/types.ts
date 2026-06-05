export type UserRole = 'staff' | 'manager' | 'admin';

export type UserProfile = {
  uid: string;
  name: string;
  role: UserRole;
  storeName: string;
};

export type Sale = {
  id?: string;
  date: string;
  year: number;
  month: number;
  day: number;
  creditCard: number;
  starCard: number;
  dollar: number;
  won: number;
  memo: string;
  managerName: string;
  userId: string;
  storeName: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};
