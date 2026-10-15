// Background GPS must be defined before any screen mounts: after a swipe-kill the OS
// wakes this bundle headless and only runs tasks registered at module load.
import './lib/delivery-partner/background-location-task';
import './lib/call/call-background-task';
import 'expo-router/entry';
