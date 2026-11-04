export type PermissionId =
  | 'notifications'
  | 'microphone'
  | 'location'
  | 'locationBackground';

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

export type PermissionDefinition = {
  id: PermissionId;
  title: string;
  reason: string;
};

export type PermissionSnapshot = PermissionDefinition & {
  status: PermissionStatus;
  blocked: boolean;
};
