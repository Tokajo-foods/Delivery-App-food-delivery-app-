import { View } from 'react-native';

import { ContactChangeModal } from '@/components/delivery/profile/PlatformAccountSection';
import { ProfileEditSheet } from '@/components/delivery/profile/ProfileEditSheet';
import { ProfilePageView } from '@/components/delivery/profile/ProfilePageView';
import { profilePageStyles } from '@/components/delivery/profile/profile-page-styles';
import { usePartnerProfileScreen } from '@/components/delivery/profile/use-partner-profile-screen';
import { LocationMapPicker } from '@/components/restaurant/LocationMapPicker';

export function PartnerProfileManager() {
  const screen = usePartnerProfileScreen();

  return (
    <View style={profilePageStyles.root}>
      <ProfilePageView {...screen.view} />
      <ContactChangeModal
        kind={screen.contactKind}
        current={screen.contactKind === 'email' ? screen.accountEmail : screen.accountPhone}
        onClose={() => screen.setContactKind(null)}
      />
      <ProfileEditSheet {...screen.edit} />
      <LocationMapPicker
        visible={screen.addressMap.visible}
        initial={screen.addressMap.initial}
        autoDetectOnOpen={!screen.addressMap.initial}
        locationTitle="YOUR ADDRESS"
        currentLocationHint="Move the pin to where you live"
        onClose={screen.addressMap.onClose}
        onConfirm={screen.addressMap.onConfirm}
      />
    </View>
  );
}
