import { Box, Button, Flex, H1, H2, Link, Message, Panel, Text } from "@bigcommerce/big-design";
import { CheckIcon, ErrorIcon } from "@bigcommerce/big-design-icons";
import { useState } from "react";

export const SetupPage = () => {
  const [isInstalling, setIsInstalling] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [widgetTemplateInstalled, setWidgetTemplateInstalled] = useState(false);
  const [scriptInstalled, setScriptInstalled] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);
  const [manualInstructions, setManualInstructions] = useState<string[] | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);

  const installWidgetTemplate = async () => {
    setIsInstalling(true);
    try {
      const response = await fetch("/api/install-product-table-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Include session cookies
      });

      const data = await response.json();

      if (data.success) {
        setWidgetTemplateInstalled(true);
        if (data.manualSetup) {
          setAlertMessage({
            type: "warning",
            text: data.message || "Please follow the manual setup instructions below."
          });
          setManualInstructions(data.instructions || []);
        } else {
          setAlertMessage({
            type: "success",
            text: data.message || "Widget template installed! It will now appear in Page Builder under 'Widgets'."
          });
        }
      } else {
        // Handle authentication errors specifically
        if (data.error === "AUTHENTICATION_REQUIRED") {
          setAlertMessage({
            type: "error",
            text: data.message || "Authentication required - please reinstall the app."
          });
          setManualInstructions(data.instructions || []);
        } else {
          setAlertMessage({
            type: "error",
            text: `Failed to install widget template: ${data.error}`
          });
        }
      }
    } catch (error) {
      setAlertMessage({
        type: "error",
        text: `Error: ${(error as Error).message}`
      });
    } finally {
      setIsInstalling(false);
    }
  };

  const installWidgetScript = async () => {
    setIsInstalling(true);
    try {
      const response = await fetch("/api/inject-widget-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Include session cookies
      });

      const data = await response.json();

      if (data.success) {
        setScriptInstalled(true);
        if (data.manualSetup) {
          setAlertMessage({
            type: "warning",
            text: data.message || "Please follow the manual setup instructions below."
          });
          setManualInstructions(data.instructions || []);
        } else {
          setAlertMessage({
            type: "success",
            text: data.alreadyInstalled
              ? "Widget script is already installed."
              : data.message || "Widget script installed! Widgets will now work on your storefront."
          });
        }
      } else {
        // Handle authentication errors specifically
        if (data.error === "AUTHENTICATION_REQUIRED") {
          setAlertMessage({
            type: "error",
            text: data.message || "Authentication required - please reinstall the app."
          });
          setManualInstructions(data.instructions || []);
        } else {
          setAlertMessage({
            type: "error",
            text: `Failed to install widget script: ${data.error}`
          });
        }
      }
    } catch (error) {
      setAlertMessage({
        type: "error",
        text: `Error: ${(error as Error).message}`
      });
    } finally {
      setIsInstalling(false);
    }
  };

  const installBoth = async () => {
    await installWidgetTemplate();
    await installWidgetScript();
  };

  const cleanupWidgetTemplates = async () => {
    setIsCleaning(true);
    try {
      const response = await fetch("/api/cleanup-widget-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const data = await response.json();
      console.log("Cleanup templates response:", data);

      if (data.success) {
        setAlertMessage({
          type: "success",
          text: data.message || `Deleted ${data.deletedCount} widget template(s).`
        });
        setWidgetTemplateInstalled(false);

        // Show detailed results if available
        if (data.results && data.results.length > 0) {
          console.log("Deleted templates:", data.results);
        }
      } else {
        setAlertMessage({
          type: "error",
          text: `Failed to cleanup templates: ${data.error || data.message}`
        });
      }
    } catch (error) {
      setAlertMessage({
        type: "error",
        text: `Error: ${(error as Error).message}`
      });
    } finally {
      setIsCleaning(false);
    }
  };

  const cleanupWidgetScripts = async () => {
    setIsCleaning(true);
    try {
      const response = await fetch("/api/cleanup-widget-scripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const data = await response.json();
      console.log("Cleanup scripts response:", data);

      if (data.success) {
        const msgType = data.deletedCount === 0 ? "warning" : "success";
        const msgText = data.totalFound === 0
          ? "No Product Table Widget scripts found to delete"
          : `Found ${data.totalFound} script(s). Deleted ${data.deletedCount}. ${data.failedCount > 0 ? `Failed: ${data.failedCount}.` : ''}`;

        setAlertMessage({
          type: msgType,
          text: msgText
        });

        if (data.deletedCount > 0) {
          setScriptInstalled(false);
        }

        // Show detailed results if available
        if (data.results && data.results.length > 0) {
          console.log("Script deletion results:", data.results);
        }
        if (data.allScripts) {
          console.log("All scripts found:", data.allScripts);
        }
      } else {
        console.error("Cleanup failed:", data);
        setAlertMessage({
          type: "error",
          text: `Failed to cleanup scripts: ${data.error || data.message}`
        });
      }
    } catch (error) {
      console.error("Cleanup error:", error);
      setAlertMessage({
        type: "error",
        text: `Error: ${(error as Error).message}`
      });
    } finally {
      setIsCleaning(false);
    }
  };

  const cleanupAll = async () => {
    await cleanupWidgetTemplates();
    await cleanupWidgetScripts();
  };

  const loadDebugInfo = async () => {
    try {
      const response = await fetch("/api/list-widgets", {
        credentials: "include",
      });
      const data = await response.json();
      if (data.success) {
        setDebugInfo(data.data);
        setShowDebug(true);
      }
    } catch (error) {
      console.error("Failed to load debug info:", error);
    }
  };

  return (
    <Box>
      {alertMessage && (
        <Message
          type={alertMessage.type}
          messages={[{ text: alertMessage.text }]}
          marginBottom="medium"
          onClose={() => setAlertMessage(null)}
        />
      )}

      <H1>Widget Setup</H1>
      <Text marginBottom="large">
        Before you can use widgets in Page Builder, you need to complete this one-time setup.
      </Text>

      {/* Installation Steps */}
      <Panel header="Installation Steps" marginBottom="large">
        <Box marginBottom="medium">
          <Flex alignItems="center" marginBottom="small">
            {widgetTemplateInstalled ? (
              <CheckIcon color="success" size="large" />
            ) : (
              <ErrorIcon color="secondary40" size="large" />
            )}
            <H2 marginLeft="small">Step 1: Install Widget Template</H2>
          </Flex>
          <Text marginBottom="medium">
            This registers the Product Table Widget with BigCommerce Page Builder,
            making it available in the widget dropdown.
          </Text>
          <Button
            onClick={installWidgetTemplate}
            isLoading={isInstalling}
            disabled={widgetTemplateInstalled}
          >
            {widgetTemplateInstalled ? "Template Installed ✓" : "Install Widget Template"}
          </Button>
        </Box>

        <Box marginBottom="medium">
          <Flex alignItems="center" marginBottom="small">
            {scriptInstalled ? (
              <CheckIcon color="success" size="large" />
            ) : (
              <ErrorIcon color="secondary40" size="large" />
            )}
            <H2 marginLeft="small">Step 2: Install Widget Script</H2>
          </Flex>
          <Text marginBottom="medium">
            This injects the widget loader script into your storefront,
            making the widgets functional on all pages.
          </Text>
          <Button
            onClick={installWidgetScript}
            isLoading={isInstalling}
            disabled={scriptInstalled}
          >
            {scriptInstalled ? "Script Installed ✓" : "Install Widget Script"}
          </Button>
        </Box>

        <Box>
          <Button
            variant="primary"
            onClick={installBoth}
            isLoading={isInstalling}
            disabled={widgetTemplateInstalled && scriptInstalled}
          >
            Install Both
          </Button>
        </Box>
      </Panel>

      {/* Manual Instructions */}
      {manualInstructions && manualInstructions.length > 0 && (
        <Panel header="Manual Setup Instructions" marginBottom="large">
          <Box>
            <Text bold marginBottom="medium">
              Follow these steps to complete the setup:
            </Text>
            {manualInstructions.map((instruction, index) => (
              <Text key={index} marginBottom="xSmall">
                {instruction}
              </Text>
            ))}
          </Box>
        </Panel>
      )}

      {/* How to Use */}
      {(widgetTemplateInstalled || scriptInstalled) && (
        <Panel header="Next Steps" marginBottom="large">
          <Box marginBottom="medium">
            <H2>How to Use Your Widgets</H2>
            <ol>
              <li>
                <Text bold>Create a Widget</Text>
                <Text>Go to <Link href="/widgets">Widgets</Link> and create a new product table widget.</Text>
              </li>
              <li>
                <Text bold>Copy the Widget ID</Text>
                <Text>After creating the widget, copy its Widget ID (e.g., widget-1759330856855-hqlbdgy)</Text>
              </li>
              <li>
                <Text bold>Add to Page Builder</Text>
                <Text>
                  Go to your BigCommerce admin → Storefront → Themes → Customize →
                  Open any page → Add Widget → Select "Product Table Widget"
                </Text>
              </li>
              <li>
                <Text bold>Paste Widget ID</Text>
                <Text>In the widget settings, paste the Widget ID you copied</Text>
              </li>
              <li>
                <Text bold>Publish</Text>
                <Text>Click Publish and your widget will appear on the page!</Text>
              </li>
            </ol>
          </Box>
        </Panel>
      )}

      {/* Cleanup Section */}
      <Panel header="Cleanup Old Widgets" marginBottom="large">
        <Box marginBottom="medium">
          <Text marginBottom="medium">
            If you have old or duplicate widget templates and scripts from previous installations,
            you can clean them up here before reinstalling.
          </Text>

          <Flex marginBottom="medium">
            <Button
              variant="secondary"
              actionType="destructive"
              onClick={cleanupWidgetTemplates}
              isLoading={isCleaning}
              marginRight="medium"
            >
              Clean Up Widget Templates
            </Button>

            <Button
              variant="secondary"
              actionType="destructive"
              onClick={cleanupWidgetScripts}
              isLoading={isCleaning}
              marginRight="medium"
            >
              Clean Up Widget Scripts
            </Button>

            <Button
              variant="secondary"
              actionType="destructive"
              onClick={cleanupAll}
              isLoading={isCleaning}
              marginRight="medium"
            >
              Clean Up All
            </Button>

            <Button
              variant="secondary"
              onClick={loadDebugInfo}
            >
              Show What's Installed
            </Button>
          </Flex>

          <Message
            type="warning"
            messages={[{
              text: "This will delete all Product Table Widget templates and scripts from BigCommerce. You'll need to reinstall them after cleanup."
            }]}
          />

          {showDebug && debugInfo && (
            <Box marginTop="medium" padding="medium" backgroundColor="secondary10">
              <H2 marginBottom="medium">Installed Widgets Debug Info</H2>

              <Text bold>Widget Templates ({debugInfo.templates?.length || 0}):</Text>
              <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                {JSON.stringify(debugInfo.templates, null, 2)}
              </pre>

              <Text bold marginTop="medium">Scripts ({debugInfo.scripts?.length || 0}):</Text>
              <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                {JSON.stringify(debugInfo.scripts, null, 2)}
              </pre>

              <Text bold marginTop="medium">Widget Placements ({debugInfo.placements?.length || 0}):</Text>
              <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                {JSON.stringify(debugInfo.placements, null, 2)}
              </pre>

              <Text bold marginTop="medium">Widgets ({debugInfo.widgets?.length || 0}):</Text>
              <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                {JSON.stringify(debugInfo.widgets, null, 2)}
              </pre>
            </Box>
          )}
        </Box>
      </Panel>

      {/* Troubleshooting */}
      <Panel header="Troubleshooting">
        <Box>
          <Text bold marginBottom="xSmall">Getting "access token is required" error?</Text>
          <ul>
            <li><Text>This means the app needs to be reinstalled to refresh authentication</Text></li>
            <li><Text>Go to BigCommerce Admin → Apps & Customizations → My Apps</Text></li>
            <li><Text>Find this app and click "Uninstall"</Text></li>
            <li><Text>Reinstall from the BigCommerce marketplace</Text></li>
            <li><Text>Make sure to approve all permission requests during installation</Text></li>
          </ul>

          <Text bold marginTop="medium" marginBottom="xSmall">Widget not appearing in Page Builder?</Text>
          <ul>
            <li><Text>Wait 1-2 minutes after installation and refresh</Text></li>
            <li><Text>Clear your browser cache</Text></li>
            <li><Text>Try reinstalling the widget template</Text></li>
            <li><Text>Check if your BigCommerce plan supports Widget Templates API</Text></li>
          </ul>

          <Text bold marginTop="medium" marginBottom="xSmall">Widget not working on storefront?</Text>
          <ul>
            <li><Text>Make sure the widget script is installed</Text></li>
            <li><Text>Check browser console for errors</Text></li>
            <li><Text>Verify the Widget ID is correct</Text></li>
            <li><Text>Make sure the widget is marked as Active</Text></li>
            <li><Text>Ensure the widget script URL is accessible</Text></li>
          </ul>

          <Text bold marginTop="medium" marginBottom="xSmall">Connection issues?</Text>
          <ul>
            <li><Text>Check the connection status on the main dashboard</Text></li>
            <li><Text>Verify your BigCommerce store has the required scopes</Text></li>
            <li><Text>Try refreshing the page and running setup again</Text></li>
            <li><Text>If issues persist, reinstall the app completely</Text></li>
          </ul>

          <Text bold marginTop="medium" marginBottom="xSmall">Need to reinstall?</Text>
          <Text>
            You can run the installation steps again at any time.
            It won't create duplicates - existing installations will be detected.
            If you're having persistent issues, try uninstalling and reinstalling the entire app.
          </Text>
        </Box>
      </Panel>
    </Box>
  );
};
