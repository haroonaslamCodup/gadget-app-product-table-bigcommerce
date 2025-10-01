import { useLocation, useNavigate } from "react-router";
import { Box, Tabs } from "@bigcommerce/big-design";

export const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const getActiveTab = () => {
    if (location.pathname === "/") return "dashboard";
    if (location.pathname.startsWith("/widgets")) return "widgets";
    if (location.pathname.startsWith("/setup")) return "setup";
    return "dashboard";
  };

  const tabs = [
    { id: "dashboard", title: "Dashboard" },
    { id: "widgets", title: "Widgets" },
    { id: "setup", title: "Setup" },
  ];

  return (
    <Box marginBottom="large">
      <Tabs
        activeTab={getActiveTab()}
        items={tabs}
        onTabClick={(tabId) => {
          if (tabId === "dashboard") navigate("/");
          if (tabId === "widgets") navigate("/widgets");
          if (tabId === "setup") navigate("/setup");
        }}
      />
    </Box>
  );
};
