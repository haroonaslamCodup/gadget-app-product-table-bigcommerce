import { Box, Link, Panel, ProgressCircle, Text } from "@bigcommerce/big-design";
import { Provider as GadgetProvider, useGadget } from "@gadgetinc/react-bigcommerce";
import {
  Outlet,
  Route,
  RouterProvider,
  createBrowserRouter,
  createHashRouter,
  createRoutesFromElements,
} from "react-router";
import { api } from "../api";
import { IndexPage } from "../routes/index";
import { SetupPage } from "../routes/setup";
import { WidgetEditPage } from "../routes/widget-edit";
import { WidgetNewPage } from "../routes/widget-new";
import { WidgetsPage } from "../routes/widgets";
import { ErrorBoundary } from "./ErrorBoundary";
import { Navigation } from "./Navigation";

function App() {
  const isEmbedded = (() => {
    try {
      if (window.self !== window.top) return true;
      const ref = document.referrer ? new URL(document.referrer) : null;
      return !!ref && /mybigcommerce\.com$/i.test(ref.hostname);
    } catch (_e) {
      return false;
    }
  })();

  const router = (isEmbedded ? createHashRouter : createBrowserRouter)(
    createRoutesFromElements(
      <Route path="/" element={<Layout />}>
        <Route index element={<IndexPage />} />
        <Route path="widgets" element={<WidgetsPage />} />
        <Route path="widgets/new" element={<WidgetNewPage />} />
        <Route path="widgets/:id/edit" element={<WidgetEditPage />} />
        <Route path="setup" element={<SetupPage />} />
        <Route path="*" element={<Error404 />} />
      </Route>
    )
  );

  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  )
}

function Layout() {
  return (
    <GadgetProvider api={api}>
      <AuthenticatedApp />
    </GadgetProvider>
  );
}

function AuthenticatedApp() {
  const { isAuthenticated, loading } = useGadget();

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          width: "100%",
        }}
      >
        <ProgressCircle />
      </div>
    )
  }

  return (
    <Box
      marginHorizontal={{ mobile: 'none', tablet: 'xxxLarge' }}
      marginVertical={{ mobile: 'none', tablet: "xxLarge" }}
    >
      {isAuthenticated ? (
        <>
          <Navigation />
          <Outlet />
        </>
      ) : (
        <UnauthenticatedApp />
      )}
    </Box>)
}

function UnauthenticatedApp() {
  const env = process.env.GADGET_PUBLIC_APP_ENV || "development";
  const href = `/edit/${env}/files/web/components/App.tsx`;
  return (
    <Panel description="App must be viewed in the BigCommerce control panel">
      <Text>Edit this page: <Link target="_blank" href={href}>web/components/App.tsx</Link></Text>
    </Panel>
  )
}

function Error404() {
  return <div>404 not found</div>;
}

export default App;
