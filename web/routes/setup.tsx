import { Box, Button, Flex, H1, Message, Panel, Text } from "@bigcommerce/big-design";
import { CheckIcon } from "@bigcommerce/big-design-icons";
import { useState } from "react";

export const SetupPage = () => {
  const [isInstalling, setIsInstalling] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [widgetTemplateInstalled, setWidgetTemplateInstalled] = useState(false);
  const [scriptInstalled, setScriptInstalled] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);
  const [manualInstructions, setManualInstructions] = useState<string[] | null>(null);

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

      if (data.success) {
        setAlertMessage({
          type: "success",
          text: data.message || `Deleted ${data.deletedCount} widget template(s).`
        });
        setWidgetTemplateInstalled(false);
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
      } else {
        setAlertMessage({
          type: "error",
          text: `Failed to cleanup scripts: ${data.error || data.message}`
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

  const cleanupAll = async () => {
    await cleanupWidgetTemplates();
    await cleanupWidgetScripts();
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

      <H1 marginBottom="none">Widget Setup</H1>
      <Text marginBottom="large">
        Before you can use widgets in Page Builder, you need to complete this one-time setup.
      </Text>

      {/* Installation Steps */}
      <Panel header="Installation Steps" marginBottom="large">
        <Flex flexDirection="row" flexGap="medium" flexWrap="wrap">
          {/* Step 1 */}
          <Box
            style={{ flex: 1 }}
            border="box"
            borderRadius="normal"
            padding="medium"
            backgroundColor={widgetTemplateInstalled ? "success10" : "secondary10"}
          >
            <Flex alignItems="center" marginBottom="small">
              {widgetTemplateInstalled ? (
                <CheckIcon color="success" size="large" />
              ) : (
                <Text bold style={{ fontSize: "1.25rem" }} color="secondary60">1</Text>
              )}
              <Text bold marginLeft="small">Install Widget Template</Text>
            </Flex>
            <Text marginBottom="medium" color="secondary60">
              Registers the Product Table Widget with Page Builder
            </Text>
            <Button
              variant={widgetTemplateInstalled ? "secondary" : "primary"}
              onClick={installWidgetTemplate}
              isLoading={isInstalling}
              disabled={widgetTemplateInstalled}
            >
              {widgetTemplateInstalled ? "Installed ✓" : "Install Template"}
            </Button>
          </Box>

          {/* Step 2 */}
          <Box
            style={{ flex: 1 }}
            border="box"
            borderRadius="normal"
            padding="medium"
            backgroundColor={scriptInstalled ? "success10" : "secondary10"}
          >
            <Flex alignItems="center" marginBottom="small">
              {scriptInstalled ? (
                <CheckIcon color="success" size="large" />
              ) : (
                <Text bold style={{ fontSize: "1.25rem" }} color="secondary60">2</Text>
              )}
              <Text bold marginLeft="small">Install Widget Script</Text>
            </Flex>
            <Text marginBottom="medium" color="secondary60">
              Injects widget loader script into storefront
            </Text>
            <Button
              variant={scriptInstalled ? "secondary" : "primary"}
              onClick={installWidgetScript}
              isLoading={isInstalling}
              disabled={scriptInstalled}
            >
              {scriptInstalled ? "Installed ✓" : "Install Script"}
            </Button>
          </Box>
        </Flex>

        {/* Quick Install Both */}
        <Box
          marginTop="medium"
          padding="medium"
          border="box"
          borderRadius="normal"
          backgroundColor="primary10"
        >
          <Flex justifyContent="space-between" alignItems="center">
            <Box>
              <Text bold marginBottom="xSmall">Quick Install</Text>
              <Text color="secondary60">Install both components at once</Text>
            </Box>
            <Button
              variant="primary"
              onClick={installBoth}
              isLoading={isInstalling}
              disabled={widgetTemplateInstalled && scriptInstalled}
            >
              {widgetTemplateInstalled && scriptInstalled ? "All Installed ✓" : "Install Both"}
            </Button>
          </Flex>
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

          </Flex>

        </Box>
      </Panel>


    </Box>
  );
};
