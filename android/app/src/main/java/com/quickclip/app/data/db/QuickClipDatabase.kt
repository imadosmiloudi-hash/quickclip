package com.quickclip.app.data.db

import androidx.room.Database
import androidx.room.RoomDatabase
import com.quickclip.app.data.dao.ContentDao
import com.quickclip.app.data.dao.FolderDao
import com.quickclip.app.data.dao.SequenceDao
import com.quickclip.app.data.entity.ContentItemEntity
import com.quickclip.app.data.entity.FolderEntity
import com.quickclip.app.data.entity.SequenceEntity

@Database(
    entities = [FolderEntity::class, ContentItemEntity::class, SequenceEntity::class],
    version = 1,
    exportSchema = true,
)
abstract class QuickClipDatabase : RoomDatabase() {
    abstract fun folderDao(): FolderDao
    abstract fun contentDao(): ContentDao
    abstract fun sequenceDao(): SequenceDao
}
