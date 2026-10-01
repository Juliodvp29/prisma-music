package expo.modules.prismaaudio

import android.content.ContentResolver
import android.provider.MediaStore
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicInteger

class ScanCancelled : Exception("Scan cancelled")

/** Mutable state of one running scan. Plain JVM, no Android types. */
class ScanSession {
  private val cancelled = AtomicBoolean(false)
  val scanned = AtomicInteger(0)

  fun cancel() {
    cancelled.set(true)
  }

  fun throwIfCancelled() {
    if (cancelled.get()) {
      throw ScanCancelled()
    }
  }
}

/**
 * Reads music files from MediaStore in batches. Row mapping is delegated to
 * [AudioRowMapper]; this class owns only batching, progress and cancellation.
 */
class MediaScanner(private val resolver: ContentResolver) {
  private val audioUri = MediaStore.Audio.Media.EXTERNAL_CONTENT_URI

  private val projection = arrayOf(
    MediaStore.Audio.Media._ID,
    MediaStore.Audio.Media.DISPLAY_NAME,
    MediaStore.Audio.Media.TITLE,
    MediaStore.Audio.Media.ARTIST,
    MediaStore.Audio.Media.ALBUM,
    MediaStore.Audio.Media.ALBUM_ID,
    MediaStore.Audio.Media.DURATION,
    MediaStore.Audio.Media.SIZE,
    MediaStore.Audio.Media.DATE_MODIFIED,
    MediaStore.Audio.Media.MIME_TYPE,
  )

  fun count(): Int {
    resolver.query(audioUri, arrayOf(MediaStore.Audio.Media._ID), "${MediaStore.Audio.Media.IS_MUSIC} = 1", null, null)?.use {
      return it.count
    }
    return 0
  }

  fun scan(session: ScanSession, pageSize: Int, onBatch: (scanned: Int) -> Unit): List<ScannedTrack> {
    val tracks = mutableListOf<ScannedTrack>()
    var offset = 0
    while (true) {
      session.throwIfCancelled()
      val page = readPage(offset, pageSize)
      if (page.isEmpty()) {
        break
      }
      tracks.addAll(page)
      session.scanned.addAndGet(page.size)
      onBatch(session.scanned.get())
      if (page.size < pageSize) {
        break
      }
      offset += page.size
    }
    return tracks
  }

  private fun readPage(offset: Int, limit: Int): List<ScannedTrack> {
    val page = mutableListOf<ScannedTrack>()
    val sort = "${MediaStore.Audio.Media._ID} ASC LIMIT $limit OFFSET $offset"
    resolver.query(audioUri, projection, "${MediaStore.Audio.Media.IS_MUSIC} = 1", null, sort)?.use { cursor ->
      val index = projection.associateWith { cursor.getColumnIndex(it) }
      while (cursor.moveToNext()) {
        page.add(
          AudioRowMapper.map { column ->
            val columnIndex = index[column] ?: -1
            if (columnIndex < 0 || cursor.isNull(columnIndex)) {
              null
            } else {
              when (column) {
                "id", "albumId", "duration", "size", "dateModified" -> cursor.getLong(columnIndex)
                else -> cursor.getString(columnIndex)
              }
            }
          },
        )
      }
    }
    return page
  }
}
