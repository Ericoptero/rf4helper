import { createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/AppShell";

const RootLayout = () => {
  return (
    <TooltipProvider>
      <>
        <AppShell />
        <TanStackRouterDevtools />
        <ReactQueryDevtools />
      </>
    </TooltipProvider>
  );
};

export const Route = createRootRoute({ component: RootLayout });
