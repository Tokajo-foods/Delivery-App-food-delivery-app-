package expo.modules.tokajocalllock

import android.app.Activity
import android.content.Context
import android.os.Bundle
import expo.modules.core.interfaces.Package
import expo.modules.core.interfaces.ReactActivityLifecycleListener

/** Applies the lock-screen flag as the activity is created by a full-screen call alert. */
class TokajoCallLockPackage : Package {
  override fun createReactActivityLifecycleListeners(activityContext: Context?): List<ReactActivityLifecycleListener> =
    listOf(object : ReactActivityLifecycleListener {
      override fun onCreate(activity: Activity, savedInstanceState: Bundle?) {
        CallLockState.track(activity)
      }

      override fun onResume(activity: Activity) {
        CallLockState.track(activity)
      }
    })
}
