---
name: brand-identity
description: Provides the single source of truth for brand guidelines, design tokens, technology choices, and voice/tone. Use this skill whenever generating UI components, styling applications, writing copy, or creating user-facing assets to ensure brand consistency.
---

# Brand Identity & Guidelines

**Brand Name:** [INSERT BRAND NAME HERE]

This skill defines the core constraints for visual design and technical implementation for the brand. You must adhere to these guidelines strictly to maintain consistency.

## When to use this skill

- Generating UI components or layouts
- Styling applications or pages
- Writing marketing copy or user-facing text

## 🎨 Antigravity Aesthetic Rules (STRICT)

All designs must adhere to these "No-AI" visual principles:

1.  **NO Generic Colors**: Use the deep, rich `Brand` and `Gray` scales. Avoid standard pure red/green/blue.
2.  **Colored Shadows**: Never use black shadows. Use `shadow-colored` utilities (low opacity primary/brand color) or sharp 1px borders.
3.  **Asymmetric Grids**: Avoid centering everything. Use bento-box layouts and asymmetric grids.
4.  **Fluid Typography**: Use `clamp()` for font sizes. Large titles must have negative tracking (`-0.02em`).
5.  **Micro-interactions**: Buttons must have `active:scale-95`.
6.  **Strict Spacing**: Align to the **8px** grid.
7.  **Border Radius**: Default is **8px** (LG).

- Creating design assets or mockups
- Implementing forms, buttons, or interactive elements
- Setting up color schemes or typography
- Writing error messages or notifications
- Choosing technology stack or libraries

## Reference Documentation

Depending on the task you are performing, consult the specific resource files below. Do not guess brand elements; always read the corresponding file.

### For Visual Design & UI Styling

If you need exact colors, fonts, border radii, or spacing values, read:
👉 **[`resources/design-tokens.json`](resources/design-tokens.json)**

### For Coding & Component Implementation

If you are generating code, choosing libraries, or structuring UI components, read the technical constraints here:
👉 **[`resources/tech-stack.md`](resources/tech-stack.md)**

### For Copywriting & Content Generation

If you are writing marketing copy, error messages, documentation, or user-facing text, read the persona guidelines here:
👉 **[`resources/voice-tone.md`](resources/voice-tone.md)**

## Workflow

When working on brand-related tasks:

- [ ] Identify task type (design, code, or copy)
- [ ] Read the appropriate resource file(s)
- [ ] Apply tokens/guidelines exactly as specified
- [ ] Verify output matches brand standards
- [ ] Do not deviate from documented values

## Instructions

### Design Token Usage

1. **Always** reference `design-tokens.json` for exact color values
2. Use token names (e.g., `primary`, `secondary`) instead of hardcoded hex values
3. Apply typography settings consistently across all text elements
4. Use specified border radius and spacing values

### Technical Implementation

1. **Always** follow the tech stack defined in `tech-stack.md`
2. Do not introduce libraries or frameworks not listed
3. Follow component patterns exactly as documented
4. Respect forbidden patterns and avoid them completely

### Content Creation

1. **Always** match the voice and tone from `voice-tone.md`
2. Use approved terminology from the guide
3. Follow grammar and mechanics rules
4. Maintain brand personality in all copy

## Common Issues

### Issue: Inconsistent Colors Across Components
**Problem**: Components use different shades of the same color
**Solution**: Always reference `design-tokens.json` and use exact token values

### Issue: Wrong Framework or Library Used
**Problem**: Agent uses Bootstrap when Tailwind is required
**Solution**: Check `tech-stack.md` before starting implementation

### Issue: Copy Doesn't Match Brand Voice
**Problem**: Text sounds too formal or too casual
**Solution**: Review personality keywords in `voice-tone.md` before writing

## Best Practices

- **Read before implementing**: Always check resource files first
- **Use exact values**: Never approximate colors or spacing
- **Stay consistent**: Apply the same patterns across all components
- **Validate output**: Compare finished work against guidelines
- **Update resources**: Keep resource files current as brand evolves

---

**Remember**: Brand consistency is non-negotiable. When in doubt, consult the resource files.
