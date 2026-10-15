import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

import { handleCallPush, handleCallResponse } from '@/lib/call/call-push';
import { isExpoGoRuntime } from '@/lib/notification/device-alerts';

/**
 * Defined at bundle load (index.ts). Android delivers call pushes data-only, so after a
 * swipe-kill the OS wakes this bundle headless and the task shows the system call screen.
 */
export const CALL_PUSH_TASK = 'tokajo-call-push';

type TaskManagerModule = typeof import('expo-task-manager');
type NotificationsModule = typeof import('expo-notifications');

function canRegister(): boolean {
  if (Platform.OS === 'web' || isExpoGoRuntime()) return false;
  return Boolean(
    requireOptionalNativeModule('ExpoTaskManager') && requireOptionalNativeModule('ExpoPushTokenManager'),
  );
}

if (canRegister()) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const TaskManager = require('expo-task-manager') as TaskManagerModule;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Notifications = require('expo-notifications') as NotificationsModule;

  TaskManager.defineTask<Record<string, unknown>>(CALL_PUSH_TASK, async ({ data, error }) => {
    if (error || !data) return;
    try {
      if ('actionIdentifier' in data) {
        const response = data as unknown as {
          actionIdentifier: string;
          notification?: { request?: { content?: { data?: unknown } } };
        };
        await handleCallResponse(response.actionIdentifier, response.notification?.request?.content?.data);
        return;
      }
      await handleCallPush(data, 'task');
    } catch {
      // A failed wake must never crash the headless runtime.
    }
  });

  void Notifications.registerTaskAsync(CALL_PUSH_TASK).catch(() => undefined);
}
