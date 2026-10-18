package expo.modules.tokajocalllock

import android.app.Activity
import android.os.Build
import android.view.WindowManager
import java.lang.ref.WeakReference

/**
 * Whether the app may draw over the lock screen. Only armed while a call rings or is live,
 * so a locked phone never reveals the rest of the app.
 */
internal object CallLockState {
  @Volatile
  var armed = false
    private set

  private var activityRef: WeakReference<Activity>? = null

  fun track(activity: Activity) {
    activityRef = WeakReference(activity)
    apply(activity)
  }

  fun set(on: Boolean, current: Activity?) {
    armed = on
    val activity = current ?: activityRef?.get() ?: return
    activityRef = WeakReference(activity)
    activity.runOnUiThread { apply(activity) }
  }

  private fun apply(activity: Activity) {
    val on = armed
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
      activity.setShowWhenLocked(on)
      activity.setTurnScreenOn(on)
      return
    }
    @Suppress("DEPRECATION")
    val flags = WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
    if (on) activity.window.addFlags(flags) else activity.window.clearFlags(flags)
  }
}
