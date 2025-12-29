import type { UserDataProps } from '~/server/models/user'
export interface UserProps {
  isLogin: boolean;
  data: UserDataProps | null;
}
