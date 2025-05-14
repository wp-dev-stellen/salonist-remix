import { data } from "@remix-run/node";

export const loader = () => {
  return data({ message: { type: "error", text: "Unexpected server error" } }, { status: 500 });
};

export const action = async ({ request }) => {
  const { fetchSalonistTimeSlots } = await import('../../salonist/salonist-api.server');
  try {
    const shop = request.headers.get("shop");
    const domainId = request.headers.get("domainid") || request.headers.get("domainId");
    const date = request.headers.get("adate");
    const serviceId = request.headers.get("serviceId");
    const staffId = request.headers.get("staffId");
    const tdata = {
      domainId:domainId,
      shop:shop,
      date:date,
      staffId:staffId,
      serviceId:serviceId
    }
    console.log(tdata,'tdata');

    if (!shop) {
      return data(
        {
          message: { type: "error", text: "Missing shop header" },
          timeSlots: [],
        },
        { status: 400 }
      );
    }

     if (!date) {
      return data(
        {
          message: { type: "error", text: "Please choose Appointment Date" },
          timeSlots: [],
        },
        { status: 400 }
      );
    }

    if (!domainId) {
      return data(
        {
          message: { type: "error", text: "Missing domainId header" },
          timeSlots: [],
        },
        { status: 400 }
      );
    }


    const result = await fetchSalonistTimeSlots(tdata);

    if (!result.success) {
      return data(
        {
          message: {
            type: "error",
            text: result.error || "Failed to fetch time slots",
          },
          timeSlots: [],
        },
        { status: 502 }
      );
    }

    const timeSlots = result.data || [];

    return data(
      {
        message: {
          type: "success",
          text: "Time slots fetched successfully",
        },
        shop,
        timeSlots,
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
        timeSlots: [],
      },
      { status: 500 }
    );
  }
};
