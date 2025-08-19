// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://7frank.github.io',
	base: '/tdi2',
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
					label: 'Why TDI2?',
					items: [
						{ label: 'React\'s Architectural Problems', slug: 'why-tdi2/react-problems' },
						{ label: 'Pain Points Solutions', slug: 'why-tdi2/pain-points-solutions' },
						{ label: 'Architecture Principles', slug: 'why-tdi2/architecture-principles' },
						{ label: 'React Ecosystem Impact', slug: 'why-tdi2/ecosystem-impact' },
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
					label: 'Architecture',
					items: [
						{ label: 'Controller vs Service Pattern', slug: 'guides/architecture/controller-service-pattern' },
					],
				},
				{
					label: 'Enterprise Guides',
					items: [
						{ label: 'Implementation Strategy', slug: 'guides/enterprise/implementation' },
						{ label: 'Migration Strategy', slug: 'guides/migration/strategy' },
						{ label: 'Team Onboarding', slug: 'guides/enterprise/onboarding' },
					],
				},
				{
					label: 'Framework Comparisons',
					items: [
						{ label: 'Redux vs TDI2', slug: 'comparison/redux-vs-tdi2' },
						{ label: 'Context API vs TDI2', slug: 'comparison/context-vs-tdi2' },
						{ label: 'Zustand vs TDI2', slug: 'comparison/zustand-vs-tdi2' },
						{ label: 'Angular DI vs TDI2', slug: 'comparison/angular-vs-tdi2' },
						{ label: 'Svelte vs TDI2', slug: 'comparison/svelte-vs-tdi2' },
					],
				},
				{
					label: 'Packages',
					items: [
						{ 
							label: '@tdi2/di-core',
							items: [
								{ label: 'Overview', slug: 'packages/di-core/overview' },
								{ label: 'API Reference', slug: 'packages/di-core/api-reference' },
								{ label: 'Testing Guide', slug: 'packages/di-core/testing' },
							],
						},
						{
							label: '@tdi2/vite-plugin-di',
							items: [
								{ label: 'Overview', slug: 'packages/vite-plugin-di/overview' },
								{ label: 'Configuration', slug: 'packages/vite-plugin-di/configuration' },
							],
						},
						{
							label: '@tdi2/di-testing',
							items: [
								{ label: 'Testing Utilities', slug: 'packages/di-testing/overview' },
							],
						},
					],
				},
				{
					label: 'Advanced Guides',
					items: [
						{ label: 'Features & Roadmap', slug: 'guides/advanced/features-roadmap' },
						{ label: 'Troubleshooting', slug: 'guides/advanced/troubleshooting' },
						{ label: 'SSR/Next.js Integration', slug: 'guides/advanced/ssr-nextjs' },
					],
				},
				{
					label: 'Examples',
					items: [
						{ label: 'E-Commerce Case Study', slug: 'examples/ecommerce-case-study' },
						{ label: 'Example Guide', slug: 'guides/example' },
					],
				},
				{
					label: 'Research & Analysis',
					items: [
						{ label: 'Market Analysis', slug: 'research/market-analysis' },
						{ label: 'Evaluation Plan', slug: 'research/evaluation-plan' },
						{ label: 'Clean Architecture Analysis', slug: 'research/clean-architecture-analysis' },
						{ label: 'Project History', slug: 'research/project-history' },
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
