import type {
  AssistantDeliveryMode,
  NativeApi,
  OrchestrationReadModel,
  ProjectId,
  ProviderInteractionMode,
  ProviderKind,
  ProviderModelOptions,
  ProviderServiceTier,
  RuntimeMode,
  ThreadId,
} from "@t3tools/contracts";

import { newCommandId, newMessageId } from "./utils";

interface CreateThreadWithPromptInput {
  api: NativeApi;
  createdAt: string;
  interactionMode: ProviderInteractionMode;
  projectId: ProjectId;
  prompt: string;
  runtimeMode: RuntimeMode;
  syncServerReadModel: (snapshot: OrchestrationReadModel) => void;
  threadId: ThreadId;
  title: string;
  threadModel: string;
  assistantDeliveryMode?: AssistantDeliveryMode;
  branch?: string | null;
  modelOptions?: ProviderModelOptions;
  provider?: ProviderKind;
  serviceTier?: ProviderServiceTier | null;
  turnModel?: string;
  worktreePath?: string | null;
}

export async function createThreadWithPrompt(input: CreateThreadWithPromptInput): Promise<void> {
  const {
    api,
    createdAt,
    interactionMode,
    projectId,
    prompt,
    runtimeMode,
    syncServerReadModel,
    threadId,
    title,
    threadModel,
  } = input;

  try {
    await api.orchestration.dispatchCommand({
      type: "thread.create",
      commandId: newCommandId(),
      threadId,
      projectId,
      title,
      model: threadModel,
      runtimeMode,
      interactionMode,
      branch: input.branch ?? null,
      worktreePath: input.worktreePath ?? null,
      createdAt,
    });

    await api.orchestration.dispatchCommand({
      type: "thread.turn.start",
      commandId: newCommandId(),
      threadId,
      message: {
        messageId: newMessageId(),
        role: "user",
        text: prompt,
        attachments: [],
      },
      ...(input.provider ? { provider: input.provider } : {}),
      ...(input.turnModel ? { model: input.turnModel } : {}),
      ...(input.serviceTier !== undefined ? { serviceTier: input.serviceTier } : {}),
      ...(input.modelOptions ? { modelOptions: input.modelOptions } : {}),
      ...(input.assistantDeliveryMode
        ? { assistantDeliveryMode: input.assistantDeliveryMode }
        : {}),
      runtimeMode,
      interactionMode,
      createdAt,
    });

    const snapshot = await api.orchestration.getSnapshot();
    syncServerReadModel(snapshot);
  } catch (error) {
    await api.orchestration
      .dispatchCommand({
        type: "thread.delete",
        commandId: newCommandId(),
        threadId,
      })
      .catch(() => undefined);

    await api.orchestration
      .getSnapshot()
      .then((snapshot) => {
        syncServerReadModel(snapshot);
      })
      .catch(() => undefined);

    throw error;
  }
}
