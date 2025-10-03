import { useLocation, useNavigate } from "react-router";
import { Box, Tabs } from "@bigcommerce/big-design";

export const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const getActiveTab = () => {
    if (location.pathname === "/") return "dashboard";
    if (location.pathname.startsWith("/product-tables")) return "product-tables";
    if (location.pathname.startsWith("/setup")) return "setup";
    return "dashboard";
  };

  const tabs = [
    { id: "dashboard", title: "Dashboard" },
    { id: "product-tables", title: "Product Tables" },
    { id: "setup", title: "Setup" },
  ];

  return (
    <Box marginBottom="large">
      <Tabs
        activeTab={getActiveTab()}
        items={tabs}
        onTabClick={(tabId) => {
          if (tabId === "dashboard") navigate("/");
          if (tabId === "product-tables") navigate("/product-tables");
          if (tabId === "setup") navigate("/setup");
        }}
      />
    </Box>
  );
};
