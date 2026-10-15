import Constants from 'expo-constants';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { Alert, AppState, Linking, Platform } from 'react-native';

type BatteryModule = typeof import('expo-battery');

/** Older dev builds have no ExpoBattery native module. */
function loadBattery(): BatteryModule | null {
  if (Platform.OS !== 'android' || Constants.appOwnership === 'expo') return null;
  if (!requireOptionalNativeModule('ExpoBattery')) return null;
  return require('expo-battery') as BatteryModule;
}

const REPROMPT_MS = 30 * 60_000;
let lastPromptAt = 0;
let prompting = false;

async function openBatterySettings(): Promise<void> {
  try {
    await Linking.sendIntent('android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS');
  } catch {
    await Linking.openSettings();
  }
}

/**
 * Android OEM battery savers (Xiaomi, Oppo, Vivo, Samsung) kill the location service after a swipe-kill.
 * Ask the rider to exempt TOKAJO while they are online, at most every 30 minutes.
 */
export async function ensureBatteryExemption(onTrip: boolean): Promise<void> {
  const battery = loadBattery();
  if (!battery || prompting || AppState.currentState !== 'active') return;
  if (Date.now() - lastPromptAt < REPROMPT_MS) return;
  const optimized = await battery.isBatteryOptimizationEnabledAsync().catch(() => false);
  if (!optimized) return;
  prompting = true;
  lastPromptAt = Date.now();
  Alert.alert(
    'Keep live location running',
    onTrip
      ? 'Your phone may stop sharing your location with the customer when TOKAJO is closed. Set TOKAJO battery to "Unrestricted" / "Don\'t optimise".'
      : 'Your phone may stop TOKAJO in the background and you will miss orders. Set TOKAJO battery to "Unrestricted" / "Don\'t optimise".',
    [
      { text: 'Later', style: 'cancel', onPress: () => { prompting = false; } },
      {
        text: 'Open settings',
        onPress: () => {
          prompting = false;
          void openBatterySettings();
        },
      },
    ],
    { cancelable: false }
  );
}
