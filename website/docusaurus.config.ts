import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Fincheck Documentation',
  tagline: 'Confidence-Aware Cheque Digit Validation System',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  // ================================
  // GitHub Pages Deployment Settings
  // ================================
  url: 'https://mukesh1352.github.io',
  baseUrl: '/fincheck-next/',

  organizationName: 'mukesh1352',
  projectName: 'fincheck-next',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',

          // Make documentation the homepage
          routeBasePath: '/',

          // GitHub edit links
          editUrl:
            'https://github.com/mukesh1352/fincheck-next/tree/main/website/',
        },

        // Disable blog (documentation-only site)
        blog: false,

        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',

    colorMode: {
      respectPrefersColorScheme: true,
      defaultMode: 'light',
    },

    // ================================
    // Navbar
    // ================================
    navbar: {
      title: 'Fincheck',
      items: [
        {
          to: '/',
          label: 'Documentation',
          position: 'left',
        },
        {
          href: 'https://github.com/mukesh1352/fincheck-next',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },

    // ================================
    // Footer
    // ================================
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'System Architecture',
              to: '/architecture',
            },
            {
              label: 'Evaluation Metrics',
              to: '/evaluation-metrics',
            },
            {
              label: 'API Specification',
              to: '/api-spec',
            },
          ],
        },
        {
          title: 'Project',
          items: [
            {
              label: 'GitHub Repository',
              href: 'https://github.com/mukesh1352/fincheck-next',
            },
          ],
        },
      ],
      copyright: `© ${new Date().getFullYear()} Fincheck`,
    },

    // ================================
    // Code Highlighting
    // ================================
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
