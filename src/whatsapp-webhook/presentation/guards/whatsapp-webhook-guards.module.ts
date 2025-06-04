import { Module } from "@nestjs/common";
import { VerifyTokenGuard } from "./verify-token.guard";

const guards = [VerifyTokenGuard];

@Module({
    providers: guards,
    exports: guards,
})
export class WhatsappWebhookGuardsModule {}




