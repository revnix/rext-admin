---
name: creating-skills
description: Generates high-quality Antigravity agent skills following standardized structure and best practices. Use when the user requests creating a new skill, building a skill system, or mentions skill generation or skill creation.
---

# Antigravity Skill Creator

## When to use this skill

- User asks to "create a skill" or "build a skill"
- User mentions "skill generation" or "skill system"
- User wants to standardize agent capabilities
- User needs to package reusable workflows

## Core Structural Requirements

Every skill must follow this folder hierarchy:

```
.agents/skills/<skill-name>/
├── SKILL.md          (Required: Main logic and instructions)
├── scripts/          (Optional: Helper scripts)
├── examples/         (Optional: Reference implementations)
└── resources/        (Optional: Templates or assets)
```

## YAML Frontmatter Standards

The `SKILL.md` must start with YAML frontmatter:

```yaml
---
name: skill-name-here
description: Third-person description with triggers and keywords
---
```

### Name Rules
- **Format**: Gerund form (e.g., `testing-code`, `managing-databases`)
- **Max length**: 64 characters
- **Allowed characters**: Lowercase letters, numbers, hyphens only
- **Forbidden**: "claude", "anthropic", or brand names
- **Examples**: 
  - ✅ `deploying-applications`
  - ✅ `handling-errors`
  - ❌ `Deploy Applications` (not gerund, has caps)
  - ❌ `claude-helper` (forbidden word)

### Description Rules
- **Voice**: Third person (not "I will" but "Helps the agent...")
- **Max length**: 1024 characters
- **Must include**: Specific triggers/keywords
- **Format**: `[What it does]. Use when [trigger conditions].`
- **Example**: 
  ```
  Extracts text from PDFs and processes document content. Use when the user mentions 
  document processing, PDF files, text extraction, or OCR tasks.
  ```

## Writing Principles (The "Claude Way")

### 1. Conciseness
- Assume the agent is intelligent
- Don't explain basic concepts (what a PDF is, what Git is)
- Focus only on unique logic of the skill
- Keep `SKILL.md` under 500 lines

### 2. Progressive Disclosure
- Keep main instructions concise
- Link to secondary files for advanced details: `[See ADVANCED.md](ADVANCED.md)`
- Only one level deep for references
- Structure: Overview → Details → Advanced (separate files)

### 3. Path Conventions
- **Always** use forward slashes `/` for paths
- **Never** use backslashes `\`
- Use absolute paths when clarity is needed
- Example: `/home/user/project/file.txt` not `.\file.txt`

### 4. Degrees of Freedom

Choose instruction format based on task flexibility:

**High Freedom (Heuristics)** → Use Bullet Points
```markdown
- Analyze the codebase structure
- Identify potential optimization areas
- Suggest improvements based on patterns
```

**Medium Freedom (Templates)** → Use Code Blocks
```markdown
Use this template for the component:
\`\`\`tsx
export function Component() {
  // Implementation here
}
\`\`\`
```

**Low Freedom (Fragile Operations)** → Use Specific Commands
```markdown
Run exactly this command:
\`\`\`bash
git commit -m "feat: add new feature" --no-verify
\`\`\`
```

## Workflow & Feedback Loops

### 1. Checklists for Complex Tasks

Provide markdown checklists the agent can copy and track:

```markdown
## Implementation Checklist

- [ ] Step 1: Analyze requirements
- [ ] Step 2: Create file structure
- [ ] Step 3: Implement core logic
- [ ] Step 4: Add error handling
- [ ] Step 5: Write tests
- [ ] Step 6: Validate output
```

### 2. Plan-Validate-Execute Pattern

For critical operations:

```markdown
## Workflow

1. **Plan**: Review the configuration file
2. **Validate**: Run `script.sh --dry-run` to check for issues
3. **Execute**: If validation passes, run `script.sh --apply`
4. **Verify**: Check output matches expected results
```

### 3. Error Handling

Treat scripts as "black boxes":

