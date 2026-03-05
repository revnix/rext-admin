const fs = require('fs');
const filePath = '__tests__/integration/checkout-flow.test.tsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/(import.*)useSubscriptionStore(.*;)/g, '$1useSubscriptionStore$2\nimport { useSubscriptionData } from "@/hooks/use-subscription-data";');
content = content.replace(/jest.mock\("@\/stores\/subscription-store"\);/g, 'jest.mock("@/stores/subscription-store");\njest.mock("@/hooks/use-subscription-data");');

content = content.replace(/import \{ BillingPeriod, SubscriptionStatus \} from "@\/types\/subscription";/, 'import { BillingPeriod, SubscriptionStatus, SubscriptionPlan } from "@/types/subscription";');

// In CheckoutFlowComponent
content = content.replace(/const CheckoutFlowComponent[\s\S]*?return \(/, `const CheckoutFlowComponent = () => {
  const {
    initiateCheckout,
    openCheckout,
    checkoutInProgress,
  } = useSubscriptionStore();
  const { plans, refetchAll: fetchSubscription } = useSubscriptionData();

  const handleCheckout = async (
    planId: string,
    billingPeriod: BillingPeriod,
  ) => {
    const plan = plans.find((p: SubscriptionPlan) => p.id === planId);
    if (!plan) return;

    const session = await initiateCheckout(plan, billingPeriod);
    openCheckout(session.checkout_url);
  };

  return (`);
content = content.replace(/\{plans.map\(\(plan\)/g, '{plans.map((plan: SubscriptionPlan)');


// In Setup initial store state
content = content.replace(/const mockStore = createMockSubscriptionStore\(\{[\s\S]*?\}\);/g, (match) => {
  return `const mockStore = createMockSubscriptionStore({
      checkoutInProgress: false,
    });`;
});

// Remove useSubscriptionStore mock configurations that set plans
content = content.replace(/\(useSubscriptionStore as unknown as jest\.Mock\)\.mockReturnValue\(\{[\s\S]*?\.\.\.createMockSubscriptionStore\(\{[\s\S]*?initiateCheckout,/gm, (match) => {
  return match.replace(/plans: \[[\s\S]*?\],/, '');
});


// Add useSubscriptionData mock
content = content.replace(/Object\.assign\(apiClient, mockApiClientInstance\);/g, `Object.assign(apiClient, mockApiClientInstance);
    
    (useSubscriptionData as jest.Mock).mockReturnValue({
      plans: [
        createMockSubscriptionPlan({
          id: "plan-free",
          name: "free",
          display_name: "Free Plan",
        }),
        createMockSubscriptionPlan({
          id: "plan-pro",
          name: "pro",
          display_name: "Pro Plan",
        }),
        createMockSubscriptionPlan({
          id: "plan-enterprise",
          name: "enterprise",
          display_name: "Enterprise Plan",
        }),
      ],
      refetchAll: jest.fn(),
    });`);

content = content.replace(/const initiateCheckout = jest.fn.*?\n\s*\n\s*\(useSubscriptionStore as unknown as jest\.Mock\)\.mockReturnValue\(\{/gm, (match) => {
  return match.replace(/\);/g, ');\n\n      (useSubscriptionData as jest.Mock).mockReturnValue({ plans: [createMockSubscriptionPlan({ id: "plan-pro" })], refetchAll: jest.fn() });');
});


fs.writeFileSync(filePath, content);
