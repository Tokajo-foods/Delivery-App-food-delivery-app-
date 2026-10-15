import { Text, View } from 'react-native';

import type { RiderPayout } from '@/lib/delivery-partner/types';

function inr(amount: number) {
  const n = Math.round(Math.max(0, amount) * 100) / 100;
  return `₹${n.toLocaleString('en-IN', {
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

type Row = { label: string; value: string; strong?: boolean };

export function riderPayoutRows(payout: RiderPayout): Row[] {
  const rows: Row[] = [
    { label: 'Base pay', value: inr(payout.basePay) },
    {
      label: `Per km · ${payout.distanceKm.toFixed(1)} km × ${inr(payout.perKmRate)}`,
      value: inr(payout.distanceCharge),
    },
  ];
  if (payout.incentive > 0) {
    rows.push({
      label: `Incentive · ${payout.incentiveKm.toFixed(1)} km × ${inr(payout.incentivePerKm)}`,
      value: inr(payout.incentive),
    });
  }
  if (payout.tip > 0) {
    rows.push({ label: 'Customer tip', value: inr(payout.tip) });
  }
  rows.push({
    label: `Platform commission ${payout.platformCommissionPct}%`,
    value: `−${inr(payout.platformCommissionAmount)}`,
  });
  rows.push({ label: 'You earn', value: inr(payout.finalAmount), strong: true });
  return rows;
}

export function RiderPayoutLines({
  payout,
  rowStyle,
  labelStyle,
  valueStyle,
  strongStyle,
}: {
  payout: RiderPayout;
  rowStyle?: object;
  labelStyle?: object;
  valueStyle?: object;
  strongStyle?: object;
}) {
  return (
    <View>
      {riderPayoutRows(payout).map((row) => (
        <View key={row.label} style={rowStyle}>
          <Text style={[labelStyle, row.strong ? strongStyle : null]}>{row.label}</Text>
          <Text style={[valueStyle, row.strong ? strongStyle : null]}>{row.value}</Text>
        </View>
      ))}
    </View>
  );
}

export function formatRiderPayoutInr(amount: number) {
  return inr(amount);
}
