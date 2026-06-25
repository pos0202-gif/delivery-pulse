import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }) => {
  const { topic, shop } = await authenticate.webhook(request);

  console.log(`Received ${topic} compliance webhook for ${shop}`);

  if (topic === "SHOP_REDACT") {
    await db.deliverySettings.deleteMany({
      where: { shop },
    });

    await db.session.deleteMany({
      where: { shop },
    });
  }

  return new Response();
};