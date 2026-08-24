import { useState } from "react";
import { CalibrationScreen } from "./screens/CalibrationScreen";
import { ScanScreen } from "./screens/ScanScreen";
import { SettingsScreen } from "./screens/SettingsScreen";

type Screen = "scan" | "settings" | "calibration";

export function App() {
  const [screen, setScreen] = useState<Screen>("scan");

  if (screen === "settings") {
    return (
      <SettingsScreen
        onBack={() => setScreen("scan")}
        onCalibrate={() => setScreen("calibration")}
      />
    );
  }

  if (screen === "calibration") {
    return <CalibrationScreen onDone={() => setScreen("settings")} />;
  }

  return <ScanScreen onOpenSettings={() => setScreen("settings")} />;
}
