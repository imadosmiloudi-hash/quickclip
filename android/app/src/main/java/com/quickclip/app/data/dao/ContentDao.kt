package com.quickclip.app.data.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.quickclip.app.data.entity.ContentItemEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface ContentDao {
    @Query(
        """
        SELECT * FROM content_items
        WHERE deletedAt IS NULL
          AND (:type IS NULL OR type = :type)
          AND (:folderId IS NULL OR folderId = :folderId)
          AND (:favoritesOnly = 0 OR favorite = 1)
          AND (
            :q IS NULL OR :q = '' OR
            title LIKE '%' || :q || '%' OR
            IFNULL(textContent,'') LIKE '%' || :q || '%' OR
            IFNULL(shortcut,'') LIKE '%' || :q || '%'
          )
        ORDER BY favorite DESC, updatedAt DESC
        """
    )
    fun observeFiltered(
        type: String?,
        folderId: String?,
        favoritesOnly: Int,
        q: String?,
    ): Flow<List<ContentItemEntity>>

    @Query("SELECT * FROM content_items WHERE deletedAt IS NULL AND favorite = 1 ORDER BY updatedAt DESC LIMIT :limit")
    fun observeFavorites(limit: Int = 50): Flow<List<ContentItemEntity>>

    @Query("SELECT * FROM content_items WHERE deletedAt IS NULL ORDER BY updatedAt DESC LIMIT :limit")
    suspend fun getRecent(limit: Int = 100): List<ContentItemEntity>

    @Query("SELECT * FROM content_items WHERE id = :id AND deletedAt IS NULL LIMIT 1")
    suspend fun getById(id: String): ContentItemEntity?

    @Query(
        """
        SELECT * FROM content_items
        WHERE deletedAt IS NULL
          AND (
            :q IS NULL OR :q = '' OR
            title LIKE '%' || :q || '%' OR
            IFNULL(textContent,'') LIKE '%' || :q || '%' OR
            IFNULL(shortcut,'') LIKE '%' || :q || '%'
          )
        ORDER BY favorite DESC, usageCount DESC
        LIMIT :limit
        """
    )
    suspend fun search(q: String?, limit: Int = 40): List<ContentItemEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(item: ContentItemEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertAll(items: List<ContentItemEntity>)

    @Update
    suspend fun update(item: ContentItemEntity)

    @Query(
        """
        UPDATE content_items
        SET usageCount = usageCount + 1, lastUsedAt = :now, updatedAt = :now
        WHERE id = :id
        """
    )
    suspend fun markUsed(id: String, now: Long = System.currentTimeMillis())

    @Query("UPDATE content_items SET deletedAt = :now, updatedAt = :now WHERE id = :id")
    suspend fun softDelete(id: String, now: Long = System.currentTimeMillis())

    @Query("SELECT COUNT(*) FROM content_items WHERE deletedAt IS NULL")
    suspend fun countActive(): Int
}
