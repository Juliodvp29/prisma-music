package expo.modules.prismaaudio

import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.concurrent.atomic.AtomicReference
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class PrismaAudioModule : Module() {
  private val greetingService = GreetingService()
  private val currentScan = AtomicReference<ScanSession?>(null)

  override fun definition() = ModuleDefinition {
    Name("PrismaAudio")

    Events("onGreeting", "onScanProgress")

    Function("hello") {
      greetingService.greeting()
    }

    OnStartObserving {
      sendEvent("onGreeting", mapOf("message" to greetingService.greeting()))
    }

    AsyncFunction("scanLibrary") { pageSize: Int, promise: Promise ->
      val context = appContext.reactContext ?: run {
        promise.reject("NO_CONTEXT", "React context is not available", null)
        return@AsyncFunction
      }
      val session = ScanSession()
      currentScan.set(session)
      val scanner = MediaScanner(context.contentResolver)
      val size = pageSize.coerceIn(50, 2000)
      appContext.backgroundCoroutineScope.launch(Dispatchers.IO) {
        try {
          val total = scanner.count()
          sendEvent("onScanProgress", mapOf("scanned" to 0, "total" to total))
          val tracks = scanner.scan(session, size) { scanned ->
            sendEvent("onScanProgress", mapOf("scanned" to scanned, "total" to total))
          }
          promise.resolve(tracks.map { it.toMap() })
        } catch (cancelled: ScanCancelled) {
          promise.reject("SCAN_CANCELLED", "Scan was cancelled", null)
        } catch (e: Exception) {
          promise.reject("SCAN_FAILED", e.message, e)
        } finally {
          currentScan.compareAndSet(session, null)
        }
      }
    }

    Function("cancelScan") {
      currentScan.get()?.cancel()
    }

    AsyncFunction("extractMetadata") { uri: String, artworkKey: String, promise: Promise ->
      val context = appContext.reactContext ?: run {
        promise.reject("NO_CONTEXT", "React context is not available", null)
        return@AsyncFunction
      }
      val extractor = MetadataExtractor(context)
      appContext.backgroundCoroutineScope.launch(Dispatchers.IO) {
        try {
          promise.resolve(extractor.extract(uri, artworkKey).toMap())
        } catch (e: Exception) {
          promise.reject("METADATA_FAILED", e.message, e)
        }
      }
    }
  }
}
