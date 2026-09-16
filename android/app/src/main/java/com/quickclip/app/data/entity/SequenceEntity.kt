package com.quickclip.app.data.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "quick_sequences")
data class SequenceEntity(
    @PrimaryKey val id: String,
    val title: String,
    /** JSON array of step objects: {type, contentItemId, text?} */
    val stepsJson: String,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis(),
)
