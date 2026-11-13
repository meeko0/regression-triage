import type { Preview } from '@storybook/react-vite'
import '@fontsource/orbitron/latin-400.css'
import '@fontsource/orbitron/latin-700.css'
import '@fontsource/orbitron/latin-900.css'
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '../src/index.css'

const preview: Preview = {
  parameters: {
    layout: 'padded',
    backgrounds: { disable: true },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      // Report violations as errors in the Accessibility panel, not as warnings to fix later.
      test: 'error',
    },
  },
  decorators: [
    Story => (
      <div className="bg-paper p-4 text-primary">
        <Story />
      </div>
    ),
  ],
}

export default preview
