import fp from "fastify-plugin";
import { connectAmqp } from "@studzee/shared";
import { config } from "../config/index.js";
/** Resilient AMQP connection. The article.published consumer is wired in P7. */
export default fp(async (app) => {
    const amqp = connectAmqp(config.rabbitmqUrl, app.log);
    app.decorate("amqp", amqp);
    app.addHook("onClose", async () => {
        await amqp.close();
    });
});
//# sourceMappingURL=amqp.js.map