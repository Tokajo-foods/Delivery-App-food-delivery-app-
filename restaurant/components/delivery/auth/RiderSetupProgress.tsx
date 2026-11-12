import { Check } from 'lucide-react-native';
import { Fragment } from 'react';
import { Text, View } from 'react-native';

import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';

const STEP_LABELS = ['Home', 'Vehicle'] as const;

type Props = {
  step: number;
};

export function RiderSetupProgress({ step }: Props) {
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        {STEP_LABELS.map((label, index) => {
          const done = index < step;
          const active = index === step;
          const connectorDone = index < step;
          return (
            <Fragment key={label}>
              <View style={{ flex: 1, minWidth: 0, alignItems: 'center' }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: done
                      ? authTheme.text
                      : active
                        ? authTheme.brand
                        : authTheme.surface,
                    borderWidth: active || done ? 0 : 1,
                    borderColor: authTheme.cardBorder,
                  }}
                >
                  {done ? (
                    <Check color="#FFFFFF" size={15} strokeWidth={2.5} />
                  ) : (
                    <Text
                      style={{
                        fontFamily: fonts.semiBold,
                        fontSize: 12,
                        color: active ? '#FFFFFF' : authTheme.textDim,
                      }}
                    >
                      {index + 1}
                    </Text>
                  )}
                </View>
                <Text
                  numberOfLines={1}
                  style={{
                    marginTop: 8,
                    fontFamily: active ? fonts.semiBold : fonts.medium,
                    fontSize: 11,
                    color: active ? authTheme.text : authTheme.textMuted,
                    textAlign: 'center',
                  }}
                >
                  {label}
                </Text>
              </View>
              {index < STEP_LABELS.length - 1 ? (
                <View
                  style={{
                    flex: 1,
                    minWidth: 12,
                    height: 1,
                    marginTop: 15,
                    backgroundColor: connectorDone ? authTheme.text : authTheme.cardBorder,
                  }}
                />
              ) : null}
            </Fragment>
          );
        })}
      </View>
      <Text
        style={{
          marginTop: 10,
          fontFamily: fonts.regular,
          fontSize: 12,
          color: authTheme.textDim,
          textAlign: 'center',
        }}
      >
        Step {step + 1} of {STEP_LABELS.length}
      </Text>
    </View>
  );
}
