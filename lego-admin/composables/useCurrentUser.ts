import type { UserProps } from '../types/user'
export const useCurrentUser = () => {
  return useState<UserProps>('currentUser', () => ({ isLogin: false, data: null }))
}

