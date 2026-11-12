import { ChevronLeft, ChevronRight, Lock } from 'lucide-react-native';
import { useEffect } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';

import { AuthBanner } from '@/components/auth/AuthBanner';
import { AuthShell } from '@/components/auth/AuthShell';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { LocationMapPicker } from '@/components/restaurant/LocationMapPicker';
import { SetupAddressStep } from '@/components/restaurant/SetupAddressStep';
import { SetupBasicStep } from '@/components/restaurant/SetupBasicStep';
import { SetupCuisineStep } from '@/components/restaurant/SetupCuisineStep';
import { SetupProgress } from '@/components/restaurant/SetupProgress';
import { theme } from '@/constants/theme';
import { requestLocationIfOff } from '@/lib/permissions/request-permissions';
import { useCuisineCatalog, useRestaurantServiceHealth } from '@/lib/restaurant/hooks';
import {
  type SetupStep,
  useRestaurantSetup,
} from '@/lib/restaurant/use-restaurant-setup';

function SetupStepActions({
  setup,
  serviceHealth,
}: {
  setup: ReturnType<typeof useRestaurantSetup>;
  serviceHealth: ReturnType<typeof useRestaurantServiceHealth>;
}) {
  const serviceBlocked = serviceHealth.data?.ok === false || serviceHealth.data?.ready === false;
  const continueLocked = setup.step < 2 && !setup.canAdvance;
  const registerLocked = setup.step === 2 && (!setup.canRegister || serviceBlocked);

  const continueLabel =
    setup.step === 0 ? 'Continue to address' : setup.step === 1 ? 'Continue to review' : 'Continue';

  const lockHeadline =
    registerLocked && serviceBlocked
      ? 'Restaurant service must be online before you can register.'
      : setup.step < 2
        ? 'Complete all mandatory fields before proceeding to the next step.'
        : 'Complete all mandatory fields before registering your restaurant.';

  const lockDetail =
    setup.step < 2
      ? setup.stepBlockReason
      : registerLocked && !serviceBlocked
        ? setup.registerBlockReason
        : null;

  const explainLocked = () => {
    const detail =
      registerLocked && serviceBlocked
        ? lockHeadline
        : lockDetail ?? 'Fill every required field (*) on this step.';
    setup.setBanner({ type: 'error', message: detail });
    Alert.alert('Cannot continue yet', detail);
  };

  return (
    <View className="gap-3">
      <View className="flex-row gap-3">
        {setup.step > 0 ? (
          <Pressable
            onPress={setup.goBack}
            disabled={setup.busy}
            className="h-[52px] flex-1 flex-row items-center justify-center gap-1 rounded-xl border-2 border-gray-200 bg-white"
          >
            <ChevronLeft color={theme.secondary} size={18} />
            <Text className="text-[15px] font-bold text-secondary">Back</Text>
          </Pressable>
        ) : null}
        <View style={{ flex: setup.step > 0 ? 2 : 1, minWidth: 0 }}>
          {setup.step < 2 ? (
            <PrimaryButton
              label={continueLabel}
              trailingIcon={continueLocked ? Lock : ChevronRight}
              onPress={setup.goNext}
              disabled={setup.busy}
              softDisabled={continueLocked}
              onSoftDisabledPress={explainLocked}
            />
          ) : (
            <PrimaryButton
              label="Register Restaurant"
              trailingIcon={registerLocked ? Lock : undefined}
              onPress={() =>
                void setup.submit(
                  serviceHealth.data?.ok !== false,
                  serviceHealth.data?.message
                )
              }
              loading={setup.busy}
              disabled={setup.busy}
              softDisabled={registerLocked}
              onSoftDisabledPress={explainLocked}
            />
          )}
        </View>
      </View>
      {setup.step === 0 ? (
        <Pressable
          onPress={setup.goBack}
          disabled={setup.busy}
          className="items-center py-1"
        >
          <Text className="text-sm font-semibold text-secondary-light">
            Log out instead
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export default function RestaurantSetupScreen() {
  const cuisinesQuery = useCuisineCatalog(true);
  const serviceHealth = useRestaurantServiceHealth(true);
  const setup = useRestaurantSetup();

  useEffect(() => {
    if (setup.step !== 1) return;
    void requestLocationIfOff();
  }, [setup.step]);

  const stepActions = <SetupStepActions setup={setup} serviceHealth={serviceHealth} />;

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <AuthShell
        layout="fullscreen"
        title="Complete restaurant profile"
        subtitle="A few details so customers can find your kitchen and place orders."
        showBack
        onBackPress={setup.goBack}
        footer={stepActions}
      >
        <SetupProgress
          step={setup.step}
          maxStep={setup.maxStep}
          onStep={(index) => {
            if (index <= setup.maxStep) {
              setup.setBanner(null);
              setup.setStep(index as SetupStep);
            }
          }}
        />

        {serviceHealth.data && !serviceHealth.data.ok ? (
          <AuthBanner
            type="error"
            message={
              serviceHealth.data.message ??
              'Restaurant service is unreachable. You cannot create an outlet until it is back.'
            }
          />
        ) : serviceHealth.data && !serviceHealth.data.ready ? (
          <AuthBanner
            type="error"
            message={
              serviceHealth.data.message ??
              'Restaurant database is not ready. Wait a moment and try again.'
            }
          />
        ) : null}
        {setup.banner ? (
          <AuthBanner type={setup.banner.type} message={setup.banner.message} />
        ) : null}

        {setup.step === 0 ? (
          <SetupBasicStep
            logoUri={setup.logo?.uri}
            coverUri={setup.cover?.uri}
            onPickLogo={() => void setup.pickImage('logo')}
            onPickCover={() => void setup.pickImage('cover')}
            name={setup.name}
            setName={setup.setName}
            description={setup.description}
            setDescription={setup.setDescription}
            fssai={setup.fssai}
            setFssai={setup.setFssai}
            gstin={setup.gstin}
            setGstin={setup.setGstin}
            priceRange={setup.priceRange}
            setPriceRange={setup.setPriceRange}
            costForTwo={setup.costForTwo}
            setCostForTwo={setup.setCostForTwo}
          />
        ) : null}

        {setup.step === 1 ? (
          <SetupAddressStep
            coords={setup.coords}
            locationLabel={setup.locationLabel}
            onOpenMap={() => setup.setMapOpen(true)}
            street={setup.street}
            setStreet={setup.setStreet}
            area={setup.area}
            setArea={setup.setArea}
            city={setup.city}
            setCity={setup.setCity}
            stateName={setup.stateName}
            setStateName={setup.setStateName}
            pincode={setup.pincode}
            setPincode={setup.setPincode}
            country={setup.country}
            setCountry={setup.setCountry}
          />
        ) : null}

        {setup.step === 2 ? (
          <SetupCuisineStep
            cuisineNames={cuisinesQuery.names}
            cuisineError={Boolean(cuisinesQuery.isError)}
            cuisines={setup.cuisines}
            setCuisines={setup.setCuisines}
            name={setup.name}
            city={setup.city}
            stateName={setup.stateName}
            logoLabel={setup.logo?.fileName ?? (setup.logo ? 'Selected' : '—')}
            locationReady={Boolean(setup.coords)}
            fssai={setup.fssai}
            gstin={setup.gstin}
          />
        ) : null}

        {setup.busy ? (
          <View className="mt-4 flex-row items-center justify-center gap-2">
            <ActivityIndicator color={theme.primary} />
            <Text className="text-sm text-secondary-light">Submitting…</Text>
          </View>
        ) : null}
      </AuthShell>

      <LocationMapPicker
        visible={setup.mapOpen}
        initial={setup.coords}
        autoDetectOnOpen={!setup.coords}
        onClose={() => setup.setMapOpen(false)}
        onConfirm={setup.confirmMap}
      />
    </View>
  );
}
