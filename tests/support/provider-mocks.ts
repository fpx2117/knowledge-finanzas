export type ExternalProviderMocks = {
  openRouter: {
    generateStructured: (input: unknown) => Promise<unknown>;
  };
  mercadoPago: {
    getSubscription: (subscriptionId: string) => Promise<{ id: string }>;
  };
};

export function createExternalProviderMocks(): ExternalProviderMocks {
  return {
    openRouter: {
      generateStructured: async () => ({ suggestions: [] }),
    },
    mercadoPago: {
      getSubscription: async (subscriptionId) => ({ id: subscriptionId }),
    },
  };
}
