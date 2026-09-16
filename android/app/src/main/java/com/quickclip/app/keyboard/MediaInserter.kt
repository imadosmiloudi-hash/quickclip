package com.quickclip.app.keyboard

import android.content.ClipDescription
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.view.inputmethod.EditorInfo
import android.view.inputmethod.InputConnection
import android.widget.Toast
import androidx.core.content.FileProvider
import androidx.core.view.inputmethod.EditorInfoCompat
import androidx.core.view.inputmethod.InputConnectionCompat
import androidx.core.view.inputmethod.InputContentInfoCompat
import com.quickclip.app.R
import java.io.File

object MediaInserter {
    fun insertOrShare(
        context: Context,
        ic: InputConnection?,
        editorInfo: EditorInfo?,
        localPath: String?,
        mimeType: String?,
        title: String,
    ): Boolean {
        if (localPath.isNullOrBlank()) {
            Toast.makeText(context, R.string.media_unsupported_toast, Toast.LENGTH_SHORT).show()
            return false
        }
        val file = File(localPath)
        if (!file.exists()) {
            Toast.makeText(context, R.string.media_unsupported_toast, Toast.LENGTH_SHORT).show()
            return false
        }
        val authority = context.packageName + ".fileprovider"
        val uri = FileProvider.getUriForFile(context, authority, file)
        val mime = mimeType ?: context.contentResolver.getType(uri) ?: "*/*"

        if (ic != null && editorInfo != null && supportsCommitContent(editorInfo, mime)) {
            val desc = ClipDescription(title, arrayOf(mime))
            val contentInfo = InputContentInfoCompat(uri, desc, null)
            val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N_MR1) {
                InputConnectionCompat.INPUT_CONTENT_GRANT_READ_URI_PERMISSION
            } else 0
            val ok = InputConnectionCompat.commitContent(ic, editorInfo, contentInfo, flags, null)
            if (ok) return true
        }

        Toast.makeText(context, R.string.media_unsupported_toast, Toast.LENGTH_SHORT).show()
        val share = Intent(Intent.ACTION_SEND).apply {
            type = mime
            putExtra(Intent.EXTRA_STREAM, uri)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(Intent.createChooser(share, title).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
        return false
    }

    private fun supportsCommitContent(editorInfo: EditorInfo, mime: String): Boolean {
        val types = EditorInfoCompat.getContentMimeTypes(editorInfo) ?: return false
        if (types.isEmpty()) return false
        return types.any { ClipDescription.compareMimeTypes(mime, it) || it == "*/*" }
    }
}
