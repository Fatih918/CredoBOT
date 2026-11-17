import test from "node:test";
import assert from "node:assert/strict";
import { isEligibleForCustomerService } from "../dist/modules/handlers/customer-service/customer-service-eligibility.js";

const directMessage = {
    from: "628123456789@s.whatsapp.net",
    fromMe: false,
    isGroup: false,
    type: "conversation",
};

test("accepts an incoming private chat", () => {
    assert.equal(isEligibleForCustomerService(directMessage), true);
});

test("accepts a direct LID chat", () => {
    assert.equal(
        isEligibleForCustomerService({
            ...directMessage,
            from: "123456789012345@lid",
        }),
        true
    );
});

test("rejects messages sent by the bot", () => {
    assert.equal(
        isEligibleForCustomerService({ ...directMessage, fromMe: true }),
        false
    );
});

test("rejects group messages even when the group flag is inconsistent", () => {
    assert.equal(
        isEligibleForCustomerService({
            ...directMessage,
            from: "123456789-987654321@g.us",
        }),
        false
    );
    assert.equal(
        isEligibleForCustomerService({ ...directMessage, isGroup: true }),
        false
    );
});

test("rejects status, broadcast, and newsletter JIDs", () => {
    for (const from of [
        "status@broadcast",
        "123456789@broadcast",
        "123456789@newsletter",
    ]) {
        assert.equal(
            isEligibleForCustomerService({ ...directMessage, from }),
            false,
            `Expected ${from} to be rejected`
        );
    }
});

test("rejects missing or unsupported event metadata", () => {
    assert.equal(
        isEligibleForCustomerService({ ...directMessage, from: undefined }),
        false
    );
    assert.equal(
        isEligibleForCustomerService({ ...directMessage, type: undefined }),
        false
    );
    assert.equal(
        isEligibleForCustomerService({
            ...directMessage,
            type: "protocolMessage",
        }),
        false
    );
    assert.equal(
        isEligibleForCustomerService({
            ...directMessage,
            type: "reactionMessage",
        }),
        false
    );
    assert.equal(
        isEligibleForCustomerService({
            ...directMessage,
            fromMe: undefined,
        }),
        false
    );
});
