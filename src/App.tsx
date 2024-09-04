import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import HomePage from "./pages/Home";
import ResizablePanelGroup from "./pages/ZapletChat";
import { TourProvider } from "@reactour/tour";
import { steps } from "./lib/steps";
import { Button } from "./components/ui/button"; // Ensure Button is correctly imported

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route
          path="/chat"
          element={
            <TourWrapper>
              <ResizablePanelGroup />
            </TourWrapper>
          }
        />
        <Route path="/" element={<HomePage />} />
      </Routes>
    </Router>
  );
};

// A separate component to handle the conditional rendering of TourProvider
const TourWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  console.log("Current path:", location.pathname); // Log the current path
  const isChatPage = location.pathname === "/chat";

  if (!isChatPage) {
    return <>{children}</>;
  }

  return (
    <TourProvider
      steps={steps}
      showBadge={false}
      showCloseButton={false}
      onClickMask={(e) => e.setIsOpen}
      nextButton={({
        currentStep,
        stepsLength,
        setIsOpen,
        setCurrentStep,
        steps,
      }) => {
        const last = currentStep === stepsLength - 1;
        return (
          <Button
            onClick={() => {
              if (last) {
                setIsOpen(false);
                localStorage.setItem("first_run", "false");
              } else {
                setCurrentStep((s) => (s === steps!.length - 1 ? 0 : s + 1));
              }
            }}
          >
            {currentStep === stepsLength - 1 ? "Done" : "Next"}
          </Button>
        );
      }}
      styles={{
        popover: (base) => ({
          ...base,
          borderRadius: 10,
          marginLeft: 5,
        }),
      }}
      scrollSmooth
      disableInteraction
    >
      {children}
    </TourProvider>
  );
};

export default App;
