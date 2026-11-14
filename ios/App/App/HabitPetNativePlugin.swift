import Foundation
import UIKit
import SwiftUI
import Capacitor
import HealthKit
import FamilyControls
import ManagedSettings
import DeviceActivity

// Bridge between the HabitPet web app and iOS:
//   • Apple Health (HealthKit): read today's steps, exercise, water, sleep, mindful minutes
//   • Screen Time (FamilyControls / ManagedSettings / DeviceActivity): pick apps,
//     shield them, unlock for N minutes and re-lock automatically
// JS side: src/platform/native.ts. Registered in MainViewController.swift.
//
// UNTESTED SCAFFOLD: written without a Mac or device. Expect to fix small
// compile issues in Xcode. See docs/IOS_SETUP.md.

@objc(HabitPetNativePlugin)
public class HabitPetNativePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "HabitPetNativePlugin"
    public let jsName = "HabitPetNative"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "requestHealth", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "healthToday", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestScreenTime", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "pickApps", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setShield", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "unlockFor", returnType: CAPPluginReturnPromise),
    ]

    private let health = HKHealthStore()

    override public func load() {
        // Re-lock on return to the app if an unlock window ran out while we were away.
        NotificationCenter.default.addObserver(forName: UIApplication.didBecomeActiveNotification, object: nil, queue: .main) { _ in
            ShieldStore.reconcile()
        }
    }

    // MARK: - Apple Health

    private var readTypes: Set<HKObjectType> {
        var s = Set<HKObjectType>()
        [HKQuantityTypeIdentifier.stepCount, .appleExerciseTime, .dietaryWater].forEach {
            if let t = HKObjectType.quantityType(forIdentifier: $0) { s.insert(t) }
        }
        [HKCategoryTypeIdentifier.sleepAnalysis, .mindfulSession].forEach {
            if let t = HKObjectType.categoryType(forIdentifier: $0) { s.insert(t) }
        }
        return s
    }

    @objc func requestHealth(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else {
            call.resolve(["available": false, "granted": false]); return
        }
        health.requestAuthorization(toShare: [], read: readTypes) { ok, error in
            // iOS never reveals whether READ access was granted; `ok` only means the sheet was handled.
            call.resolve(["available": true, "granted": ok, "error": error?.localizedDescription ?? ""])
        }
    }

    @objc func healthToday(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else { call.resolve(["available": false]); return }
        Task {
            let cal = Calendar.current
            let start = cal.startOfDay(for: Date())
            async let steps = sum(.stepCount, unit: .count(), from: start)
            async let exercise = sum(.appleExerciseTime, unit: .minute(), from: start)
            async let water = sum(.dietaryWater, unit: .literUnit(with: .milli), from: start)
            // last night: 6 pm yesterday → noon today
            let nightStart = cal.date(byAdding: .hour, value: -6, to: start)!
            let nightEnd = cal.date(byAdding: .hour, value: 12, to: start)!
            async let sleep = categoryMinutes(.sleepAnalysis, from: nightStart, to: nightEnd, asleepOnly: true)
            async let mindful = categoryMinutes(.mindfulSession, from: start, to: Date(), asleepOnly: false)
            let r = await (steps, exercise, water, sleep, mindful)
            call.resolve([
                "available": true,
                "steps": r.0,
                "exerciseMin": r.1,
                "waterMl": r.2,
                "sleepHours": (r.3 / 60.0 * 10).rounded() / 10,
                "mindfulMin": r.4,
            ])
        }
    }

    private func sum(_ id: HKQuantityTypeIdentifier, unit: HKUnit, from: Date) async -> Double {
        guard let type = HKQuantityType.quantityType(forIdentifier: id) else { return 0 }
        let pred = HKQuery.predicateForSamples(withStart: from, end: Date(), options: .strictStartDate)
        return await withCheckedContinuation { cont in
            let q = HKStatisticsQuery(quantityType: type, quantitySamplePredicate: pred, options: .cumulativeSum) { _, stats, _ in
                cont.resume(returning: stats?.sumQuantity()?.doubleValue(for: unit) ?? 0)
            }
            health.execute(q)
        }
    }

    private func categoryMinutes(_ id: HKCategoryTypeIdentifier, from: Date, to: Date, asleepOnly: Bool) async -> Double {
        guard let type = HKCategoryType.categoryType(forIdentifier: id) else { return 0 }
        let pred = HKQuery.predicateForSamples(withStart: from, end: to, options: [])
        return await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: type, predicate: pred, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, _ in
                let asleep: Set<Int> = [
                    HKCategoryValueSleepAnalysis.asleepUnspecified.rawValue,
                    HKCategoryValueSleepAnalysis.asleepCore.rawValue,
                    HKCategoryValueSleepAnalysis.asleepDeep.rawValue,
                    HKCategoryValueSleepAnalysis.asleepREM.rawValue,
                ]
                let total = (samples as? [HKCategorySample] ?? [])
                    .filter { !asleepOnly || asleep.contains($0.value) }
                    .reduce(0.0) { $0 + $1.endDate.timeIntervalSince($1.startDate) }
                cont.resume(returning: (total / 60).rounded())
            }
            health.execute(q)
        }
    }

    // MARK: - Screen Time

    @objc func requestScreenTime(_ call: CAPPluginCall) {
        Task { @MainActor in
            do {
                try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
                call.resolve(["status": "approved"])
            } catch {
                call.resolve(["status": "denied", "error": error.localizedDescription])
            }
        }
    }

    @objc func pickApps(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard let presenter = self.bridge?.viewController else { call.reject("No view controller"); return }
            var host: UIViewController?
            let view = AppPickerView(selection: ShieldStore.loadSelection()) { picked in
                host?.dismiss(animated: true)
                guard let sel = picked else { call.resolve(["apps": [], "categories": 0, "cancelled": true]); return }
                ShieldStore.saveSelection(sel)
                let apps = sel.applicationTokens.compactMap(ShieldStore.encode).map { ["token": $0] }
                call.resolve(["apps": apps, "categories": sel.categoryTokens.count, "cancelled": false])
            }
            let vc = UIHostingController(rootView: view)
            host = vc
            presenter.present(vc, animated: true)
        }
    }

    /// active=true: shield the given apps (or everything picked when tokens is empty).
    @objc func setShield(_ call: CAPPluginCall) {
        let active = call.getBool("active") ?? false
        ShieldStore.activeTokens = (call.getArray("tokens") as? [String]) ?? []
        ShieldStore.wanted = active
        if !active { ShieldStore.relockAt = nil }
        ShieldStore.reconcile()
        call.resolve(["active": active])
    }

    /// Lift the shield now and re-lock after `minutes`. The ShieldMonitor extension
    /// re-locks in the background; iOS needs schedules of at least 15 minutes, so
    /// shorter unlocks also get re-locked when the app returns to the foreground.
    @objc func unlockFor(_ call: CAPPluginCall) {
        let minutes = max(1, call.getInt("minutes") ?? 15)
        let until = Date().addingTimeInterval(TimeInterval(minutes * 60))
        ShieldStore.relockAt = until
        ShieldStore.clear()

        let center = DeviceActivityCenter()
        center.stopMonitoring([ShieldStore.unlockActivity])
        let cal = Calendar.current
        let end = Date().addingTimeInterval(TimeInterval(max(15, minutes) * 60))
        let schedule = DeviceActivitySchedule(
            intervalStart: cal.dateComponents([.hour, .minute, .second], from: Date()),
            intervalEnd: cal.dateComponents([.hour, .minute, .second], from: end),
            repeats: false
        )
        do {
            try center.startMonitoring(ShieldStore.unlockActivity, during: schedule)
            call.resolve(["until": until.timeIntervalSince1970 * 1000, "backgroundRelock": true])
        } catch {
            call.resolve(["until": until.timeIntervalSince1970 * 1000, "backgroundRelock": false, "error": error.localizedDescription])
        }
    }
}

/// Apple's own app picker. HabitPet never sees app names — only opaque tokens.
struct AppPickerView: View {
    @State var selection: FamilyActivitySelection
    let onDone: (FamilyActivitySelection?) -> Void

    var body: some View {
        NavigationView {
            FamilyActivityPicker(selection: $selection)
                .navigationTitle("Apps to shield")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) { Button("Cancel") { onDone(nil) } }
                    ToolbarItem(placement: .confirmationAction) { Button("Done") { onDone(selection) } }
                }
        }
    }
}
