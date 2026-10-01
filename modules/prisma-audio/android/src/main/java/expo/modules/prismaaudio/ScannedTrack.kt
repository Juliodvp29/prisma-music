package expo.modules.prismaaudio

data class ScannedTrack(
  val deviceId: Long,
  val uri: String,
  val displayName: String,
  val title: String,
  val artist: String,
  val album: String,
  val albumId: Long,
  val durationMs: Long,
  val sizeBytes: Long,
  val dateModified: Long,
  val mimeType: String,
) {
  fun toMap(): Map<String, Any> = mapOf(
    "deviceId" to deviceId,
    "uri" to uri,
    "displayName" to displayName,
    "title" to title,
    "artist" to artist,
    "album" to album,
    "albumId" to albumId,
    "durationMs" to durationMs,
    "sizeBytes" to sizeBytes,
    "dateModified" to dateModified,
    "mimeType" to mimeType,
  )
}

/**
 * Maps one MediaStore row onto a [ScannedTrack]. Takes a plain column reader
 * instead of a Cursor so the mapping stays unit testable without Android.
 */
object AudioRowMapper {
  fun map(get: (column: String) -> Any?): ScannedTrack {
    val deviceId = (get("id") as? Number)?.toLong() ?: 0L
    val displayName = get("displayName") as? String ?: ""
    return ScannedTrack(
      deviceId = deviceId,
      uri = "content://media/external/audio/media/$deviceId",
      displayName = displayName,
      title = (get("title") as? String).orEmpty().ifEmpty { displayName },
      artist = (get("artist") as? String).orEmpty().ifEmpty { "Unknown artist" },
      album = (get("album") as? String).orEmpty().ifEmpty { "Unknown album" },
      albumId = (get("albumId") as? Number)?.toLong() ?: 0L,
      durationMs = (get("duration") as? Number)?.toLong() ?: 0L,
      sizeBytes = (get("size") as? Number)?.toLong() ?: 0L,
      dateModified = (get("dateModified") as? Number)?.toLong() ?: 0L,
      mimeType = get("mimeType") as? String ?: "",
    )
  }
}
