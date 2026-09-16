package com.quickclip.app.sync

import com.quickclip.app.data.dao.ContentDao
import com.quickclip.app.data.dao.FolderDao
import com.quickclip.app.data.entity.ContentItemEntity
import com.quickclip.app.data.entity.FolderEntity
import kotlinx.coroutines.flow.first
import java.time.Instant
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SyncManager @Inject constructor(
    private val api: QuickClipApi,
    private val authStore: AuthStore,
    private val folderDao: FolderDao,
    private val contentDao: ContentDao,
) {
    suspend fun login(email: String, password: String) {
        val res = api.login(AuthRequest(email, password))
        authStore.saveSession(res.token, res.user.email)
    }

    suspend fun register(email: String, password: String, displayName: String?) {
        val res = api.register(AuthRequest(email, password, displayName))
        authStore.saveSession(res.token, res.user.email)
    }

    suspend fun pull(sinceIso: String? = null) {
        val token = authStore.token.first() ?: return
        val res = api.pull("Bearer $token", sinceIso)
        folderDao.upsertAll(
            res.folders.map {
                FolderEntity(
                    id = it.id,
                    name = it.name,
                    sortOrder = it.sortOrder ?: 0,
                    syncedAt = System.currentTimeMillis(),
                )
            }
        )
        contentDao.upsertAll(
            res.contentItems.map {
                ContentItemEntity(
                    id = it.id,
                    folderId = it.folderId,
                    type = it.type,
                    title = it.title,
                    textContent = it.textContent,
                    favorite = it.favorite,
                    shortcut = it.shortcut,
                    usageCount = it.usageCount,
                    syncedAt = System.currentTimeMillis(),
                )
            }
        )
    }

    suspend fun pushLocalChanges() {
        val token = authStore.token.first() ?: return
        val folders = folderDao.getAll()
        val items = contentDao.getRecent(500)
        val changes = folders.map { f ->
            SyncChange(
                entityType = "folder",
                entityId = f.id,
                operation = if (f.deletedAt != null) "delete" else "upsert",
                clientUpdatedAt = Instant.ofEpochMilli(f.updatedAt).toString(),
                payload = mapOf("name" to f.name, "sortOrder" to f.sortOrder.toString()),
            )
        } + items.map { c ->
            SyncChange(
                entityType = "content_item",
                entityId = c.id,
                operation = if (c.deletedAt != null) "delete" else "upsert",
                clientUpdatedAt = Instant.ofEpochMilli(c.updatedAt).toString(),
                payload = mapOf(
                    "type" to c.type,
                    "title" to c.title,
                    "textContent" to (c.textContent ?: ""),
                    "folderId" to (c.folderId ?: ""),
                    "favorite" to c.favorite.toString(),
                    "shortcut" to (c.shortcut ?: ""),
                    "usageCount" to c.usageCount.toString(),
                ),
            )
        }
        if (changes.isNotEmpty()) {
            api.push("Bearer $token", SyncPushRequest(deviceId = null, changes = changes))
        }
    }
}
