import { Module } from "@nestjs/common";
import { WhatsappWebhookControllersModule } from "./controllers";
import { WhatsappWebhookGuardsModule } from "./guards";

const modules = [WhatsappWebhookControllersModule, WhatsappWebhookGuardsModule];

@Module({
    imports: modules,
    exports: modules,
})
export class WhatsappWebhookPresentationModule {}