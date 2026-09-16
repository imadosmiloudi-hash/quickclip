package com.quickclip.app.data.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "content_items",
    foreignKeys = [
        ForeignKey(
            entity = FolderEntity::class,
            parentColumns = ["id"],
            childColumns = ["folderId"],
            onDelete = ForeignKey.SET_NULL,
        )
    ],
    indices = [
        Index("folderId"),
        Index("type"),
        Index("favorite"),
        Index("createdAt"),
        Index("updatedAt"),
        Index("shortcut"),
        Index("lastUsedAt"),
    ]
)
data class ContentItemEntity(
    @PrimaryKey val id: String,
    val folderId: String? = null,
    val type: String, // text | voice | video | image
    val title: String,
    val textContent: String? = null,
    val mimeType: String? = null,
    val localPath: String? = null,
    val thumbnailPath: String? = null,
    val remoteFileRef: String? = null,
    val durationMs: Int? = null,
    val sizeBytes: Long? = null,
    val shortcut: String? = null,
    val favorite: Boolean = false,
    val usageCount: Int = 0,
    val lastUsedAt: Long? = null,
    val isDemo: Boolean = false,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis(),
    val deletedAt: Long? = null,
    val syncedAt: Long? = null,
)
