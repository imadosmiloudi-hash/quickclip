package com.quickclip.app.ui.library

import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.quickclip.app.data.entity.ContentItemEntity
import com.quickclip.app.data.entity.FolderEntity
import com.quickclip.app.data.repository.ContentRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

data class LibraryFilter(
    val type: String? = null,
    val folderId: String? = null,
    val favoritesOnly: Boolean = false,
    val query: String = "",
)

@HiltViewModel
class LibraryViewModel @Inject constructor(
    private val repo: ContentRepository,
) : ViewModel() {
    private val filter = MutableStateFlow(LibraryFilter())
    val folders: StateFlow<List<FolderEntity>> =
        repo.observeFolders().stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    @OptIn(ExperimentalCoroutinesApi::class)
    val items: StateFlow<List<ContentItemEntity>> =
        filter.flatMapLatest { f ->
            repo.observeContent(
                type = f.type,
                folderId = f.folderId,
                favoritesOnly = f.favoritesOnly,
                q = f.query.ifBlank { null },
            )
        }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    val filterState: StateFlow<LibraryFilter> = filter

    fun setQuery(q: String) { filter.value = filter.value.copy(query = q) }
    fun setType(type: String?) { filter.value = filter.value.copy(type = type, favoritesOnly = false) }
    fun setFolder(id: String?) { filter.value = filter.value.copy(folderId = id) }
    fun setFavoritesOnly(v: Boolean) { filter.value = filter.value.copy(favoritesOnly = v, type = null) }

    fun addText(title: String, body: String, folderId: String?) {
        viewModelScope.launch { repo.addText(title, body, folderId) }
    }

    fun importMedia(uri: Uri, mime: String?) {
        viewModelScope.launch {
            val type = when {
                mime?.startsWith("audio") == true -> "voice"
                mime?.startsWith("video") == true -> "video"
                else -> "image"
            }
            repo.importMedia(uri, type, "Imported media", mime, filter.value.folderId)
        }
    }

    fun toggleFavorite(id: String) {
        viewModelScope.launch { repo.toggleFavorite(id) }
    }

    fun delete(id: String) {
        viewModelScope.launch { repo.softDelete(id) }
    }
}
