package com.quickclip.app.ui.settings

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ListItem
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.quickclip.app.R
import com.quickclip.app.sync.AuthStore
import com.quickclip.app.sync.SyncManager
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    onBack: () -> Unit,
    authStore: AuthStore,
    syncManager: SyncManager,
) {
    val email by authStore.email.collectAsState(initial = null)
    var loginEmail by remember { mutableStateOf("") }
    var loginPassword by remember { mutableStateOf("") }
    var syncEnabled by remember { mutableStateOf(false) }
    var wifiOnly by remember { mutableStateOf(true) }
    var automation by remember { mutableStateOf(false) }
    var message by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.settings)) },
                navigationIcon = { TextButton(onClick = onBack) { Text("←") } },
            )
        }
    ) { padding ->
        Column(
            Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()).padding(16.dp)
        ) {
            Text(stringResource(R.string.settings_account))
            if (email != null) {
                Text(email!!)
                TextButton(onClick = { scope.launch { authStore.clear() } }) {
                    Text(stringResource(R.string.logout))
                }
            } else {
                OutlinedTextField(loginEmail, { loginEmail = it }, label = { Text(stringResource(R.string.email)) }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(loginPassword, { loginPassword = it }, label = { Text(stringResource(R.string.password)) }, modifier = Modifier.fillMaxWidth())
                TextButton(onClick = {
                    scope.launch {
                        runCatching { syncManager.login(loginEmail, loginPassword) }
                            .onSuccess { message = "OK" }
                            .onFailure { message = it.message }
                    }
                }) { Text(stringResource(R.string.login)) }
                TextButton(onClick = {
                    scope.launch {
                        runCatching { syncManager.register(loginEmail, loginPassword, null) }
                            .onSuccess { message = "OK" }
                            .onFailure { message = it.message }
                    }
                }) { Text(stringResource(R.string.register)) }
            }
            message?.let { Text(it) }

            ListItem(headlineContent = { Text(stringResource(R.string.settings_keyboard)) }, supportingContent = { Text(stringResource(R.string.onboarding_enable_ime_body)) })
            ListItem(headlineContent = { Text(stringResource(R.string.settings_appearance)) })
            ListItem(headlineContent = { Text(stringResource(R.string.settings_language)) }, supportingContent = { Text("EN / AR / FR") })

            Text(stringResource(R.string.settings_sync), modifier = Modifier.padding(top = 12.dp))
            ListItem(
                headlineContent = { Text(stringResource(R.string.sync_enable)) },
                trailingContent = { Switch(checked = syncEnabled, onCheckedChange = { syncEnabled = it }) },
            )
            ListItem(
                headlineContent = { Text(stringResource(R.string.sync_wifi_only)) },
                trailingContent = { Switch(checked = wifiOnly, onCheckedChange = { wifiOnly = it }) },
            )
            TextButton(onClick = {
                scope.launch {
                    runCatching {
                        syncManager.pull()
                        syncManager.pushLocalChanges()
                    }.onFailure { message = it.message }.onSuccess { message = "Synced" }
                }
            }) { Text(stringResource(R.string.sync_now)) }

            ListItem(headlineContent = { Text(stringResource(R.string.settings_storage)) }, supportingContent = { Text("filesDir/media") })

            Text(stringResource(R.string.settings_automation), modifier = Modifier.padding(top = 12.dp))
            Text(stringResource(R.string.automation_off))
            Text(stringResource(R.string.automation_explain))
            ListItem(
                headlineContent = { Text(stringResource(R.string.settings_automation)) },
                trailingContent = { Switch(checked = automation, onCheckedChange = { automation = it }) },
                modifier = Modifier.clickable { },
            )

            Text(stringResource(R.string.settings_privacy), modifier = Modifier.padding(top = 12.dp))
            Text(stringResource(R.string.privacy_body))
            Text(stringResource(R.string.settings_about), modifier = Modifier.padding(top = 12.dp))
            Text(stringResource(R.string.about_version))
            Text(stringResource(R.string.quick_sequences))
        }
    }
}
