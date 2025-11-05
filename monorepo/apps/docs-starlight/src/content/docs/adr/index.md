---
title: Architecture Decision Records (ADRs)
description: Key technical decisions that shaped TDI2's design and implementation.
---

# Architecture Decision Records

This section documents the key technical decisions behind TDI2's architecture. Each ADR explains **why** a particular approach was chosen and the trade-offs involved.

## Core Decisions

| ADR | Decision | Status |
|-----|----------|--------|
| [ADR-001](./001-ast-transformation) | AST Transformation vs Runtime Reflection | Active |
| [ADR-002](./002-valtio-state) | Valtio for Service State Management | Active |
| [ADR-003](./003-interface-tokens) | Interface-Based DI Tokens | Active |
| [ADR-004](./004-build-time-di) | Build-Time vs Runtime DI | Active |
| [ADR-005](./005-spring-boot-conventions) | Spring Boot Decorator Conventions | Active |
| [ADR-006](./006-client-first-ssr-later) | Client-First, SSR Later | Active |

## Purpose

These ADRs help developers understand:
- **Why** specific technologies were chosen
- **What** trade-offs were made
- **How** decisions impact the framework's behavior
- **When** these decisions might need to be reconsidered

Each ADR follows a simple format: Context → Decision → Consequence.