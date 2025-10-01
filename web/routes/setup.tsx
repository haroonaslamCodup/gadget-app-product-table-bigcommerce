import { useState } from "react";
import { Box, Button, H1, H2, Panel, Text, Flex, Link, Message } from "@bigcommerce/big-design";
import { CheckIcon, ErrorIcon } from "@bigcommerce/big-design-icons";

export const SetupPage = () => {
  const [isInstalling, setIsInstalling] = useState(false);
  const [widgetTemplateInstalled, setWidgetTemplateInstalled] = useState(false);
  const [scriptInstalled, setScriptInstalled] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{type: 'success' | 'error' | 'warning'; text: string} | null>(null);
  const [manualInstructions, setManualInstructions] = useState<string[] | null>(null);

  const installWidgetTemplate = async () => {
    setIsInstalling(true);
    try {
      const response = await fetch("/api/install-widget-template", {
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
        setAlertMessage({
          type: "error",
          text: `Failed to install widget template: ${data.error}`
        });
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
        setAlertMessage({
          type: "error",
          text: `Failed to install widget script: ${data.error}`
        });
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

      {/* Troubleshooting */}
      <Panel header="Troubleshooting">
        <Box>
          <Text bold marginBottom="xSmall">Widget not appearing in Page Builder?</Text>
          <ul>
            <li><Text>Wait 1-2 minutes after installation and refresh</Text></li>
            <li><Text>Clear your browser cache</Text></li>
            <li><Text>Try reinstalling the widget template</Text></li>
          </ul>

          <Text bold marginTop="medium" marginBottom="xSmall">Widget not working on storefront?</Text>
          <ul>
            <li><Text>Make sure the widget script is installed</Text></li>
            <li><Text>Check browser console for errors</Text></li>
            <li><Text>Verify the Widget ID is correct</Text></li>
            <li><Text>Make sure the widget is marked as Active</Text></li>
          </ul>

          <Text bold marginTop="medium" marginBottom="xSmall">Need to reinstall?</Text>
          <Text>
            You can run the installation steps again at any time.
            It won't create duplicates - existing installations will be detected.
          </Text>
        </Box>
      </Panel>
    </Box>
  );
};
