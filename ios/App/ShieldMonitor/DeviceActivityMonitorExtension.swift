import DeviceActivity
import ManagedSettings

// Background extension: re-applies HabitPet's shield when an unlock window
// (recovery mission, credits, override, approved emergency) ends — even if the
// HabitPet app is closed. Create the target in Xcode with
// File ▸ New ▸ Target ▸ "Device Activity Monitor Extension", name it
// ShieldMonitor, replace its generated Swift file with this one, and add
// App/ShieldStore.swift to the target. See docs/IOS_SETUP.md.
//
// UNTESTED SCAFFOLD.

class DeviceActivityMonitorExtension: DeviceActivityMonitor {
    override func intervalDidEnd(for activity: DeviceActivityName) {
        super.intervalDidEnd(for: activity)
        guard activity == ShieldStore.unlockActivity else { return }
        ShieldStore.relockAt = nil
        if ShieldStore.wanted { ShieldStore.apply() }
    }
}
