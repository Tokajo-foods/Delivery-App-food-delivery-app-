/**
 * New Architecture rejects two @ReactMethod exports with the same JavaScript name.
 * react-native-callkeep 4.3.16 annotates both the 3-arg and 4-arg overloads of
 * displayIncomingCall and startCall. Keep the 4-arg method, which the JS bridge calls.
 */
const fs = require('fs');
const path = require('path');

const file = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-callkeep',
  'android',
  'src',
  'main',
  'java',
  'io',
  'wazo',
  'callkeep',
  'RNCallKeepModule.java'
);

if (!fs.existsSync(file)) {
  process.exit(0);
}

const source = fs.readFileSync(file, 'utf8');
const next = source.replace(
  /@ReactMethod\r?\n(\s*public void (?:displayIncomingCall|startCall)\(String uuid, String number, String callerName\) \{)/g,
  '$1'
);

if (next !== source) {
  fs.writeFileSync(file, next);
  console.log('[fix-callkeep-android] removed duplicate CallKeep React methods');
}
