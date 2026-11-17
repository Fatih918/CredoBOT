import type { Client } from "../../../libs/client/client";
import type { MessageSerialize } from "../../../types/structure/serialize";
import {
    isEligibleForCustomerService,
} from "./customer-service-eligibility";

/**
 * Entry point for Credo-Store private-chat automation.
 *
 * This PR intentionally establishes the isolated integration boundary only.
 * Greeting, catalog lookup, and FAQ responses are added in later PRs after
 * their business configuration and persistence are defined.
 */
export class CustomerServiceHandler {
    static async handle(
        _Chisato: Client,
        message: MessageSerialize,
        context: any
    ): Promise<boolean> {
        if (
            !isEligibleForCustomerService(message) ||
            context?.isGroup ||
            context?.isCmd ||
            context?.cmd
        ) {
            return false;
        }

        // No automated response in this foundation PR.
        // Returning false preserves existing AFK and normal message handling.
        return false;
    }
}
