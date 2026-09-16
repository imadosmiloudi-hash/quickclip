package com.quickclip.app

import android.content.Context
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.quickclip.app.sync.AuthStore
import com.quickclip.app.sync.SyncManager
import com.quickclip.app.ui.library.LibraryScreen
import com.quickclip.app.ui.onboarding.OnboardingScreen
import com.quickclip.app.ui.settings.SettingsScreen
import com.quickclip.app.ui.theme.QuickClipTheme
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    @Inject lateinit var authStore: AuthStore
    @Inject lateinit var syncManager: SyncManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        val prefs = getSharedPreferences("onboarding", Context.MODE_PRIVATE)
        setContent {
            QuickClipTheme {
                var onboardingDone by remember {
                    mutableStateOf(prefs.getBoolean("done", false))
                }
                var screen by remember { mutableStateOf("library") }

                when {
                    !onboardingDone -> OnboardingScreen {
                        prefs.edit().putBoolean("done", true).apply()
                        onboardingDone = true
                    }
                    screen == "settings" -> SettingsScreen(
                        onBack = { screen = "library" },
                        authStore = authStore,
                        syncManager = syncManager,
                    )
                    else -> LibraryScreen(onOpenSettings = { screen = "settings" })
                }
            }
        }
    }
}
