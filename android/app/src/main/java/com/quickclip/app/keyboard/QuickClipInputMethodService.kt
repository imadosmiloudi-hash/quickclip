package com.quickclip.app.keyboard

import android.inputmethodservice.InputMethodService
import android.view.View
import android.view.inputmethod.EditorInfo
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.quickclip.app.R
import com.quickclip.app.data.entity.ContentItemEntity
import com.quickclip.app.data.repository.ContentRepository
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint
class QuickClipInputMethodService : InputMethodService() {
    @Inject lateinit var contentRepository: ContentRepository

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
    private var collectJob: Job? = null
    private var showingContent = true
    private var filterType: String? = null
    private lateinit var adapter: ContentListAdapter
    private var contentPanel: View? = null
    private var qwertyPanel: LinearLayout? = null
    private var searchField: EditText? = null

    override fun onCreateInputView(): View {
        val root = layoutInflater.inflate(R.layout.keyboard_view, null)
        contentPanel = root.findViewById(R.id.content_panel)
        qwertyPanel = root.findViewById(R.id.qwerty_panel)
        searchField = root.findViewById(R.id.search_field)
        val list = root.findViewById<RecyclerView>(R.id.content_list)
        val tabs = root.findViewById<LinearLayout>(R.id.type_tabs)

        adapter = ContentListAdapter { item -> onItemSelected(item) }
        list.layoutManager = LinearLayoutManager(this)
        list.adapter = adapter

        root.findViewById<Button>(R.id.btn_mode_quickclip).setOnClickListener {
            showingContent = true
            updatePanels()
        }
        root.findViewById<Button>(R.id.btn_mode_keyboard).setOnClickListener {
            showingContent = false
            updatePanels()
        }

        tabs.removeAllViews()
        listOf(
            R.string.filter_all to null,
            R.string.filter_text to "text",
            R.string.filter_voice to "voice",
            R.string.filter_video to "video",
            R.string.filter_image to "image",
            R.string.favorites to "__fav__",
        ).forEach { (labelRes, type) ->
            val b = Button(this).apply {
                text = getString(labelRes)
                isAllCaps = false
                setOnClickListener {
                    filterType = type
                    bindList(searchField?.text?.toString().orEmpty())
                }
            }
            tabs.addView(b)
        }

        searchField?.setOnEditorActionListener { v, _, _ ->
            bindList(v.text?.toString().orEmpty())
            true
        }

        buildQwerty(qwertyPanel!!)
        updatePanels()
        bindList("")
        return root
    }

    private fun updatePanels() {
        contentPanel?.visibility = if (showingContent) View.VISIBLE else View.GONE
        qwertyPanel?.visibility = if (showingContent) View.GONE else View.VISIBLE
    }

    private fun bindList(query: String) {
        collectJob?.cancel()
        collectJob = scope.launch {
            val favOnly = filterType == "__fav__"
            val type = filterType?.takeIf { it != "__fav__" }
            contentRepository.observeContent(
                type = type,
                favoritesOnly = favOnly,
                q = query.ifBlank { null },
            ).collectLatest { items ->
                adapter.submit(items)
            }
        }
    }

    private fun onItemSelected(item: ContentItemEntity) {
        scope.launch { contentRepository.markUsed(item.id) }
        val ic = currentInputConnection
        when (item.type) {
            "text" -> {
                val text = item.textContent.orEmpty()
                ic?.commitText(text, 1)
            }
            else -> {
                MediaInserter.insertOrShare(
                    context = this,
                    ic = ic,
                    editorInfo = currentInputEditorInfo,
                    localPath = item.localPath,
                    mimeType = item.mimeType,
                    title = item.title,
                )
            }
        }
    }

    private fun buildQwerty(panel: LinearLayout) {
        panel.removeAllViews()
        val rows = listOf(
            "qwertyuiop",
            "asdfghjkl",
            "zxcvbnm",
        )
        rows.forEach { row ->
            val rowLayout = LinearLayout(this).apply {
                orientation = LinearLayout.HORIZONTAL
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    0,
                    1f,
                )
            }
            row.forEach { ch ->
                val key = Button(this).apply {
                    text = ch.toString()
                    layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.MATCH_PARENT, 1f)
                    setOnClickListener { currentInputConnection?.commitText(ch.toString(), 1) }
                }
                rowLayout.addView(key)
            }
            panel.addView(rowLayout)
        }
        val bottom = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                0,
                1f,
            )
        }
        val space = Button(this).apply {
            text = "space"
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.MATCH_PARENT, 3f)
            setOnClickListener { currentInputConnection?.commitText(" ", 1) }
        }
        val back = Button(this).apply {
            text = "⌫"
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.MATCH_PARENT, 1f)
            setOnClickListener {
                currentInputConnection?.deleteSurroundingText(1, 0)
            }
        }
        val enter = Button(this).apply {
            text = "⏎"
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.MATCH_PARENT, 1f)
            setOnClickListener {
                currentInputConnection?.performEditorAction(EditorInfo.IME_ACTION_DONE)
            }
        }
        bottom.addView(space)
        bottom.addView(back)
        bottom.addView(enter)
        panel.addView(bottom)
    }

    override fun onDestroy() {
        collectJob?.cancel()
        scope.cancel()
        super.onDestroy()
    }
}
