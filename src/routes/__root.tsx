import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { TooltipProvider } from "@/components/ui/tooltip";

const RootLayout = () => (
  <TooltipProvider>
    <div className="p-2 flex gap-2">
      <Link to="/" className="[&.active]:font-bold">
        Home
      </Link>
      <Link to="/calendar" className="[&.active]:font-bold">
        Calendar
      </Link>
      <Link to="/fishing" className="[&.active]:font-bold">
        Fishing
      </Link>
      <Link to="/maps" className="[&.active]:font-bold">
        Maps
      </Link>
      <Link to="/items" className="[&.active]:font-bold">
        Items
      </Link>
      <Link to="/characters" className="[&.active]:font-bold">
        Characters
      </Link>
      <Link to="/monsters" className="[&.active]:font-bold">
        Monsters
      </Link>
      <Link to="/player" className="[&.active]:font-bold">
        Player
      </Link>
    </div>
    <hr />
    <Outlet />
    <TanStackRouterDevtools />
    <ReactQueryDevtools />
  </TooltipProvider>
);

export const Route = createRootRoute({ component: RootLayout });
