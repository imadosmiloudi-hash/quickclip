package com.quickclip.app.data.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.quickclip.app.data.entity.SequenceEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface SequenceDao {
    @Query("SELECT * FROM quick_sequences ORDER BY updatedAt DESC")
    fun observeAll(): Flow<List<SequenceEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(seq: SequenceEntity)

    @Query("DELETE FROM quick_sequences WHERE id = :id")
    suspend fun delete(id: String)
}
