/**
 * @format
 */

import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

test('renders the splash screen while booting', async () => {
  jest.useFakeTimers();
  let tree: ReactTestRenderer.ReactTestRenderer | undefined;
  await ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(<App />);
  });
  expect(JSON.stringify(tree!.toJSON())).toContain('AI Studio');
  await ReactTestRenderer.act(() => tree!.unmount());
  jest.useRealTimers();
});
