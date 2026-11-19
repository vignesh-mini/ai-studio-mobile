import { streamChat, toPayload } from '../src/services/chatStream';
import { useChatStore } from '../src/store/chatStore';

describe('chat store', () => {
  it('titles a new conversation from the first user message', () => {
    const store = useChatStore.getState();
    const id = store.createConversation('gemini-flash');
    store.addMessage(id, {
      role: 'user',
      content: 'How do I set up NestJS with Prisma?',
    });
    expect(useChatStore.getState().conversations[id].title).toBe(
      'How do I set up NestJS with Prisma?',
    );
  });

  it('truncateFrom removes the message and everything after it', () => {
    const store = useChatStore.getState();
    const id = store.createConversation('gemini-flash');
    const first = store.addMessage(id, { role: 'user', content: 'one' });
    store.addMessage(id, { role: 'assistant', content: 'two' });
    const third = store.addMessage(id, { role: 'user', content: 'three' });
    store.addMessage(id, { role: 'assistant', content: 'four' });

    store.truncateFrom(id, third.id);
    expect(useChatStore.getState().messages[id].map(m => m.content)).toEqual([
      'one',
      'two',
    ]);

    store.truncateFrom(id, first.id);
    expect(useChatStore.getState().messages[id]).toEqual([]);
  });
});

describe('chat stream', () => {
  it('keeps model-switch events and in-flight replies out of the payload', () => {
    const payload = toPayload([
      {
        id: '1',
        conversationId: 'c',
        role: 'user',
        content: 'hi',
        createdAt: '',
      },
      {
        id: '2',
        conversationId: 'c',
        role: 'assistant',
        kind: 'event',
        content: 'Switched to Qwen',
        createdAt: '',
      },
      {
        id: '3',
        conversationId: 'c',
        role: 'assistant',
        content: 'partial',
        status: 'streaming',
        createdAt: '',
      },
    ]);
    expect(payload).toEqual([
      {
        role: 'user',
        content: 'hi',
        modelId: undefined,
        attachments: undefined,
      },
    ]);
  });

  it('routes Auto to a coding model and streams the full reply', () => {
    jest.useFakeTimers();
    let text = '';
    let answeredBy = '';
    streamChat(
      {
        conversationId: 'c',
        modelId: 'auto',
        messages: [{ role: 'user', content: 'Fix this typescript bug' }],
      },
      {
        onToken: t => (text += t),
        onDone: r => (answeredBy = r.modelId),
        onError: e => {
          throw e;
        },
      },
    );
    jest.runAllTimers();
    expect(answeredBy).toBe('groq-qwen3-32b');
    expect(text).toContain('Qwen3 32B');
    jest.useRealTimers();
  });

  it('stops emitting tokens after cancel', () => {
    jest.useFakeTimers();
    const onToken = jest.fn();
    const onDone = jest.fn();
    const cancel = streamChat(
      {
        conversationId: 'c',
        modelId: 'gemini-flash',
        messages: [{ role: 'user', content: 'hello' }],
      },
      { onToken, onDone, onError: jest.fn() },
    );
    jest.advanceTimersByTime(100);
    const calls = onToken.mock.calls.length;
    cancel();
    jest.runAllTimers();
    expect(onToken.mock.calls.length).toBe(calls);
    expect(onDone).not.toHaveBeenCalled();
    jest.useRealTimers();
  });
});
