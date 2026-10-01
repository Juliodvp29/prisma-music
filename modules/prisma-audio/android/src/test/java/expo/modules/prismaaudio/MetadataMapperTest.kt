package expo.modules.prismaaudio

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class MetadataMapperTest {
  @Test
  fun mapsTagsAndFormat() {
    val metadata = MetadataMapper.map(
      tags = mapOf(
        "title" to "Track",
        "artist" to "Artist",
        "album" to "Album",
        "albumArtist" to "Album Artist",
        "genre" to "Rock",
        "track" to "3/12",
        "disc" to "1/2",
        "year" to "2021",
        "duration" to "180000",
      ),
      durationMs = 180000L,
      bitrate = 320000,
      sampleRate = 44100,
      channelCount = 2,
      mimeType = "audio/mpeg",
      artworkPath = "/cache/artwork/7.jpg",
    )

    assertEquals("Track", metadata.title)
    assertEquals(3, metadata.trackNumber)
    assertEquals(1, metadata.discNumber)
    assertEquals(2021, metadata.year)
    assertEquals(44100, metadata.sampleRate)
    assertEquals("/cache/artwork/7.jpg", metadata.artworkPath)
  }

  @Test
  fun blanksBecomeNull() {
    val metadata = MetadataMapper.map(
      tags = mapOf("title" to "", "year" to "not-a-year"),
      durationMs = 0L,
      bitrate = null,
      sampleRate = null,
      channelCount = null,
      mimeType = null,
      artworkPath = null,
    )

    assertNull(metadata.title)
    assertNull(metadata.artist)
    assertNull(metadata.year)
    assertNull(metadata.bitrate)
    assertNull(metadata.artworkPath)
  }

  @Test
  fun computesPowerOfTwoSampleSize() {
    assertEquals(4, MetadataMapper.sampleSize(2048, 2048, 512))
    assertEquals(2, MetadataMapper.sampleSize(1200, 1400, 512))
    assertEquals(1, MetadataMapper.sampleSize(400, 400, 512))
  }
}
