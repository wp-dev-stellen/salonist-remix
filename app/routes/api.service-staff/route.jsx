import { data } from "@remix-run/node";
import { fetchServiceStaff } from '../../salonist/salonist-api.server';

export const loader = () => {

  return  data({ message: { type: "error", text: "Unexpected server error" } },{ status: 500 });
};

export const action = async ({ request }) => {
  try {
    const shop = request.headers.get("shop");
    const domainId = request.headers.get("domainId");
    const serviceId = request.headers.get("serviceId");

    if (!shop) {
      return data(
        {
          message: { type: "error", text: "Missing shop header" },
          staff: [],
        },
        { status: 400 }
      );
    }

    if (!domainId) {
      return data(
        {
          message: { type: "error", text: "Missing domainId header" },
          staff: [],
        },
        { status: 400 }
      );
    }

    if (!serviceId) {
        return data(
          {
            message: { type: "error", text: "Missing serviceId header" },
            staff: [],
          },
          { status: 400 }
        );
      }

    const result = await fetchServiceStaff(domainId,serviceId);

    if (!result.success) {
      return data(
        {
          message: {
            type: "error",
            text: result.error || "Failed to fetch Salonist Staff",
          },
          staff: [],
        },
        { status: 502 } 
      );
    }

    const staff = result.data?.list || [];

    return data(
      {
        message: {
          type: "success",
          text: "Staff fetched successfully",
        },
        shop,
        staff,
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
        staff: [],
      },
      { status: 500 }
    );
  }
};
