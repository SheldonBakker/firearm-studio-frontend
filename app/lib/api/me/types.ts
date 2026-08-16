export interface CurrentUserResponse {
  id: string;
  email: string | null;
  roles: string[] | null;
  twoFactorEnabled: boolean;
  phoneNumber: string | null;
  phoneNumberConfirmed: boolean;
  pendingPhoneNumber: string | null;
}

export interface AdminCheckResponse {
  isAdmin: boolean;
  id: string;
}
