# Provider Naming Conventions

- Use `*Provider` for components that either:
  - create and expose React context (`createContext` + `useContext`), or
  - wrap third-party provider primitives (`SessionProvider`, `QueryClientProvider`, etc.).
- Use `*Gate` for effect-driven wrappers that conditionally render modals or route guards and do not expose context.
