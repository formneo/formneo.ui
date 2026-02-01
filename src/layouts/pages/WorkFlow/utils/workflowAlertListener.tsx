import { showWorkflowAlert, AlertNodeData } from "./workflowAlert";

/**
 * Backend'den gelen workflow execution event'lerini dinler ve alert gösterir
 * .NET backend'den gelen event'leri handle eder
 */

export interface WorkflowExecutionEvent {
  eventType: "nodeExecuted" | "workflowCompleted" | "workflowError" | "alert";
  nodeId?: string;
  nodeType?: string;
  nodeData?: any;
  timestamp?: string;
  workflowInstanceId?: string;
}

/**
 * Backend'den gelen alert event'ini handle eder
 * @param event Workflow execution event
 */
export const handleWorkflowAlertEvent = (event: WorkflowExecutionEvent) => {
  if (event.eventType !== "alert" || !event.nodeData) {
    return;
  }

  const alertData: AlertNodeData = {
    title: event.nodeData.title,
    message: event.nodeData.message,
    type: event.nodeData.type || "info",
  };

  // Frontend'de alert göster
  showWorkflowAlert(alertData);
};

/**
 * WebSocket/SignalR ile backend'den gelen event'leri dinler
 * @param workflowInstanceId Workflow instance ID
 * @param onEvent Event callback
 */
export const subscribeToWorkflowEvents = (
  workflowInstanceId: string,
  onEvent: (event: WorkflowExecutionEvent) => void
) => {
  // TODO: WebSocket/SignalR bağlantısı kurulacak
  // Örnek:
  // const connection = new HubConnectionBuilder()
  //   .withUrl("/workflowHub")
  //   .build();
  //
  // connection.on("WorkflowEvent", (event: WorkflowExecutionEvent) => {
  //   if (event.workflowInstanceId === workflowInstanceId) {
  //     onEvent(event);
  //     if (event.eventType === "alert") {
  //       handleWorkflowAlertEvent(event);
  //     }
  //   }
  // });
  //
  // connection.start();

  
};

/**
 * API polling ile workflow durumunu kontrol eder ve alert event'lerini yakalar
 * @param workflowInstanceId Workflow instance ID
 * @param interval Polling interval (ms)
 */
export const pollWorkflowStatus = async (
  workflowInstanceId: string,
  interval: number = 2000
) => {
  // TODO: API'den workflow execution log'unu çek
  // Örnek:
  // const checkWorkflowStatus = async () => {
  //   const response = await fetch(`/api/workflow/${workflowInstanceId}/execution-log`);
  //   const logs = await response.json();
  //
  //   // Son alert event'ini kontrol et
  //   const alertEvents = logs.filter(
  //     (log: any) => log.nodeType === "alertNode" && !log.alertShown
  //   );
  //
  //   alertEvents.forEach((event: any) => {
  //     handleWorkflowAlertEvent({
  //       eventType: "alert",
  //       nodeId: event.nodeId,
  //       nodeType: event.nodeType,
  //       nodeData: event.nodeData,
  //       workflowInstanceId,
  //     });
  //     // Alert gösterildi olarak işaretle
  //     markAlertAsShown(event.id);
  //   });
  // };
  //
  // setInterval(checkWorkflowStatus, interval);

  
};

/**
 * Backend API'den workflow execution log'unu çeker ve alert event'lerini işler
 * @param workflowInstanceId Workflow instance ID
 */
export const fetchAndProcessWorkflowAlerts = async (
  workflowInstanceId: string
) => {
  try {
    // TODO: Backend API'den execution log çek
    // const conf = getConfiguration();
    // const api = new WorkFlowApi(conf);
    // const response = await api.apiWorkFlowGetExecutionLogGet(workflowInstanceId);
    // const logs = response.data || [];
    //
    // // AlertNode execution'larını filtrele
    // const alertLogs = logs.filter(
    //   (log: any) =>
    //     log.nodeType === "alertNode" &&
    //     log.status === "completed" &&
    //     !log.alertShown
    // );
    //
    // // Her alert için frontend'de göster
    // alertLogs.forEach((log: any) => {
    //   handleWorkflowAlertEvent({
    //     eventType: "alert",
    //     nodeId: log.nodeId,
    //     nodeType: log.nodeType,
    //     nodeData: log.nodeData,
    //     timestamp: log.timestamp,
    //     workflowInstanceId,
    //   });
    // });

    
  } catch (error) {
    console.error("Error fetching workflow alerts:", error);
  }
};

