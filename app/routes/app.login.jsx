import React, { useEffect,useState } from "react";
import { useActionData, Form,useNavigation,useLoaderData   } from "@remix-run/react";
import { data } from "@remix-run/node";  // Use 'json' from Remix
import {
  Page,
  Layout,
  Card,
  FormLayout,
  TextField,
  Button,
  Banner,
  Spinner,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import {salonistLogin} from "../salonist/salonist-api.jsx";

// LOADER
export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session?.shop;
  return null;
};

// ACTION
export const action = async ({ request }) => {
  const { admin ,session} = await authenticate.admin(request);
  const shop = session?.shop;
 
 console.log(shop,'asas')
  const formData = await request.formData();
  const email = formData.get("email")?.trim();
  const password = formData.get("password")?.trim();

  const errors = {};
  const values = { email, password ,shop};

  if (!email) errors.emailError = "Email is required.";
  if (!password) errors.passwordError = "Password is required.";

  if (Object.keys(errors).length > 0) {
    return data({ ...errors, values }, { status: 400 });
  }

  try {
   
    const result = await salonistLogin(email, password,shop);
    console.log("Api response -", result);
    if (result.success) {
      return  data({ message: { type: "success", text: "Login successful!" }, values },{ status: 200 });
    } else {
      return data({ message: { type: "error", text: result.error }, values, } ,{ status: 401 });
    }
  } catch (error) {
    return data({
      message: { type: "error", text: "Login failed. Please try again later." },
      values,
    }, { status: 500 });
  }
};


export default function Login() {

  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting"; 
  const [email, setEmail] = useState(actionData?.data?.values?.email || "");
  const [password, setPassword] = useState(actionData?.data?.values?.password || "");
  const [showBanner, setShowBanner] = useState(false);
 
  useEffect(() => {
    if (actionData?.data?.message) {
      setShowBanner(true);
    }
  }, [actionData]);

  return (
    <Page narrowWidth>
      <Layout>
        <Layout.AnnotatedSection 
          id="login-details"
          title="Connect to Salonist"
          description="Connect with Salonist and import your products into Shopify"
        >
          <Card>
            {showBanner && (
              <Banner
                title={actionData?.data?.message.text}
                status={actionData?.data?.message?.type === "success" ? "success" : "critical"}
                tone={actionData?.data?.message?.type === "success" ? "success" : "critical"}
                onDismiss={() => setShowBanner(false)}
              />
            )}
            <Form method="post">
              <FormLayout>
                <TextField
                  type="email"
                  label="Account Email"
                  value={email}
                  onChange={setEmail}
                  name="email"
                  autoComplete="email"
                  error={actionData?.data?.emailError}
                />
                <TextField
                  type="password"
                  label="Account Password"
                  value={password}
                  onChange={setPassword}
                  name="password"
                  autoComplete="off"
                  error={actionData?.data?.passwordError}
                />
             <Button 
              submit 
              primary 
              loading={isSubmitting}
              disabled={isSubmitting} 
            >
              {isSubmitting ? "Connecting..." : "Connect Now"} 
            </Button>
              </FormLayout>
            </Form>
          </Card>
        
        </Layout.AnnotatedSection>
      </Layout>
    </Page>
  );
}
