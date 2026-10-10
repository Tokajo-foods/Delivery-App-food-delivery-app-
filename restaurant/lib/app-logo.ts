import { getAppVariant } from '@/lib/app-variant';

const restaurantLogo = require('../assets/tokajo-restaurant-logo.png');
const deliveryLogo = require('../assets/tokajo-delivery-logo.png');
const combinedLogo = require('../assets/tokajo-logo.png');

/** Launcher and in-app mark for the app that is currently running. */
export function appLogoSource() {
  const variant = getAppVariant();
  if (variant === 'delivery') return deliveryLogo;
  if (variant === 'restaurant') return restaurantLogo;
  return combinedLogo;
}
