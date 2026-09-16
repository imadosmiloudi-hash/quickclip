package com.quickclip.app.sync

import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.Query

interface QuickClipApi {
    @POST("auth/register")
    suspend fun register(@Body body: AuthRequest): AuthResponse

    @POST("auth/login")
    suspend fun login(@Body body: AuthRequest): AuthResponse

    @GET("folders")
    suspend fun folders(@Header("Authorization") bearer: String): FoldersResponse

    @GET("content")
    suspend fun content(@Header("Authorization") bearer: String): ContentListResponse

    @GET("sync/pull")
    suspend fun pull(
        @Header("Authorization") bearer: String,
        @Query("since") since: String?,
    ): SyncPullResponse

    @POST("sync/push")
    suspend fun push(
        @Header("Authorization") bearer: String,
        @Body body: SyncPushRequest,
    ): SyncPushResponse
}
