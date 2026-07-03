export interface CurrentUserResponse {
  id: string;
  email: string | null;
  roles: string[] | null;
}

export interface AdminCheckResponse {
  isAdmin: boolean;
  id: string;
}
