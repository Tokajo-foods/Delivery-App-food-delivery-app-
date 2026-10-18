package expo.modules.tokajocalllock

import android.app.KeyguardManager
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class TokajoCallLockModule : Module() {
  private val context: Context?
    get() = appContext.reactContext

  override fun definition() = ModuleDefinition {
    Name("TokajoCallLock")

    Function("setShowWhenLocked") { on: Boolean ->
      CallLockState.set(on, appContext.currentActivity)
    }

    Function("isDeviceLocked") {
      val keyguard = context?.getSystemService(Context.KEYGUARD_SERVICE) as? KeyguardManager
      keyguard?.isKeyguardLocked ?: false
    }

    /** Android 14+ lets users (and Play) revoke full-screen alerts; then calls only show as banners. */
    Function("canUseFullScreenIntent") {
      if (Build.VERSION.SDK_INT < 34) return@Function true
      val manager = context?.getSystemService(NotificationManager::class.java) ?: return@Function true
      manager.canUseFullScreenIntent()
    }

    Function("openFullScreenIntentSettings") {
      val ctx = context ?: return@Function false
      if (Build.VERSION.SDK_INT < 34) return@Function false
      val intent = Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT, Uri.parse("package:${ctx.packageName}"))
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      ctx.startActivity(intent)
      true
    }
  }
}
