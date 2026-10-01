package expo.modules.prismaaudio

data class TrackMetadata(
  val title: String?,
  val artist: String?,
  val album: String?,
  val albumArtist: String?,
  val genre: String?,
  val trackNumber: Int?,
  val discNumber: Int?,
  val year: Int?,
  val durationMs: Long,
  val bitrate: Int?,
  val sampleRate: Int?,
  val channelCount: Int?,
  val mimeType: String?,
  val artworkPath: String?,
) {
  fun toMap(): Map<String, Any?> = mapOf(
    "title" to title,
    "artist" to artist,
    "album" to album,
    "albumArtist" to albumArtist,
    "genre" to genre,
    "trackNumber" to trackNumber,
    "discNumber" to discNumber,
    "year" to year,
    "durationMs" to durationMs,
    "bitrate" to bitrate,
    "sampleRate" to sampleRate,
    "channelCount" to channelCount,
    "mimeType" to mimeType,
    "artworkPath" to artworkPath,
  )
}

/**
 * Maps raw retriever/extractor values onto [TrackMetadata]. Takes plain
 * values instead of Android classes so the mapping stays unit testable.
 */
object MetadataMapper {
  fun map(
    tags: Map<String, String?>,
    durationMs: Long,
    bitrate: Int?,
    sampleRate: Int?,
    channelCount: Int?,
    mimeType: String?,
    artworkPath: String?,
  ): TrackMetadata = TrackMetadata(
    title = tags["title"]?.ifEmpty { null },
    artist = tags["artist"]?.ifEmpty { null },
    album = tags["album"]?.ifEmpty { null },
    albumArtist = tags["albumArtist"]?.ifEmpty { null },
    genre = tags["genre"]?.ifEmpty { null },
    trackNumber = tags["track"]?.toTrackNumber(),
    discNumber = tags["disc"]?.toTrackNumber(),
    year = tags["year"]?.toIntOrNull(),
    durationMs = durationMs,
    bitrate = bitrate,
    sampleRate = sampleRate,
    channelCount = channelCount,
    mimeType = mimeType?.ifEmpty { null },
    artworkPath = artworkPath,
  )

  private fun String.toTrackNumber(): Int? = split("/").firstOrNull()?.toIntOrNull()

  /** Largest power-of-two downsample keeping both sides at or above [maxSize]. */
  fun sampleSize(width: Int, height: Int, maxSize: Int): Int {
    var size = 1
    while (width / (size * 2) >= maxSize && height / (size * 2) >= maxSize) {
      size *= 2
    }
    return size
  }
}
