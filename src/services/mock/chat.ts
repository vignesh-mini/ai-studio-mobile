import { mockModels } from './data';
import type { ChatPayloadMessage } from '../chatStream';

/** Client-side stand-in for the gateway's router. The real rules live in the backend. */
export function resolveAutoModel(prompt: string) {
  const text = prompt.toLowerCase();
  if (
    /\b(code|bug|function|typescript|javascript|python|sql|regex)\b/.test(text)
  ) {
    return 'groq-qwen3-32b';
  }
  if (/\b(prove|reason|step by step|math|why)\b/.test(text))
    return 'groq-gpt-oss-120b';
  return 'gemini-flash';
}

export function buildMockReply(
  modelId: string,
  messages: ChatPayloadMessage[],
) {
  const model = mockModels.find(m => m.id === modelId);
  const lastUser = [...messages].reverse().find(m => m.role === 'user');
  const prompt = lastUser?.content ?? '';
  const attachments = lastUser?.attachments?.length
    ? `\n- Attachments received: ${lastUser.attachments
        .map(a => a.name)
        .join(', ')}`
    : '';

  return (
    `**${model?.name ?? modelId}** · ${
      model?.provider ?? 'Unknown provider'
    } _(mock reply)_\n\n` +
    `You asked: “${prompt}”\n\n` +
    'This answer comes from the Phase 1 mock layer. When the NestJS AI gateway is running, ' +
    'set `useMocks: false` in `src/config/env.ts` and the same screen streams real tokens over SSE.\n\n' +
    `- Context turns sent to the model: ${messages.length}${attachments}\n` +
    '- Switching models keeps this conversation history\n\n' +
    '```ts\n' +
    `await gateway.chat({ model: '${modelId}', messages });\n` +
    '```'
  );
}
