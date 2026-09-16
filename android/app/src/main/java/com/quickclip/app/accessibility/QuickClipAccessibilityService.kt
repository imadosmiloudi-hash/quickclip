package com.quickclip.app.accessibility

import android.accessibilityservice.AccessibilityService
import android.view.accessibility.AccessibilityEvent

/**
 * Optional stub. Declared disabled in the manifest by default.
 * Do not implement invasive automation. Core IME works without this service.
 */
class QuickClipAccessibilityService : AccessibilityService() {
    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // Intentionally empty — enable only after explicit user opt-in in Settings → Automation.
    }

    override fun onInterrupt() = Unit
}
