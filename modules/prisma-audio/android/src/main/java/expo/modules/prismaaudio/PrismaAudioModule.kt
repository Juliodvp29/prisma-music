package expo.modules.prismaaudio

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class PrismaAudioModule : Module() {
  private val greetingService = GreetingService()

  override fun definition() = ModuleDefinition {
    Name("PrismaAudio")

    Events("onGreeting")

    Function("hello") {
      greetingService.greeting()
    }

    OnStartObserving {
      sendEvent("onGreeting", mapOf("message" to greetingService.greeting()))
    }
  }
}
