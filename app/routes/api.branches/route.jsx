import { data } from "@remix-run/node";
import { fetchSalonistBranches } from '../../salonist/salonist-api.server';
import { unauthenticated } from "../../shopify.server";

export const loader = () => {

  return  data({ message: { type: "error", text: "Unexpected server error" } },{ status: 500 });
};

export const action = async ({ request }) => {


  try {
    const shop = request.headers.get("shop");
    const domainId = request.headers.get("domainId");

    if (!shop) {
      return data(
        {
          message: { type: "error", text: "Missing shop header" },
          locations: [],
        },
        { status: 400 }
      );
    }

    if (!domainId) {
      return data(
        {
          message: { type: "error", text: "Missing domainId header" },
          locations: [],
        },
        { status: 400 }
      );
    }

    const result = await fetchSalonistBranches(domainId);

    if (!result.success) {
      return data(
        {
          message: {
            type: "error",
            text: result.error || "Failed to fetch Salonist branches",
          },
          locations: [],
        },
        { status: 502 } 
      );
    }

    const locations = result.data?.locations || [];

    return data(
      {
        message: {
          type: "success",
          text: "Branches fetched successfully",
        },
        shop,
        locations,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Action error:", error);
    return data(
      {
        message: {
          type: "error",
          text: error.message || "Unexpected server error",
        },
        locations: [],
      },
      { status: 500 }
    );
  }
};
