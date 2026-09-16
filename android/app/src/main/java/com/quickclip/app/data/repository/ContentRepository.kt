package com.quickclip.app.data.repository

import android.content.Context
import android.net.Uri
import com.quickclip.app.data.dao.ContentDao
import com.quickclip.app.data.dao.FolderDao
import com.quickclip.app.data.dao.SequenceDao
import com.quickclip.app.data.entity.ContentItemEntity
import com.quickclip.app.data.entity.FolderEntity
import com.quickclip.app.data.entity.SequenceEntity
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import java.io.File
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ContentRepository @Inject constructor(
    @ApplicationContext private val context: Context,
    private val folderDao: FolderDao,
    private val contentDao: ContentDao,
    private val sequenceDao: SequenceDao,
) {
    fun observeFolders(): Flow<List<FolderEntity>> = folderDao.observeAll()
    fun observeContent(
        type: String? = null,
        folderId: String? = null,
        favoritesOnly: Boolean = false,
        q: String? = null,
    ): Flow<List<ContentItemEntity>> =
        contentDao.observeFiltered(type, folderId, if (favoritesOnly) 1 else 0, q)

    fun observeFavorites(): Flow<List<ContentItemEntity>> = contentDao.observeFavorites()
    fun observeSequences(): Flow<List<SequenceEntity>> = sequenceDao.observeAll()

    suspend fun getContent(id: String) = contentDao.getById(id)
    suspend fun search(q: String) = contentDao.search(q)

    suspend fun addText(
        title: String,
        body: String,
        folderId: String? = null,
        shortcut: String? = null,
    ): ContentItemEntity {
        val item = ContentItemEntity(
            id = UUID.randomUUID().toString(),
            folderId = folderId,
            type = "text",
            title = title,
            textContent = body,
            shortcut = shortcut,
        )
        contentDao.upsert(item)
        return item
    }

    suspend fun importMedia(
        uri: Uri,
        type: String,
        title: String,
        mimeType: String?,
        folderId: String? = null,
    ): ContentItemEntity {
        val mediaDir = File(context.filesDir, "media").apply { mkdirs() }
        val ext = mimeType?.substringAfter('/')?.replace("jpeg", "jpg") ?: "bin"
        val dest = File(mediaDir, "${UUID.randomUUID()}.$ext")
        context.contentResolver.openInputStream(uri)?.use { input ->
            dest.outputStream().use { output -> input.copyTo(output) }
        } ?: error("Unable to read selected media")
        val item = ContentItemEntity(
            id = UUID.randomUUID().toString(),
            folderId = folderId,
            type = type,
            title = title,
            mimeType = mimeType,
            localPath = dest.absolutePath,
            sizeBytes = dest.length(),
        )
        contentDao.upsert(item)
        return item
    }

    suspend fun update(item: ContentItemEntity) = contentDao.update(item.copy(updatedAt = System.currentTimeMillis()))
    suspend fun softDelete(id: String) = contentDao.softDelete(id)
    suspend fun markUsed(id: String) = contentDao.markUsed(id)
    suspend fun toggleFavorite(id: String) {
        val item = contentDao.getById(id) ?: return
        contentDao.update(item.copy(favorite = !item.favorite, updatedAt = System.currentTimeMillis()))
    }

    suspend fun upsertFolder(name: String, sortOrder: Int = 0): FolderEntity {
        val f = FolderEntity(id = UUID.randomUUID().toString(), name = name, sortOrder = sortOrder)
        folderDao.upsert(f)
        return f
    }

    suspend fun saveSequence(title: String, stepsJson: String): SequenceEntity {
        val s = SequenceEntity(id = UUID.randomUUID().toString(), title = title, stepsJson = stepsJson)
        sequenceDao.upsert(s)
        return s
    }

    suspend fun seedIfEmpty() {
        if (contentDao.countActive() > 0) return
        val defaults = listOf(
            "Welcome", "Orders", "Follow Up", "Payment", "Products",
            "Customer Support", "Voice Messages", "Videos", "Images",
        )
        val folders = defaults.mapIndexed { i, name ->
            FolderEntity(id = UUID.randomUUID().toString(), name = name, sortOrder = i)
        }
        folderDao.upsertAll(folders)
        val byName = folders.associateBy { it.name }
        val demos = listOf(
            ContentItemEntity(
                id = UUID.randomUUID().toString(),
                folderId = byName["Welcome"]?.id,
                type = "text",
                title = "Welcome Customer (demo)",
                textContent = "Hello {name}! Welcome to our store. How can I help you today?",
                shortcut = "/welcome",
                favorite = true,
                isDemo = true,
            ),
            ContentItemEntity(
                id = UUID.randomUUID().toString(),
                folderId = byName["Products"]?.id,
                type = "text",
                title = "Price (demo)",
                textContent = "The price for {product} is {price}. Shipping available.",
                shortcut = "/price",
                favorite = true,
                isDemo = true,
            ),
            ContentItemEntity(
                id = UUID.randomUUID().toString(),
                folderId = byName["Payment"]?.id,
                type = "text",
                title = "Payment (demo)",
                textContent = "You can pay via bank transfer or cash on delivery. Reply with your preferred method.",
                shortcut = "/pay",
                isDemo = true,
            ),
            ContentItemEntity(
                id = UUID.randomUUID().toString(),
                folderId = byName["Follow Up"]?.id,
                type = "text",
                title = "Follow Up (demo)",
                textContent = "Just checking in — did you still want to proceed with your order?",
                shortcut = "/followup",
                isDemo = true,
            ),
            ContentItemEntity(
                id = UUID.randomUUID().toString(),
                folderId = byName["Orders"]?.id,
                type = "text",
                title = "Order Confirmation (demo)",
                textContent = "Your order #{order} is confirmed. Estimated delivery: {date}.",
                shortcut = "/order",
                isDemo = true,
            ),
            ContentItemEntity(
                id = UUID.randomUUID().toString(),
                folderId = byName["Voice Messages"]?.id,
                type = "voice",
                title = "Voice 01 (demo)",
                mimeType = "audio/mpeg",
                isDemo = true,
            ),
            ContentItemEntity(
                id = UUID.randomUUID().toString(),
                folderId = byName["Videos"]?.id,
                type = "video",
                title = "Product Video (demo)",
                mimeType = "video/mp4",
                isDemo = true,
            ),
            ContentItemEntity(
                id = UUID.randomUUID().toString(),
                folderId = byName["Images"]?.id,
                type = "image",
                title = "Product Catalog (demo)",
                mimeType = "image/jpeg",
                isDemo = true,
            ),
        )
        contentDao.upsertAll(demos)
        sequenceDao.upsert(
            SequenceEntity(
                id = UUID.randomUUID().toString(),
                title = "New customer welcome (demo)",
                stepsJson = """[{"type":"text","title":"Welcome"},{"type":"text","title":"Price"}]""",
            )
        )
    }
}
