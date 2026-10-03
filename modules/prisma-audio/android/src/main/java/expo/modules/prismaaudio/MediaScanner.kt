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
 * Short column names used by [AudioRowMapper], resolved once per cursor.
 * Kept separate (and pure) so a wrong key surfaces in unit tests instead
 * of silently mapping every row to defaults on a device.
 */
object CursorColumns {
  fun indexOf(getColumnIndex: (name: String) -> Int): Map<String, Int> = mapOf(
    "id" to getColumnIndex(MediaStore.Audio.Media._ID),
    "displayName" to getColumnIndex(MediaStore.Audio.Media.DISPLAY_NAME),
    "title" to getColumnIndex(MediaStore.Audio.Media.TITLE),
    "artist" to getColumnIndex(MediaStore.Audio.Media.ARTIST),
    "album" to getColumnIndex(MediaStore.Audio.Media.ALBUM),
    "albumId" to getColumnIndex(MediaStore.Audio.Media.ALBUM_ID),
    "duration" to getColumnIndex(MediaStore.Audio.Media.DURATION),
    "size" to getColumnIndex(MediaStore.Audio.Media.SIZE),
    "dateModified" to getColumnIndex(MediaStore.Audio.Media.DATE_MODIFIED),
    "mimeType" to getColumnIndex(MediaStore.Audio.Media.MIME_TYPE),
    "folder" to getColumnIndex(MediaStore.Audio.Media.RELATIVE_PATH),
  )
}

/**
 * Reads music files from MediaStore. Rows stream from one plain query (the
 * provider rejects SQL clauses such as LIMIT in the sort order); batching
 * for progress and cancellation happens while iterating.
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
    MediaStore.Audio.Media.RELATIVE_PATH,
  )

  fun count(): Int {
    resolver.query(audioUri, arrayOf(MediaStore.Audio.Media._ID), "${MediaStore.Audio.Media.IS_MUSIC} = 1", null, null)?.use {
      return it.count
    }
    return 0
  }

  fun scan(session: ScanSession, pageSize: Int, onBatch: (scanned: Int) -> Unit): List<ScannedTrack> {
    val tracks = mutableListOf<ScannedTrack>()
    val size = pageSize.coerceIn(50, 2000)
    var inBatch = 0
    resolver.query(audioUri, projection, "${MediaStore.Audio.Media.IS_MUSIC} = 1", null, "${MediaStore.Audio.Media._ID} ASC")?.use { cursor ->
      val index = CursorColumns.indexOf(cursor::getColumnIndex)
      while (cursor.moveToNext()) {
        session.throwIfCancelled()
        tracks.add(
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
        inBatch += 1
        if (inBatch >= size) {
          session.scanned.addAndGet(inBatch)
          onBatch(session.scanned.get())
          inBatch = 0
        }
      }
    }
    if (inBatch > 0) {
      session.scanned.addAndGet(inBatch)
      onBatch(session.scanned.get())
    }
    return tracks
  }
}
