package expo.modules.prismaaudio

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.media.MediaExtractor
import android.media.MediaFormat
import android.media.MediaMetadataRetriever
import android.net.Uri
import java.io.File
import java.io.FileOutputStream

/**
 * Reads tags, stream format and embedded artwork for one audio uri.
 * Artwork is downsampled and cached under the app cache directory.
 */
class MetadataExtractor(private val context: Context) {
  companion object {
    const val ARTWORK_MAX_SIZE = 512
  }

  fun extract(uri: String, artworkKey: String): TrackMetadata {
    val parsed = Uri.parse(uri)
    val tags = readTags(parsed)
    val format = readFormat(parsed)
    val artworkPath = readArtwork(parsed, artworkKey)
    return MetadataMapper.map(
      tags = tags,
      durationMs = tags["duration"]?.toLongOrNull() ?: 0L,
      bitrate = format.bitrate,
      sampleRate = format.sampleRate,
      channelCount = format.channelCount,
      mimeType = format.mimeType,
      artworkPath = artworkPath,
    )
  }

  private fun readTags(uri: Uri): Map<String, String?> {
    val retriever = MediaMetadataRetriever()
    try {
      retriever.setDataSource(context, uri)
      return mapOf(
        "title" to retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_TITLE),
        "artist" to retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_ARTIST),
        "album" to retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_ALBUM),
        "albumArtist" to retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_ALBUMARTIST),
        "genre" to retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_GENRE),
        "track" to retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_CD_TRACK_NUMBER),
        "disc" to retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DISC_NUMBER),
        "year" to (retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_YEAR)
          ?: retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DATE)),
        "duration" to retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION),
      )
    } finally {
      retriever.release()
    }
  }

  private data class StreamFormat(
    val bitrate: Int?,
    val sampleRate: Int?,
    val channelCount: Int?,
    val mimeType: String?,
  )

  private fun readFormat(uri: Uri): StreamFormat {
    val extractor = MediaExtractor()
    try {
      extractor.setDataSource(context, uri, null)
      for (index in 0 until extractor.trackCount) {
        val format = extractor.getTrackFormat(index)
        val mime = format.getString(MediaFormat.KEY_MIME) ?: continue
        if (!mime.startsWith("audio/")) {
          continue
        }
        return StreamFormat(
          bitrate = format.intOrNull(MediaFormat.KEY_BIT_RATE),
          sampleRate = format.intOrNull(MediaFormat.KEY_SAMPLE_RATE),
          channelCount = format.intOrNull(MediaFormat.KEY_CHANNEL_COUNT),
          mimeType = mime,
        )
      }
      return StreamFormat(null, null, null, null)
    } finally {
      extractor.release()
    }
  }

  private fun MediaFormat.intOrNull(key: String): Int? =
    if (containsKey(key)) getInteger(key) else null

  private fun readArtwork(uri: Uri, artworkKey: String): String? {
    val cached = artworkFile(artworkKey)
    if (cached.exists()) {
      return cached.absolutePath
    }
    val retriever = MediaMetadataRetriever()
    try {
      retriever.setDataSource(context, uri)
      val picture = retriever.embeddedPicture ?: return null
      val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
      BitmapFactory.decodeByteArray(picture, 0, picture.size, bounds)
      val options = BitmapFactory.Options().apply {
        inSampleSize = MetadataMapper.sampleSize(bounds.outWidth, bounds.outHeight, ARTWORK_MAX_SIZE)
      }
      val bitmap = BitmapFactory.decodeByteArray(picture, 0, picture.size, options) ?: return null
      try {
        FileOutputStream(cached).use { out ->
          bitmap.compress(Bitmap.CompressFormat.JPEG, 85, out)
        }
      } finally {
        bitmap.recycle()
      }
      return cached.absolutePath
    } finally {
      retriever.release()
    }
  }

  private fun artworkFile(artworkKey: String): File {
    val safe = artworkKey.replace(Regex("[^A-Za-z0-9_-]"), "_")
    return File(File(context.cacheDir, "artwork"), "$safe.jpg")
  }
}
