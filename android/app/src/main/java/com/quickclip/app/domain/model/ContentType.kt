package com.quickclip.app.domain.model

enum class ContentType(val wire: String) {
    TEXT("text"),
    VOICE("voice"),
    VIDEO("video"),
    IMAGE("image");

    companion object {
        fun fromWire(value: String): ContentType =
            entries.firstOrNull { it.wire == value } ?: TEXT
    }
}
