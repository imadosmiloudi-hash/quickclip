package com.quickclip.app.sync

import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class AuthRequest(val email: String, val password: String, val displayName: String? = null)

@JsonClass(generateAdapter = true)
data class AuthResponse(val token: String, val user: ApiUser)

@JsonClass(generateAdapter = true)
data class ApiUser(val id: String, val email: String, val displayName: String?)

@JsonClass(generateAdapter = true)
data class FoldersResponse(val folders: List<ApiFolder>)

@JsonClass(generateAdapter = true)
data class ApiFolder(
    val id: String,
    val name: String,
    val sortOrder: Int? = 0,
)

@JsonClass(generateAdapter = true)
data class ContentListResponse(val items: List<ApiContent>)

@JsonClass(generateAdapter = true)
data class ApiContent(
    val id: String,
    val type: String,
    val title: String,
    val textContent: String? = null,
    val folderId: String? = null,
    val favorite: Boolean = false,
    val shortcut: String? = null,
    val usageCount: Int = 0,
)

@JsonClass(generateAdapter = true)
data class SyncPullResponse(
    val serverTime: String,
    val folders: List<ApiFolder>,
    val contentItems: List<ApiContent>,
)

@JsonClass(generateAdapter = true)
data class SyncPushRequest(
    val deviceId: String?,
    val changes: List<SyncChange>,
)

@JsonClass(generateAdapter = true)
data class SyncChange(
    val entityType: String,
    val entityId: String,
    val operation: String,
    val clientUpdatedAt: String?,
    val payload: Map<String, String>?,
)

@JsonClass(generateAdapter = true)
data class SyncPushResponse(
    val applied: Int? = null,
    val ids: List<String>? = null,
    val serverTime: String? = null,
)
