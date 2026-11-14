import Foundation
import FamilyControls
import ManagedSettings
import DeviceActivity

// Shared between the app and the ShieldMonitor extension (add this file to
// BOTH targets). Holds the user's picked apps and applies/clears the shield.
//
// UNTESTED SCAFFOLD: written without a Mac. See docs/IOS_SETUP.md.

enum ShieldStore {
    /// Must match the App Group enabled on both targets in Xcode.
    static let appGroup = "group.com.example.habitpet"
    static let unlockActivity = DeviceActivityName("habitpet.unlock")

    static var defaults: UserDefaults { UserDefaults(suiteName: appGroup) ?? .standard }
    private static let store = ManagedSettingsStore()

    // MARK: selection (what the user picked in Apple's app picker)

    static func loadSelection() -> FamilyActivitySelection {
        guard let data = defaults.data(forKey: "selection"),
              let sel = try? JSONDecoder().decode(FamilyActivitySelection.self, from: data) else {
            return FamilyActivitySelection()
        }
        return sel
    }

    static func saveSelection(_ sel: FamilyActivitySelection) {
        if let data = try? JSONEncoder().encode(sel) { defaults.set(data, forKey: "selection") }
    }

    static func encode(_ token: ApplicationToken) -> String? {
        (try? JSONEncoder().encode(token)).map { $0.base64EncodedString() }
    }

    static func decode(_ s: String) -> ApplicationToken? {
        guard let data = Data(base64Encoded: s) else { return nil }
        return try? JSONDecoder().decode(ApplicationToken.self, from: data)
    }

    // MARK: shield state

    /// Whether HabitPet's rules currently want the shield on (survives app restarts).
    static var wanted: Bool {
        get { defaults.bool(forKey: "shieldWanted") }
        set { defaults.set(newValue, forKey: "shieldWanted") }
    }

    /// Apps the web layer asked to shield (base64 tokens from Apple's picker).
    static var activeTokens: [String] {
        get { defaults.stringArray(forKey: "activeTokens") ?? [] }
        set { defaults.set(newValue, forKey: "activeTokens") }
    }

    static var relockAt: Date? {
        get { defaults.object(forKey: "relockAt") as? Date }
        set { defaults.set(newValue, forKey: "relockAt") }
    }

    static func apply() {
        let sel = loadSelection()
        // the web layer passes the tokens still on the user's shield list
        let apps = Set(activeTokens.compactMap(decode))
        store.shield.applications = apps.isEmpty ? nil : apps
        store.shield.applicationCategories = sel.categoryTokens.isEmpty ? nil : .specific(sel.categoryTokens)
        store.shield.webDomains = sel.webDomainTokens.isEmpty ? nil : sel.webDomainTokens
    }

    static func clear() {
        store.shield.applications = nil
        store.shield.applicationCategories = nil
        store.shield.webDomains = nil
    }

    /// Re-apply the shield if it's wanted and any unlock window has ended.
    static func reconcile(now: Date = Date()) {
        if let until = relockAt, until > now { clear(); return }
        relockAt = nil
        if wanted { apply() } else { clear() }
    }
}
