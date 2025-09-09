# Animation and Transition Specifications

## Table of Contents
1. [Animation Philosophy](#animation-philosophy)
2. [Animation Library Setup](#animation-library-setup)
3. [Core Animation Types](#core-animation-types)
4. [Question Transitions](#question-transitions)
5. [Micro-interactions](#micro-interactions)
6. [Loading States](#loading-states)
7. [Success and Celebration Animations](#success-and-celebration-animations)
8. [Performance Guidelines](#performance-guidelines)
9. [Accessibility Considerations](#accessibility-considerations)
10. [Implementation Examples](#implementation-examples)

---

## Animation Philosophy

### Design Principles
1. **Purposeful**: Every animation serves a functional purpose
2. **Subtle**: Gentle movements that enhance rather than distract
3. **Fast**: Quick transitions to maintain conversation flow
4. **Consistent**: Same timing and easing curves throughout
5. **Accessible**: Respects user motion preferences

### Animation Goals
- **Guide user attention** to important elements
- **Provide visual feedback** for interactions
- **Create smooth transitions** between states
- **Celebrate achievements** and progress
- **Maintain engagement** without being intrusive

### Timing Philosophy
- **Micro-interactions**: 100-200ms (immediate feedback)
- **State transitions**: 200-300ms (comfortable pacing)
- **Page transitions**: 300-500ms (dramatic but not slow)
- **Celebration effects**: 500-1000ms (memorable moments)

---

## Animation Library Setup

### Framer Motion Configuration

#### Installation and Setup
```bash
npm install framer-motion@^12.3.0
```

#### Basic Provider Setup
```typescript
// app/layout.tsx or providers.tsx
import { LazyMotion, domAnimation } from 'framer-motion';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation}>
      {children}
    </LazyMotion>
  );
}
```

#### Configuration for Next.js App Router
```typescript
// next.config.js (if needed for older versions)
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['framer-motion']
  }
};

module.exports = nextConfig;
```

### Canvas Confetti Setup
```typescript
// utils/confetti.ts
import confetti from 'canvas-confetti';

export const confettiDefaults = {
  particleCount: 100,
  spread: 70,
  origin: { y: 0.6 },
  colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
};

export const createConfetti = (options?: confetti.Options) => {
  return confetti({
    ...confettiDefaults,
    ...options
  });
};
```

---

## Core Animation Types

### 1. Easing Curves

#### Predefined Easing Functions
```typescript
export const EASING = {
  // Natural motion
  easeInOut: [0.4, 0.0, 0.2, 1],
  easeOut: [0.0, 0.0, 0.2, 1],
  easeIn: [0.4, 0.0, 1, 1],
  
  // Bouncy effects
  spring: { type: "spring", stiffness: 300, damping: 30 },
  gentleSpring: { type: "spring", stiffness: 200, damping: 25 },
  
  // Sharp movements  
  sharp: [0.4, 0.0, 0.6, 1],
  
  // Custom curves for specific use cases
  anticipate: [0.175, 0.885, 0.32, 1.275],
  backOut: [0.175, 0.885, 0.32, 1.275]
} as const;
```

#### Usage Guidelines
- **easeInOut**: Default for most transitions
- **easeOut**: Entry animations (elements appearing)
- **easeIn**: Exit animations (elements disappearing)
- **spring**: Interactive elements, buttons
- **anticipate**: Special moments, celebrations

### 2. Duration Standards

```typescript
export const DURATION = {
  // Micro-interactions (immediate feedback)
  instant: 0.1,
  fast: 0.15,
  
  // Standard transitions
  normal: 0.25,
  medium: 0.3,
  
  // Dramatic effects
  slow: 0.5,
  dramatic: 0.75,
  
  // Special cases
  celebration: 1.0
} as const;
```

### 3. Animation Variants System

#### Base Variants
```typescript
export const baseVariants = {
  // Fade animations
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  
  // Scale animations  
  scaleIn: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 }
  },
  
  // Slide animations
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  },
  
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 }
  },
  
  // Horizontal slides
  slideInRight: {
    initial: { opacity: 0, x: 100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -100 }
  },
  
  slideInLeft: {
    initial: { opacity: 0, x: -100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 100 }
  }
};
```

---

## Question Transitions

### Main Question Transition System

```typescript
// Animation variants for question transitions
export const questionTransitionVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    scale: 0.95
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 300 : -300,
    opacity: 0,
    scale: 0.95
  })
};

export const questionTransition = {
  x: { 
    type: "spring", 
    stiffness: 300, 
    damping: 30 
  },
  opacity: { 
    duration: 0.2 
  },
  scale: {
    duration: 0.3,
    ease: EASING.easeInOut
  }
};
```

### Question Content Staggered Animations

```typescript
// Stagger children animations for question content
export const questionContentVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1
    }
  }
};

export const questionItemVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25
    }
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: {
      duration: 0.15
    }
  }
};
```

### Progress Bar Animations

```typescript
export const progressVariants = {
  initial: { width: 0 },
  animate: { 
    width: "var(--progress-width)",
    transition: {
      duration: 0.4,
      ease: EASING.easeOut
    }
  }
};

// Pulse effect for milestones
export const progressMilestoneVariants = {
  idle: { scale: 1 },
  pulse: {
    scale: [1, 1.1, 1],
    transition: {
      duration: 0.5,
      repeat: 2
    }
  }
};
```

---

## Micro-interactions

### Option Card Interactions

```typescript
// Option card hover and selection animations
export const optionCardVariants = {
  idle: { 
    scale: 1,
    y: 0,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
  },
  
  hover: { 
    scale: 1.02,
    y: -2,
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    transition: {
      duration: 0.2,
      ease: EASING.easeOut
    }
  },
  
  tap: { 
    scale: 0.98,
    transition: {
      duration: 0.1
    }
  },
  
  selected: {
    scale: 1.02,
    boxShadow: "0 0 0 2px var(--color-primary)",
    transition: {
      duration: 0.2,
      ease: EASING.spring
    }
  }
};

// Selection indicator animation
export const selectionIndicatorVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0,
    rotate: -180
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 25
    }
  }
};
```

### Button Interactions

```typescript
export const buttonVariants = {
  idle: { scale: 1 },
  
  hover: { 
    scale: 1.05,
    transition: {
      duration: 0.15,
      ease: EASING.easeOut
    }
  },
  
  tap: { 
    scale: 0.95,
    transition: {
      duration: 0.1
    }
  },
  
  disabled: {
    opacity: 0.6,
    scale: 1,
    transition: {
      duration: 0.2
    }
  }
};

// Button loading spinner
export const spinnerVariants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "linear"
    }
  }
};
```

### Form Input Animations

```typescript
// Text input focus animations
export const inputVariants = {
  idle: { 
    borderColor: "var(--color-border)",
    boxShadow: "none"
  },
  
  focus: {
    borderColor: "var(--color-primary)",
    boxShadow: "0 0 0 3px var(--color-primary-alpha-10)",
    transition: {
      duration: 0.2
    }
  },
  
  error: {
    borderColor: "var(--color-error)",
    boxShadow: "0 0 0 3px var(--color-error-alpha-10)",
    transition: {
      duration: 0.2
    }
  }
};

// Label float animation
export const labelVariants = {
  down: { 
    y: 0, 
    scale: 1, 
    color: "var(--color-muted)" 
  },
  up: { 
    y: -24, 
    scale: 0.85, 
    color: "var(--color-primary)",
    transition: {
      duration: 0.2,
      ease: EASING.easeOut
    }
  }
};
```

---

## Loading States

### Question Loading Skeleton

```typescript
// Skeleton pulse animation
export const skeletonVariants = {
  pulse: {
    opacity: [0.4, 0.8, 0.4],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

// Shimmer effect
export const shimmerVariants = {
  shimmer: {
    backgroundPosition: ["200% 0", "-200% 0"],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "linear"
    }
  }
};
```

### Loading Spinner Animations

```typescript
// Primary loading spinner
export const loadingSpinnerVariants = {
  spin: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "linear"
    }
  }
};

// Dots loading animation  
export const dotsVariants = {
  loading: {
    y: [0, -10, 0],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

// Staggered dots
export const dotsContainerVariants = {
  loading: {
    transition: {
      staggerChildren: 0.2
    }
  }
};
```

---

## Success and Celebration Animations

### Confetti Celebrations

```typescript
// Question completion celebration
export const questionCompleteConfetti = {
  particleCount: 30,
  spread: 45,
  origin: { y: 0.7 },
  colors: ['#3B82F6', '#10B981'],
  ticks: 100
};

// Milestone celebrations (25%, 50%, 75%, 100%)
export const milestoneConfetti = {
  '25': {
    particleCount: 20,
    spread: 35,
    origin: { y: 0.8 }
  },
  '50': {
    particleCount: 50,
    spread: 55,
    origin: { y: 0.7 }
  },
  '75': {
    particleCount: 75,
    spread: 65,
    origin: { y: 0.6 }
  },
  '100': {
    particleCount: 150,
    spread: 80,
    origin: { y: 0.5 },
    colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
  }
};

// Final completion celebration
export const completionCelebration = async () => {
  // First burst
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
  });
  
  // Second burst (delayed)
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0 }
    });
  }, 250);
  
  // Third burst (delayed)
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1 }
    });
  }, 400);
};
```

### Success Feedback Animations

```typescript
// Checkmark appearance animation
export const checkmarkVariants = {
  hidden: {
    pathLength: 0,
    opacity: 0
  },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: {
        type: "spring",
        duration: 0.6,
        bounce: 0
      },
      opacity: {
        duration: 0.2
      }
    }
  }
};

// Success badge animation
export const successBadgeVariants = {
  hidden: {
    scale: 0,
    rotate: -180
  },
  visible: {
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20
    }
  }
};
```

### Progress Celebration

```typescript
// Progress bar celebration glow
export const progressGlowVariants = {
  idle: {
    boxShadow: "none"
  },
  celebrate: {
    boxShadow: [
      "0 0 0 rgba(59, 130, 246, 0)",
      "0 0 20px rgba(59, 130, 246, 0.4)",
      "0 0 0 rgba(59, 130, 246, 0)"
    ],
    transition: {
      duration: 1,
      repeat: 2
    }
  }
};
```

---

## Performance Guidelines

### Animation Performance Best Practices

#### 1. Use Transform Properties
```css
/* Good - transforms are GPU accelerated */
.animated-element {
  transform: translateX(100px) scale(1.1);
  opacity: 0.8;
}

/* Avoid - causes layout recalculation */
.slow-element {
  left: 100px;
  width: 110%;
  visibility: hidden;
}
```

#### 2. Will-Change Optimization
```typescript
// Apply will-change before animations
const optimizeForAnimation = (element: HTMLElement) => {
  element.style.willChange = 'transform, opacity';
};

// Clean up after animations
const cleanupAnimation = (element: HTMLElement) => {
  element.style.willChange = 'auto';
};
```

#### 3. Framer Motion Performance Settings
```typescript
// Use layout animations sparingly
const performantVariants = {
  animate: {
    // Prefer transforms over layout changes
    x: 100,
    scale: 1.1,
    
    // Use layout: true only when necessary
    // layout: true
  }
};

// Enable hardware acceleration
const motionProps = {
  style: { 
    transformStyle: 'preserve-3d',
    backfaceVisibility: 'hidden'
  }
};
```

### Performance Monitoring

```typescript
// Monitor animation performance
export const useAnimationPerformance = () => {
  const [frameRate, setFrameRate] = useState(60);
  
  useEffect(() => {
    let lastTime = performance.now();
    let frameCount = 0;
    
    const measureFPS = () => {
      const currentTime = performance.now();
      frameCount++;
      
      if (currentTime - lastTime >= 1000) {
        setFrameRate(frameCount);
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    measureFPS();
  }, []);
  
  return frameRate;
};
```

---

## Accessibility Considerations

### Reduced Motion Support

```typescript
// Respect user motion preferences
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };
    
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);
  
  return prefersReducedMotion;
};

// Conditional animation variants
export const createAccessibleVariants = (normalVariants: any, reducedVariants: any) => {
  const prefersReducedMotion = useReducedMotion();
  return prefersReducedMotion ? reducedVariants : normalVariants;
};
```

### Reduced Motion Variants

```typescript
// Standard animations
const standardVariants = {
  animate: {
    x: 100,
    opacity: 1,
    transition: { duration: 0.3 }
  }
};

// Reduced motion alternatives
const reducedVariants = {
  animate: {
    opacity: 1,
    transition: { duration: 0.1 }
  }
};

// Usage in components
const AccessibleAnimation = () => {
  const variants = createAccessibleVariants(standardVariants, reducedVariants);
  
  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="animate"
    />
  );
};
```

### Focus Management During Animations

```typescript
// Manage focus during question transitions
export const useFocusManagement = () => {
  const focusQuestionTitle = useCallback(() => {
    const titleElement = document.querySelector('[role="heading"]');
    if (titleElement instanceof HTMLElement) {
      titleElement.focus();
    }
  }, []);
  
  // Focus after animation completes
  const onAnimationComplete = useCallback(() => {
    setTimeout(focusQuestionTitle, 100);
  }, [focusQuestionTitle]);
  
  return { focusQuestionTitle, onAnimationComplete };
};
```

---

## Implementation Examples

### Complete Question Transition Component

```typescript
// components/QuestionTransition.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { questionTransitionVariants, questionTransition } from '../animations';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface QuestionTransitionProps {
  children: React.ReactNode;
  questionKey: string;
  direction: number;
  onAnimationComplete?: () => void;
}

export const QuestionTransition: React.FC<QuestionTransitionProps> = ({
  children,
  questionKey,
  direction,
  onAnimationComplete
}) => {
  const prefersReducedMotion = useReducedMotion();
  
  const variants = prefersReducedMotion 
    ? {
        enter: { opacity: 0 },
        center: { opacity: 1 },
        exit: { opacity: 0 }
      }
    : questionTransitionVariants;
    
  const transition = prefersReducedMotion
    ? { duration: 0.1 }
    : questionTransition;
  
  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={questionKey}
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={transition}
        onAnimationComplete={onAnimationComplete}
        className="question-content"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
```

### Animated Option Card

```typescript
// components/AnimatedOptionCard.tsx
import { motion } from 'framer-motion';
import { optionCardVariants, selectionIndicatorVariants } from '../animations';

interface AnimatedOptionCardProps {
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export const AnimatedOptionCard: React.FC<AnimatedOptionCardProps> = ({
  selected,
  disabled,
  onClick,
  children
}) => {
  return (
    <motion.button
      variants={optionCardVariants}
      initial="idle"
      whileHover={disabled ? "idle" : "hover"}
      whileTap={disabled ? "idle" : "tap"}
      animate={selected ? "selected" : "idle"}
      onClick={onClick}
      disabled={disabled}
      className={`option-card ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
    >
      {children}
      
      <motion.div
        variants={selectionIndicatorVariants}
        initial="hidden"
        animate={selected ? "visible" : "hidden"}
        className="selection-indicator"
      >
        ✓
      </motion.div>
    </motion.button>
  );
};
```

### Progress Animation Hook

```typescript
// hooks/useProgressAnimation.ts
import { useEffect } from 'react';
import { useAnimation } from 'framer-motion';
import { createConfetti } from '../utils/confetti';

export const useProgressAnimation = (progress: number) => {
  const controls = useAnimation();
  
  useEffect(() => {
    // Animate progress bar
    controls.start({
      width: `${progress}%`,
      transition: { duration: 0.4, ease: "easeOut" }
    });
    
    // Celebrate milestones
    const milestones = [25, 50, 75, 100];
    const currentMilestone = milestones.find(milestone => 
      progress >= milestone && progress < milestone + 5
    );
    
    if (currentMilestone) {
      setTimeout(() => {
        createConfetti({
          particleCount: currentMilestone === 100 ? 150 : 30,
          spread: currentMilestone === 100 ? 80 : 45
        });
      }, 200);
    }
  }, [progress, controls]);
  
  return controls;
};
```

---

## Testing Animations

### Animation Testing Strategy

```typescript
// __tests__/animations/QuestionTransition.test.tsx
import { render } from '@testing-library/react';
import { QuestionTransition } from '../QuestionTransition';

// Mock framer-motion for testing
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, onAnimationComplete, ...props }: any) => (
      <div {...props} data-testid="motion-div">{children}</div>
    )
  },
  AnimatePresence: ({ children }: any) => <>{children}</>
}));

describe('QuestionTransition', () => {
  it('renders children correctly', () => {
    render(
      <QuestionTransition questionKey="test" direction={1}>
        <div>Test Content</div>
      </QuestionTransition>
    );
    
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
  
  it('calls onAnimationComplete when provided', () => {
    const onComplete = jest.fn();
    
    render(
      <QuestionTransition 
        questionKey="test" 
        direction={1}
        onAnimationComplete={onComplete}
      >
        <div>Test</div>
      </QuestionTransition>
    );
    
    // In real implementation, this would be triggered by animation completion
    // For testing, we can simulate it
    expect(onComplete).toHaveBeenCalled();
  });
});
```

### Performance Testing

```typescript
// __tests__/performance/animation-performance.test.ts
describe('Animation Performance', () => {
  it('maintains 60fps during transitions', async () => {
    const fps = await measureAnimationFPS();
    expect(fps).toBeGreaterThanOrEqual(55); // Allow some variance
  });
  
  it('completes transitions within expected time', async () => {
    const startTime = performance.now();
    
    // Trigger animation
    fireEvent.click(screen.getByRole('button'));
    
    await waitForAnimationComplete();
    
    const duration = performance.now() - startTime;
    expect(duration).toBeLessThan(500); // Max 500ms for transitions
  });
});
```

---

This comprehensive animation specification provides the foundation for creating smooth, accessible, and performant animations throughout the TypeForm-like Topic Builder experience.