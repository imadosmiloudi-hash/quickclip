package com.quickclip.app

import com.quickclip.app.ui.library.LibraryFilter
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class LibraryFilterTest {
    @Test
    fun copyPreservesQuery() {
        val f = LibraryFilter(query = "welcome", type = "text")
        val next = f.copy(favoritesOnly = true, type = null)
        assertEquals("welcome", next.query)
        assertTrue(next.favoritesOnly)
    }
}
