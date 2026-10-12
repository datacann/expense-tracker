export type PermissionAction = 'launch' | 'request' | 'settings';

export const resolvePermissionAction = (
  status: 'granted' | 'denied' | 'undetermined',
  canAskAgain: boolean,
): PermissionAction => {
  if (status === 'granted') return 'launch';
  return canAskAgain ? 'request' : 'settings';
};
