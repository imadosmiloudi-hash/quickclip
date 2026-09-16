package com.quickclip.app

import com.quickclip.app.domain.model.ContentType
import org.junit.Assert.assertEquals
import org.junit.Test

class ContentTypeTest {
    @Test
    fun fromWireMapsKnownTypes() {
        assertEquals(ContentType.TEXT, ContentType.fromWire("text"))
        assertEquals(ContentType.VOICE, ContentType.fromWire("voice"))
        assertEquals(ContentType.VIDEO, ContentType.fromWire("video"))
        assertEquals(ContentType.IMAGE, ContentType.fromWire("image"))
    }

    @Test
    fun fromWireFallsBackToText() {
        assertEquals(ContentType.TEXT, ContentType.fromWire("unknown"))
    }
}
