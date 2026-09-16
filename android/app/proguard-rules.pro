-keepclassmembers class * {
  @com.squareup.moshi.FromJson <methods>;
  @com.squareup.moshi.ToJson <methods>;
}
-dontwarn okhttp3.**
-dontwarn retrofit2.**
