package com.quickclip.app.ui.library

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.outlined.StarBorder
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.AssistChip
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.quickclip.app.R

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LibraryScreen(
    onOpenSettings: () -> Unit,
    viewModel: LibraryViewModel = hiltViewModel(),
) {
    val items by viewModel.items.collectAsState()
    val folders by viewModel.folders.collectAsState()
    val filter by viewModel.filterState.collectAsState()
    var showAdd by remember { mutableStateOf(false) }
    var title by remember { mutableStateOf("") }
    var body by remember { mutableStateOf("") }
    val context = LocalContext.current

    val importLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.OpenDocument()
    ) { uri: Uri? ->
        if (uri != null) {
            val mime = context.contentResolver.getType(uri)
            viewModel.importMedia(uri, mime)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.library)) },
                actions = {
                    TextButton(onClick = onOpenSettings) { Text(stringResource(R.string.settings)) }
                },
            )
        },
        floatingActionButton = {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                FloatingActionButton(onClick = {
                    importLauncher.launch(arrayOf("image/*", "audio/*", "video/*"))
                }) { Text("📎") }
                FloatingActionButton(onClick = { showAdd = true }) {
                    Icon(Icons.Default.Add, contentDescription = stringResource(R.string.add_text))
                }
            }
        },
    ) { padding ->
        Column(Modifier.fillMaxSize().padding(padding).padding(12.dp)) {
            OutlinedTextField(
                value = filter.query,
                onValueChange = viewModel::setQuery,
                modifier = Modifier.fillMaxWidth(),
                placeholder = { Text(stringResource(R.string.search)) },
                singleLine = true,
            )
            Row(Modifier.horizontalScroll(rememberScrollState()).padding(vertical = 8.dp)) {
                AssistChip(onClick = { viewModel.setType(null) }, label = { Text(stringResource(R.string.filter_all)) })
                AssistChip(onClick = { viewModel.setType("text") }, label = { Text(stringResource(R.string.filter_text)) })
                AssistChip(onClick = { viewModel.setType("voice") }, label = { Text(stringResource(R.string.filter_voice)) })
                AssistChip(onClick = { viewModel.setType("video") }, label = { Text(stringResource(R.string.filter_video)) })
                AssistChip(onClick = { viewModel.setType("image") }, label = { Text(stringResource(R.string.filter_image)) })
                AssistChip(onClick = { viewModel.setFavoritesOnly(true) }, label = { Text(stringResource(R.string.favorites)) })
            }
            Row(Modifier.horizontalScroll(rememberScrollState())) {
                AssistChip(onClick = { viewModel.setFolder(null) }, label = { Text(stringResource(R.string.folders)) })
                folders.forEach { f ->
                    AssistChip(onClick = { viewModel.setFolder(f.id) }, label = { Text(f.name) })
                }
            }
            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.padding(top = 8.dp)) {
                items(items, key = { it.id }) { item ->
                    Row(
                        Modifier.fillMaxWidth().clickable { }.padding(8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                    ) {
                        Column(Modifier.weight(1f)) {
                            Text(item.title)
                            val demo = if (item.isDemo) " · ${stringResource(R.string.demo_badge)}" else ""
                            Text("${item.type}$demo · ×${item.usageCount}")
                            item.textContent?.take(80)?.let { Text(it) }
                        }
                        IconButton(onClick = { viewModel.toggleFavorite(item.id) }) {
                            Icon(
                                if (item.favorite) Icons.Filled.Star else Icons.Outlined.StarBorder,
                                contentDescription = null,
                            )
                        }
                        TextButton(onClick = { viewModel.delete(item.id) }) { Text("🗑") }
                    }
                }
            }
        }
    }

    if (showAdd) {
        AlertDialog(
            onDismissRequest = { showAdd = false },
            confirmButton = {
                TextButton(onClick = {
                    viewModel.addText(title.ifBlank { "Untitled" }, body, filter.folderId)
                    title = ""; body = ""; showAdd = false
                }) { Text(stringResource(R.string.done)) }
            },
            dismissButton = { TextButton(onClick = { showAdd = false }) { Text(stringResource(R.string.skip)) } },
            title = { Text(stringResource(R.string.add_text)) },
            text = {
                Column {
                    OutlinedTextField(value = title, onValueChange = { title = it }, label = { Text("Title") })
                    OutlinedTextField(value = body, onValueChange = { body = it }, label = { Text("Body") })
                }
            },
        )
    }
}
