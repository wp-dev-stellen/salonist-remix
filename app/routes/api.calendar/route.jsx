import { data } from "@remix-run/node";

export const loader = () => {
  return data({ message: { type: "error", text: "Unexpected server error" } }, { status: 500 });
};

export const action = async ({ request }) => {
  const {fetchSalonistCalendar} = await import ('../../salonist/salonist-api.server'); 
  try {
    const shop = request.headers.get("shop");
    const domainId = request.headers.get("domainId");


    if (!shop) {
      return data(
        {
          message: { type: "error", text: "Missing shop header" },
          calendarEvents: [],
        },
        { status: 400 }
      );
    }

    if (!domainId) {
      return data(
        {
          message: { type: "error", text: "Missing domainId header" },
          calendarEvents: [],
        },
        { status: 400 }
      );
    }

    const result = await fetchSalonistCalendar(domainId);

    if (!result.success) {
      return data(
        {
          message: {
            type: "error",
            text: result.error || "Failed to fetch calendar events",
          },
          calendarEvents: [],
        },
        { status: 502 }
      );
    } 

    const calendarEvents = result.data || [];

    return data(
      {
        message: {
          type: "success",
          text: "Calendar events fetched successfully",
        },
        shop,
        calendarEvents,
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
        calendarEvents: [],
      },
      { status: 500 }
    );
  }
};
