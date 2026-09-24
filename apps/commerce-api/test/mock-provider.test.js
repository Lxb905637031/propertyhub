const assert = require("node:assert/strict");
const test = require("node:test");
const {
  MockPaymentProvider,
} = require("../dist/integrations/providers/mock.providers.js");

test("mock payment callbacks remain verifiable after provider restart", async () => {
  const firstProvider = new MockPaymentProvider();
  const payment = await firstProvider.createPayment({
    orderId: "order-restart",
    amount: 99,
    idempotencyKey: "order-restart",
    scenario: "success",
  });

  const afterRestartProvider = new MockPaymentProvider();
  const callback = await afterRestartProvider.verifyCallback({
    paymentId: payment.paymentId,
    idempotencyKey: `callback:${payment.paymentId}`,
    signature: "mock-signature",
  });

  assert.equal(callback.accepted, true);
  assert.equal(callback.status, "SUCCEEDED");
});
