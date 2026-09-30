package expo.modules.prismaaudio

import org.junit.Assert.assertEquals
import org.junit.Test

class GreetingServiceTest {
  @Test
  fun greetingReturnsModuleHello() {
    assertEquals("Hello from PrismaAudio", GreetingService().greeting())
  }
}
