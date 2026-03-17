import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const RootLayout = () => (
  <>
    <div className="p-2 flex gap-2">
      <Link to="/" className="[&.active]:font-bold">
        Home
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
    </div>
    <hr />
    <Outlet />
    <TanStackRouterDevtools />
    <ReactQueryDevtools />
  </>
);

export const Route = createRootRoute({ component: RootLayout });
