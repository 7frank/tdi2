// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'TDI2 Documentation',
			description: 'TypeScript Dependency Injection for React - Transform React from component chaos to service-centric clarity.',
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/7frank/tdi2' },
			],
			editLink: {
				baseUrl: 'https://github.com/7frank/tdi2/edit/main/monorepo/apps/docs-starlight/',
			},
			sidebar: [
				{
					label: 'Getting Started',
					items: [
						{ label: 'Overview', slug: 'index' },
						{ label: 'Quick Start', slug: 'getting-started/quick-start' },
					],
				},
				{
					label: 'Core Patterns',
					items: [
						{ label: 'Service Patterns', slug: 'patterns/service-patterns' },
						{ label: 'Component Transformation', slug: 'guides/component-transformation' },
					],
				},
				{
					label: 'Examples',
					items: [
						{ label: 'Example Guide', slug: 'guides/example' },
					],
				},
				{
					label: 'Reference',
					autogenerate: { directory: 'reference' },
				},
			],
			customCss: [
				'./src/styles/custom.css',
			],
		}),
	],
});
