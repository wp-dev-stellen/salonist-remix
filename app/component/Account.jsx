import React, { useEffect,useState } from "react";
import { useActionData, Form,useNavigation  } from "@remix-run/react";
import { redirect ,data } from "@remix-run/node";
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
import { authenticate } from "../shopify.server.js";
import { getCrmCredentialsByShop } from '../salonist/crm-credentials.jsx'


export const loader = async ({ request }) => {
    const { admin, session } = await authenticate.admin(request);
    const shop = session?.shop;
    const crm = await getCrmCredentialsByShop(shop);
    if (!crm || crm.loginStatus === false) {
        return redirect(`/login`);
      }
    return null;
  };