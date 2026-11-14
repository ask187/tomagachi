import UIKit
import Capacitor

/// Capacitor's web view controller, plus HabitPet's native plugin.
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(HabitPetNativePlugin())
    }
}
