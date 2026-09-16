package com.quickclip.app.di

import android.content.Context
import androidx.room.Room
import com.quickclip.app.BuildConfig
import com.quickclip.app.data.dao.ContentDao
import com.quickclip.app.data.dao.FolderDao
import com.quickclip.app.data.dao.SequenceDao
import com.quickclip.app.data.db.QuickClipDatabase
import com.quickclip.app.sync.QuickClipApi
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {
    @Provides
    @Singleton
    fun provideDb(@ApplicationContext context: Context): QuickClipDatabase =
        Room.databaseBuilder(context, QuickClipDatabase::class.java, "quickclip.db")
            .fallbackToDestructiveMigration()
            .build()

    @Provides fun folderDao(db: QuickClipDatabase): FolderDao = db.folderDao()
    @Provides fun contentDao(db: QuickClipDatabase): ContentDao = db.contentDao()
    @Provides fun sequenceDao(db: QuickClipDatabase): SequenceDao = db.sequenceDao()

    @Provides
    @Singleton
    fun moshi(): Moshi = Moshi.Builder().add(KotlinJsonAdapterFactory()).build()

    @Provides
    @Singleton
    fun okHttp(): OkHttpClient {
        val log = HttpLoggingInterceptor().apply {
            level = if (BuildConfig.DEBUG) HttpLoggingInterceptor.Level.BASIC
            else HttpLoggingInterceptor.Level.NONE
        }
        return OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(60, TimeUnit.SECONDS)
            .addInterceptor(log)
            .build()
    }

    @Provides
    @Singleton
    fun api(client: OkHttpClient, moshi: Moshi): QuickClipApi {
        val base = "https://quickclip.up.railway.app/" // override via AuthStore / settings in app
        return Retrofit.Builder()
            .baseUrl(base)
            .client(client)
            .addConverterFactory(MoshiConverterFactory.create(moshi))
            .build()
            .create(QuickClipApi::class.java)
    }
}
