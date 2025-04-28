import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu} from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import style from './style.css?url';
import { authenticate } from "../shopify.server";


export const links = () => [{ rel: "stylesheet", href: polarisStyles },{rel:'stylesheet',href:style}];

export const loader = async ({ request }) => {
 const{session,admin} =  await authenticate.admin(request);
 const shop = session?.shop;

  return { apiKey: process.env.SHOPIFY_API_KEY || "",shop};
};

export default function App() {

  const { apiKey ,shop} = useLoaderData();
console.log(shop)
  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>
          <Link to={`/app/products?shop=${shop}`}>Products</Link>
          <Link to={`/app/services?shop=${shop}`}>Services</Link>
          <Link to={`/app/packages?shop=${shop}`}>Packages</Link>
      </NavMenu>
      <Outlet />
    </AppProvider>
  );
}

// Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
