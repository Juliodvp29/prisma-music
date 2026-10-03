package expo.modules.prismaaudio

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class AudioRowMapperTest {
  @Test
  fun mapsFullRow() {
    val row = mapOf(
      "id" to 42L,
      "displayName" to "track.mp3",
      "title" to "Track",
      "artist" to "Artist",
      "album" to "Album",
      "albumId" to 7L,
      "duration" to 180000L,
      "size" to 4096L,
      "dateModified" to 1700000000L,
      "mimeType" to "audio/mpeg",
    )

    val track = AudioRowMapper.map { row[it] }

    assertEquals(42L, track.deviceId)
    assertEquals("content://media/external/audio/media/42", track.uri)
    assertEquals("Track", track.title)
    assertEquals(180000L, track.durationMs)
    assertEquals(mapOf(
      "deviceId" to 42L,
      "uri" to "content://media/external/audio/media/42",
      "displayName" to "track.mp3",
      "title" to "Track",
      "artist" to "Artist",
      "album" to "Album",
      "albumId" to 7L,
      "durationMs" to 180000L,
      "sizeBytes" to 4096L,
      "dateModified" to 1700000000L,
      "mimeType" to "audio/mpeg",
    ), track.toMap())
  }

  @Test
  fun fillsDefaultsForMissingColumns() {
    val track = AudioRowMapper.map { null }

    assertEquals(0L, track.deviceId)
    assertEquals("", track.title)
    assertEquals("Unknown artist", track.artist)
    assertEquals("Unknown album", track.album)
    assertEquals(0L, track.durationMs)
  }

  @Test
  fun treatsMediaStoreUnknownAsMissing() {
    val track = AudioRowMapper.map {
      when (it) {
        "artist" -> "<unknown>"
        "album" -> "<unknown>"
        else -> null
      }
    }

    assertEquals("Unknown artist", track.artist)
    assertEquals("Unknown album", track.album)
  }
}

class CursorColumnsTest {
  @Test
  fun resolvesEveryMapperKey() {
    val names = listOf(
      "_id",
      "_display_name",
      "title",
      "artist",
      "album",
      "album_id",
      "duration",
      "_size",
      "date_modified",
      "mime_type",
    )

    val index = CursorColumns.indexOf { names.indexOf(it) }

    assertEquals(
      setOf(
        "id",
        "displayName",
        "title",
        "artist",
        "album",
        "albumId",
        "duration",
        "size",
        "dateModified",
        "mimeType",
      ),
      index.keys,
    )
    assertEquals((0..9).toSet(), index.values.toSet())
  }
}

class ScanSessionTest {  @Test
  fun cancelStopsTheScan() {
    val session = ScanSession()

    var stopped = false
    try {
      session.cancel()
      session.throwIfCancelled()
    } catch (cancelled: ScanCancelled) {
      stopped = true
    }

    assertTrue(stopped)
  }

  @Test
  fun countsScannedRows() {
    val session = ScanSession()

    session.scanned.addAndGet(500)

    assertEquals(500, session.scanned.get())
  }
}
