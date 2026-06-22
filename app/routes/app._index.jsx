import { useEffect } from "react";
import { useFetcher, useLoaderData } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);

  let settings = await db.deliverySettings.findUnique({
    where: { shop: session.shop },
  });

  if (!settings) {
    settings = await db.deliverySettings.create({
      data: { shop: session.shop },
    });
  }

  return { settings };
};

export const action = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();

  const settingsData = {
    enabled: formData.get("enabled") === "on",
    minimumPreparationDays: Number(formData.get("minimumPreparationDays") || 1),
    enableMorning: formData.get("enableMorning") === "on",
    enableAfternoon: formData.get("enableAfternoon") === "on",
    enableEvening: formData.get("enableEvening") === "on",
    disableSunday: formData.get("disableSunday") === "on",
  };

  const settings = await db.deliverySettings.upsert({
    where: { shop: session.shop },
    update: settingsData,
    create: {
      shop: session.shop,
      ...settingsData,
    },
  });

  const shopResponse = await admin.graphql(`
    #graphql
    query {
      shop {
        id
      }
    }
  `);

  const shopJson = await shopResponse.json();
  const shopId = shopJson.data.shop.id;

  await admin.graphql(
    `
    #graphql
    mutation SaveDeliveryPulseSettings($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields {
          id
          namespace
          key
          value
        }
        userErrors {
          field
          message
        }
      }
    }
    `,
    {
      variables: {
        metafields: [
          {
            ownerId: shopId,
            namespace: "deliverypulse",
            key: "settings",
            type: "json",
            value: JSON.stringify(settingsData),
          },
        ],
      },
    }
  );

  return { success: true, settings };
};

export default function Index() {
  const { settings } = useLoaderData();
  const fetcher = useFetcher();
  const shopify = useAppBridge();

  useEffect(() => {
    if (fetcher.data?.success) {
      shopify.toast.show("Settings saved");
    }
  }, [fetcher.data?.success, shopify]);

  const isSaving = fetcher.state === "submitting";

  return (
    <s-page heading="DeliveryPulse Settings">
      <s-section heading="Delivery Date Picker">
        <s-paragraph>
          Let customers choose their preferred delivery date and time slot on
          the product page.
        </s-paragraph>

        <fetcher.Form method="post">
          <s-stack direction="block" gap="base">
            <s-checkbox
              name="enabled"
              label="Enable Delivery Picker"
              defaultChecked={settings.enabled}
            />

            <s-text-field
              name="minimumPreparationDays"
              label="Minimum preparation days"
              type="number"
              min="0"
              defaultValue={String(settings.minimumPreparationDays)}
            />

            <s-section heading="Available Time Slots">
              <s-stack direction="block" gap="base">
                <s-checkbox
                  name="enableMorning"
                  label="Morning"
                  defaultChecked={settings.enableMorning}
                />

                <s-checkbox
                  name="enableAfternoon"
                  label="Afternoon"
                  defaultChecked={settings.enableAfternoon}
                />

                <s-checkbox
                  name="enableEvening"
                  label="Evening"
                  defaultChecked={settings.enableEvening}
                />
              </s-stack>
            </s-section>

            <s-section heading="Disabled Days">
              <s-checkbox
                name="disableSunday"
                label="Disable Sunday delivery"
                defaultChecked={settings.disableSunday}
              />
            </s-section>

            <s-button
              type="submit"
              variant="primary"
              {...(isSaving ? { loading: true } : {})}
            >
              Save settings
            </s-button>
          </s-stack>
        </fetcher.Form>
      </s-section>

      <s-section slot="aside" heading="MVP Plan">
        <s-unordered-list>
          <s-list-item>Show date picker on product page</s-list-item>
          <s-list-item>Let customers choose a delivery time slot</s-list-item>
          <s-list-item>Save choices into cart/order attributes</s-list-item>
          <s-list-item>Let merchants manage delivery rules</s-list-item>
        </s-unordered-list>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};