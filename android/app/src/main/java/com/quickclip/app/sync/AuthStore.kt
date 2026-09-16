package com.quickclip.app.sync

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.dataStore by preferencesDataStore("quickclip_prefs")

@Singleton
class AuthStore @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    private val tokenKey = stringPreferencesKey("jwt")
    private val emailKey = stringPreferencesKey("email")
    private val baseUrlKey = stringPreferencesKey("base_url")

    val token: Flow<String?> = context.dataStore.data.map { it[tokenKey] }
    val email: Flow<String?> = context.dataStore.data.map { it[emailKey] }
    val baseUrl: Flow<String?> = context.dataStore.data.map { it[baseUrlKey] }

    suspend fun saveSession(token: String, email: String) {
        context.dataStore.edit {
            it[tokenKey] = token
            it[emailKey] = email
        }
    }

    suspend fun clear() {
        context.dataStore.edit {
            it.remove(tokenKey)
            it.remove(emailKey)
        }
    }

    suspend fun setBaseUrl(url: String) {
        context.dataStore.edit { it[baseUrlKey] = url.trimEnd('/') }
    }
}
