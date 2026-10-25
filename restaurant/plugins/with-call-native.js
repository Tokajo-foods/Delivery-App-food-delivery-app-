/**
 * Lock-screen calling that works when the app is closed.
 *
 * Android: USE_FULL_SCREEN_INTENT so the Notifee call alert can open the call screen over the
 * lock screen (the tokajo-call-lock module only arms that while a call is live), and a microphone
 * foreground service so call audio survives the screen locking or the app going to background.
 *
 * iOS: PushKit VoIP registration at launch, and every VoIP push is reported to CallKit before
 * returning. iOS 13+ terminates apps that receive a VoIP push without reporting a call.
 */
const fs = require('fs');
const path = require('path');
const { AndroidConfig, withAndroidManifest, withAppDelegate, withDangerousMod } = require('expo/config-plugins');

const MARK = '// tokajo-voip';

const NOTIFEE_SERVICE = 'app.notifee.core.ForegroundService';

/** Notifee ships its service as `shortService` (3 min cap); a call needs the microphone type. */
function withCallForegroundService(manifest) {
  manifest.manifest.$['xmlns:tools'] ??= 'http://schemas.android.com/tools';
  const app = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);
  app.service = (app.service ?? []).filter((s) => s.$['android:name'] !== NOTIFEE_SERVICE);
  app.service.push({
    $: {
      'android:name': NOTIFEE_SERVICE,
      'android:exported': 'false',
      'android:foregroundServiceType': 'microphone',
      'tools:replace': 'android:foregroundServiceType',
    },
  });
  return manifest;
}

function withFullScreenIntent(config) {
  return withAndroidManifest(config, (cfg) => {
    AndroidConfig.Permissions.ensurePermissions(cfg.modResults, [
      'android.permission.USE_FULL_SCREEN_INTENT',
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.FOREGROUND_SERVICE_MICROPHONE',
    ]);
    cfg.modResults = withCallForegroundService(cfg.modResults);
    return cfg;
  });
}

const DELEGATE_EXTENSION = `
${MARK}
extension AppDelegate: PKPushRegistryDelegate {
  public func pushRegistry(_ registry: PKPushRegistry, didUpdate pushCredentials: PKPushCredentials, for type: PKPushType) {
    RNVoipPushNotificationManager.didUpdate(pushCredentials, forType: type.rawValue)
  }

  public func pushRegistry(_ registry: PKPushRegistry, didInvalidatePushTokenFor type: PKPushType) {}

  public func pushRegistry(
    _ registry: PKPushRegistry,
    didReceiveIncomingPushWith payload: PKPushPayload,
    for type: PKPushType,
    completion: @escaping () -> Void
  ) {
    let data = payload.dictionaryPayload
    let uuid = (data["uuid"] as? String) ?? UUID().uuidString
    let caller = (data["callerTitle"] as? String) ?? (data["callerName"] as? String) ?? "TOKAJO"
    RNVoipPushNotificationManager.didReceiveIncomingPush(with: payload, forType: type.rawValue)
    RNCallKeep.reportNewIncomingCall(
      uuid,
      handle: "TOKAJO",
      handleType: "generic",
      hasVideo: false,
      localizedCallerName: caller,
      supportsHolding: false,
      supportsDTMF: false,
      supportsGrouping: false,
      supportsUngrouping: false,
      fromPushKit: true,
      payload: data,
      withCompletionHandler: completion
    )
  }
}
`;

function patchSwiftDelegate(contents) {
  if (contents.includes(MARK)) return contents;
  let next = contents;
  if (!/^import PushKit$/m.test(next)) next = next.replace(/^import Expo$/m, 'import Expo\nimport PushKit');
  const launchReturn = /(\n(\s*)return super\.application\(application, didFinishLaunchingWithOptions: launchOptions\))/;
  if (!launchReturn.test(next)) {
    throw new Error('with-call-native: could not find didFinishLaunching return in AppDelegate.swift');
  }
  next = next.replace(launchReturn, '\n$2RNVoipPushNotificationManager.voipRegistration()$1');
  return `${next.trimEnd()}\n${DELEGATE_EXTENSION}`;
}

function withVoipDelegate(config) {
  return withAppDelegate(config, (cfg) => {
    if (cfg.modResults.language !== 'swift') {
      throw new Error('with-call-native: expected a Swift AppDelegate (Expo SDK 53+)');
    }
    cfg.modResults.contents = patchSwiftDelegate(cfg.modResults.contents);
    return cfg;
  });
}

const BRIDGE_IMPORTS = ['#import <RNCallKeep/RNCallKeep.h>', '#import <RNVoipPushNotification/RNVoipPushNotificationManager.h>'];

function withVoipBridgingHeader(config) {
  return withDangerousMod(config, [
    'ios',
    (cfg) => {
      const name = cfg.modRequest.projectName;
      const header = path.join(cfg.modRequest.platformProjectRoot, name, `${name}-Bridging-Header.h`);
      const current = fs.existsSync(header) ? fs.readFileSync(header, 'utf8') : '';
      const missing = BRIDGE_IMPORTS.filter((line) => !current.includes(line));
      if (missing.length) fs.writeFileSync(header, `${current.trimEnd()}\n${missing.join('\n')}\n`);
      return cfg;
    },
  ]);
}

module.exports = function withCallNative(config) {
  return withVoipBridgingHeader(withVoipDelegate(withFullScreenIntent(config)));
};
module.exports.patchSwiftDelegate = patchSwiftDelegate;
