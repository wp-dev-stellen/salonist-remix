import { redirect } from "@remix-run/node";
import { Form, useLoaderData ,useActionData} from "@remix-run/react";
import { login } from "../../shopify.server";
import styles from "./styles.module.css";
import customstyles from "./custom-style.css";

export const links = () => [{ rel: 'stylesheet', href: customstyles }];

export const loader = async ({ request }) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return { showForm: Boolean(login) };
};

export const action = async ({ request }) => {
  const formData = new URLSearchParams(await request.text());
  const domain = formData.get("domain");

  if (!domain) {
    return { error: "Shop parameter is required." };
  }

  const redirectUrl = `/auth/login?shop=${domain}`;
  return redirect(redirectUrl);
}
export default function App() {
  const { showForm } = useLoaderData();
  const actionData = useActionData();
  const error = actionData?.error || null;
  return (
    <div>
      {/* Logo Section */}
      <section className="logo-section">
        <div className="logo-container">
          <img src="https://salonist.io/front-images/logo.svg" alt="Logo" className="main-logo" />
        </div>
      </section>

      {/* Salon Section */}
      <section className="salon-section">
        <h1 className="title">
          Transform Your Salon Experience –<br /> Install the Salonist App
        </h1>
        <p className="description">Manage appointments, clients, and staff directly from your Shopify store.</p>
        <p className="description">Run your salon smarter,faster, and stress-free with just a tap by installing the Salonist app on your Shopify store!</p>

        {/* Conditionally render form based on showForm */}
        {showForm && (
          <>
            <p className="description">Enter your Shopify store domain to get started</p>
            <Form className="input-group" method="post" >
              <input type="text" placeholder="example.myshopify.com"  name="domain" className={error ? "error-border" : ""} id="inputField" />
              <button type="submit">Install Now</button>
            </Form>
          </>
        )}
      </section>

      {/* App Download Section */}
      <div className="app-download-container">
        <div className="app-download-wrapper">
          <div className="app-download-text">
            <div className="app-download-header">
              <h2 className="app-download-title">Download the Salonist Customer App</h2>
            </div>
            <p className="app-download-description">
              The Salonist app is the quickest, easiest way to book and keep track of your appointments.
            </p>
            <div className="app-download-buttons">
              <a href="https://apps.apple.com/" target="_blank" rel="noopener noreferrer">
                <img src="https://salonist.io/front-images/ios-store.webp" alt="Download on the App Store" className="store-badge" />
              </a>
              <a href="https://play.google.com/store" target="_blank" rel="noopener noreferrer">
                <img src="https://salonist.io/front-images/google-play.webp" alt="Get it on Google Play" className="store-badge" />
              </a>
            </div>
          </div>

          <div className="app-download-image">
            <img src="https://salonist.io/front-images/services.webp" alt="App Screenshot 1" />
            <img src="https://salonist.io/front-images/track-your-appointments.gif" alt="App Screenshot 2" />
          </div>
        </div>
      </div>
    </div>
  );
}
