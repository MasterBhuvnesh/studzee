import fp from "fastify-plugin";
import { connectAmqp, createPublisher } from "@studzee/shared";
import { config } from "../config/index.js";
/** Resilient AMQP connection plus a confirm-channel publisher, shared app wide. */
export default fp(async (app) => {
    const amqp = connectAmqp(config.rabbitmqUrl, app.log);
    const publisher = createPublisher(amqp);
    app.decorate("amqp", amqp);
    app.decorate("publisher", publisher);
    app.addHook("onClose", async () => {
        await publisher.close();
        await amqp.close();
    });
});
//# sourceMappingURL=amqp.js.map