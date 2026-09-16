package com.quickclip.app.ui.onboarding

import android.content.Intent
import android.provider.Settings
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.quickclip.app.R

@Composable
fun OnboardingScreen(onFinished: () -> Unit) {
    var step by remember { mutableIntStateOf(0) }
    var testText by remember { mutableStateOf("") }
    val context = LocalContext.current
    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        when (step) {
            0 -> {
                Text(stringResource(R.string.welcome_title))
                Text(stringResource(R.string.welcome_body))
            }
            1 -> {
                Text(stringResource(R.string.onboarding_permissions))
                Text(stringResource(R.string.onboarding_permissions_body))
            }
            2 -> {
                Text(stringResource(R.string.onboarding_enable_ime))
                Text(stringResource(R.string.onboarding_enable_ime_body))
                Button(onClick = {
                    context.startActivity(Intent(Settings.ACTION_INPUT_METHOD_SETTINGS))
                }) { Text(stringResource(R.string.onboarding_open_settings)) }
            }
            3 -> {
                Text(stringResource(R.string.onboarding_test))
                OutlinedTextField(
                    value = testText,
                    onValueChange = { testText = it },
                    modifier = Modifier.fillMaxWidth(),
                    placeholder = { Text(stringResource(R.string.onboarding_test_hint)) },
                )
            }
            else -> {
                Text(stringResource(R.string.onboarding_ready))
                Text(stringResource(R.string.onboarding_ready_body))
            }
        }
        Button(
            onClick = {
                if (step >= 4) onFinished() else step++
            },
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text(stringResource(if (step >= 4) R.string.done else R.string.next))
        }
        if (step < 4) {
            TextButton(onClick = onFinished) { Text(stringResource(R.string.skip)) }
        }
    }
}
