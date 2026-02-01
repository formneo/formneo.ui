import { executeAlertNode, AlertNodeData } from "./workflowAlert";

/**
 * Workflow node execution için tip tanımları
 */
export interface WorkflowNode {
  id: string;
  type: string;
  data: any;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
}

/**
 * Workflow execution context
 */
export interface WorkflowExecutionContext {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  currentNodeId?: string;
  formData?: any;
  workflowData?: any;
}

/**
 * Workflow node'u execute eder
 * @param node Execute edilecek node
 * @param context Workflow execution context
 * @returns Promise<any> - Node execution sonucu
 */
export const executeWorkflowNode = async (
  node: WorkflowNode,
  context: WorkflowExecutionContext
): Promise<any> => {
  switch (node.type) {
    case "alertNode":
      // AlertNode execute edilir
      await executeAlertNode(node);
      // Alert gösterildikten sonra sonraki node'a geçilebilir
      return { success: true, message: "Alert gösterildi" };

    case "formNode":
      // FormNode - Form gösterilir ve kullanıcı input beklenir
      return { success: true, formData: context.formData };

    case "setFieldNode":
      // SetFieldNode - Form alanları set edilir
      return { success: true, updatedFields: node.data?.actions || [] };

    case "approverNode":
      // ApproverNode - Onay beklenir
      return { success: true, approvalStatus: "pending" };

    case "queryConditionNode":
      // QueryConditionNode - Koşul kontrol edilir
      return { success: true, conditionResult: true };

    case "mailNode":
      // MailNode - Mail gönderilir
      return { success: true, mailSent: true };

    case "httpPostNode":
      // HttpPostNode - HTTP POST isteği gönderilir
      return { success: true, response: {} };

    case "formStopNode":
      // FormStopNode - Workflow durdurulur
      return { success: true, workflowStopped: true };

    case "stopNode":
      // StopNode - Workflow bitirilir
      return { success: true, workflowFinished: true };

    default:
      console.warn(`Unknown node type: ${node.type}`);
      return { success: false, error: `Unknown node type: ${node.type}` };
  }
};

/**
 * Workflow'u baştan sona execute eder
 * @param context Workflow execution context
 * @returns Promise<void>
 */
export const executeWorkflow = async (
  context: WorkflowExecutionContext
): Promise<void> => {
  const { nodes, edges } = context;

  // StartNode'u bul
  const startNode = nodes.find((n) => n.type === "startNode");
  if (!startNode) {
    throw new Error("StartNode bulunamadı!");
  }

  // Execution queue
  let currentNodeId = startNode.id;
  const executedNodes = new Set<string>();

  // Workflow execution loop
  while (currentNodeId) {
    // Sonsuz döngü kontrolü
    if (executedNodes.has(currentNodeId)) {
      console.warn(`Döngü tespit edildi: ${currentNodeId}`);
      break;
    }

    executedNodes.add(currentNodeId);

    // Mevcut node'u bul
    const currentNode = nodes.find((n) => n.id === currentNodeId);
    if (!currentNode) {
      console.warn(`Node bulunamadı: ${currentNodeId}`);
      break;
    }

    // Node'u execute et
    
    const result = await executeWorkflowNode(currentNode, context);

    // StopNode veya FormStopNode ise workflow'u bitir
    if (
      currentNode.type === "stopNode" ||
      currentNode.type === "formStopNode"
    ) {
      
      break;
    }

    // Sonraki node'u bul
    const outgoingEdges = edges.filter((e) => e.source === currentNodeId);

    if (outgoingEdges.length === 0) {
      // Çıkış edge'i yok, workflow sona erdi
      
      break;
    }

    // İlk çıkış edge'ini takip et (daha gelişmiş routing logic eklenebilir)
    const nextEdge = outgoingEdges[0];
    currentNodeId = nextEdge.target;
  }
};

/**
 * Belirli bir node'dan başlayarak workflow'u execute eder
 * @param startNodeId Başlangıç node ID'si
 * @param context Workflow execution context
 * @returns Promise<void>
 */
export const executeWorkflowFromNode = async (
  startNodeId: string,
  context: WorkflowExecutionContext
): Promise<void> => {
  const updatedContext = {
    ...context,
    currentNodeId: startNodeId,
  };

  await executeWorkflow(updatedContext);
};

