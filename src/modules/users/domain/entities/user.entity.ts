export interface User {
  id: string;
  full_name: string;
  identification_number: string;
  issuing_place: string;
  email: string;
  entry_date: string;
  salary: string;
  transportation_allowance: string;
  gender: string;
  can_login: boolean;
  password?: string | null;
  is_active: boolean;
  positionId?: string | null;
  created_at: Date;
  updated_at: Date;
} 