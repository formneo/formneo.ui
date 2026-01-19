import {
  DashboardsApi,
  GetSumTicketDto,
  TicketDepartmensListDto,
} from "api/generated";
import getConfiguration from "confiuration";



export const fetchChartData = async (id: string, startDate?: string, endDate?: string) => {
  const conf = getConfiguration();
  const api = new DashboardsApi(conf);
  if (!id) {
    return {
      labels: [],
      datasets: {
        label: "Projects",
        backgroundColors: ["info", "primary", "dark", "secondary"],
        data: [],
      },
    };
  }
  // Sadece ilgili menü/şirket için veri çek
  const response = await api.apiDashboardsGetUserCompanyAllTicketCountGet(id, startDate, endDate);
  const hasTickets = response.data.some((item) => item.ticketCount > 0);
  const filteredData = response.data.filter((item) => item.ticketCount > 0);

  if (!hasTickets || filteredData.length === 0) {
    return {
      labels: ["Veri Yok"],
      datasets: {
        label: "Projects",
        backgroundColors: ["dark"],
        data: [1],
        isEmpty: true,
      },
    };
  }

  return {
    labels: response.data.map((item) => item.companyName),
    datasets: {
      label: "Projects",
      backgroundColors: ["info", "primary", "dark", "secondary"],
      data: response.data.map((item) => item.ticketCount),
    },
  };
};

var channelChartData = {
  labels: [] as string[],
  datasets: {
    label: "Projects",
    backgroundColors: ["info", "primary", "dark", "secondary"],
    data: [] as number[],
  },
};

export default channelChartData;