```markdown
## Using Helper Scripts

If unsure about script options:
1. Run `script.sh --help` to see available flags
2. Review the output for guidance
3. Execute with appropriate flags

Do not modify script internals unless explicitly needed.
```

## Skill Creation Template

When creating a new skill, use this structure:

```markdown
---
name: [gerund-name]
description: [Third-person description with triggers]
---

# [Skill Title]

## When to use this skill

- [Trigger condition 1]
- [Trigger condition 2]
- [Trigger condition 3]

## Prerequisites

- [Required tool/dependency 1]
- [Required tool/dependency 2]

## Workflow

[Insert checklist or step-by-step guide]

## Instructions

[Specific logic, code snippets, or rules]

### [Subsection if needed]

[Detailed instructions]

## Resources

- [Link to scripts/]
- [Link to examples/]
- [Link to resources/]

## Common Issues

### [Issue 1]
**Problem**: [Description]
**Solution**: [Fix]

### [Issue 2]
**Problem**: [Description]
**Solution**: [Fix]

## Examples

[Optional: Link to examples/ directory or inline examples]
```

## Quality Checklist

Before finalizing a skill, verify:

- [ ] YAML frontmatter is valid and follows naming rules
- [ ] Description is in third person and includes triggers
- [ ] Skill name is gerund form, lowercase, with hyphens
- [ ] Main instructions are under 500 lines
- [ ] Paths use forward slashes `/`
- [ ] Instruction format matches task freedom level
- [ ] Complex workflows include checklists
- [ ] Critical operations have validation steps
- [ ] Scripts are treated as black boxes with `--help` guidance
- [ ] Common issues section addresses likely problems
- [ ] Resources are properly linked

## Directory Structure Examples

### Simple Skill (Instructions Only)
```
.agents/skills/formatting-code/
└── SKILL.md
```

### Medium Skill (With Resources)
```
.agents/skills/testing-components/
├── SKILL.md
├── examples/
│   └── sample-test.spec.ts
└── resources/
    └── test-template.ts
```

### Complex Skill (Full Structure)
```
.agents/skills/deploying-applications/
├── SKILL.md
├── scripts/
│   ├── deploy.sh
│   └── rollback.sh
├── examples/
│   ├── basic-deployment.md
│   └── advanced-deployment.md
└── resources/
    ├── config-template.yml
    └── checklist.md
```

## Best Practices

### DO ✅
- Use specific, actionable language
- Provide concrete examples
- Include validation steps for critical operations
- Link to external resources when appropriate
- Keep instructions focused and scannable
- Use consistent formatting throughout
- Test workflows before documenting

### DON'T ❌
- Explain basic programming concepts
- Use vague or ambiguous language
- Create circular dependencies between skills
- Exceed 500 lines in main SKILL.md
- Use brand names in skill names
- Mix instruction formats (bullets + commands in same section)
- Assume agent has context from other conversations

## Integration with Antigravity

Skills are automatically loaded by Antigravity when:
1. Located in `.agents/skills/` directory
2. Contain valid `SKILL.md` with proper frontmatter
3. Name matches directory name

The agent will:
- Read skill descriptions to determine relevance
- Load full instructions when triggered
- Follow workflows as documented
- Use provided resources and scripts

## Advanced: Skill Composition

Skills can reference other skills:

```markdown
## Prerequisites

This skill requires the `handling-errors` skill. If not available, 
[view the error handling skill](.agents/skills/handling-errors/SKILL.md) first.

## Workflow

1. Follow the error handling workflow from `handling-errors` skill
2. Apply specific logic for this use case
3. Validate using standard error checking
```

## Maintenance

### Updating Skills
- Increment version in description if making breaking changes
- Document changes in skill's README if complex
- Test updated workflows before committing

### Deprecating Skills
- Add `[DEPRECATED]` prefix to description
- Point to replacement skill in instructions
- Keep file for 30 days before removal

---

**Remember**: A good skill is predictable, efficient, and makes the agent's job easier. Focus on clarity over cleverness.
