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

  const cleanBlockedDates = String(formData.get("blockedDates") || "")
    .split(/\r?\n/)
    .map((date) => date.trim())
    .filter(Boolean)
    .join("\n");

  const settingsData = {
    enabled: formData.get("enabled") === "on",
    minimumPreparationDays: Number(formData.get("minimumPreparationDays") || 1),

    enableMorning: formData.get("enableMorning") === "on",
    enableAfternoon: formData.get("enableAfternoon") === "on",
    enableEvening: formData.get("enableEvening") === "on",

    morningLabel: formData.get("morningLabel") || "Morning",
    afternoonLabel: formData.get("afternoonLabel") || "Afternoon",
    eveningLabel: formData.get("eveningLabel") || "Evening",

    disableSunday: formData.get("disableSunday") === "on",
    blockedDates: cleanBlockedDates,
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
    },
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
                  label="Enable morning slot"
                  defaultChecked={settings.enableMorning}
                />

                <s-text-field
                  name="morningLabel"
                  label="Morning label"
                  defaultValue={settings.morningLabel || "Morning"}
                />

                <s-checkbox
                  name="enableAfternoon"
                  label="Enable afternoon slot"
                  defaultChecked={settings.enableAfternoon}
                />

                <s-text-field
                  name="afternoonLabel"
                  label="Afternoon label"
                  defaultValue={settings.afternoonLabel || "Afternoon"}
                />

                <s-checkbox
                  name="enableEvening"
                  label="Enable evening slot"
                  defaultChecked={settings.enableEvening}
                />

                <s-text-field
                  name="eveningLabel"
                  label="Evening label"
                  defaultValue={settings.eveningLabel || "Evening"}
                />
              </s-stack>
            </s-section>

            <s-section heading="Delivery Restrictions">
              <s-stack direction="block" gap="base">
                <s-checkbox
                  name="disableSunday"
                  label="Disable Sunday delivery"
                  defaultChecked={settings.disableSunday}
                />

                <s-text-area
                  name="blockedDates"
                  label="Blocked delivery dates"
                  rows="6"
                  defaultValue={settings.blockedDates || ""}
                  placeholder={"2026-12-25\n2026-12-31\n2027-01-01"}
                />

                <s-paragraph>
                  Enter one blocked delivery date per line. Format: YYYY-MM-DD.
                </s-paragraph>
              </s-stack>
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

      <s-section slot="aside" heading="DeliveryPulse Features">
        <s-unordered-list>
          <s-list-item>Delivery date picker</s-list-item>
          <s-list-item>Delivery time slots</s-list-item>
          <s-list-item>Minimum preparation days</s-list-item>
          <s-list-item>Blocked delivery dates</s-list-item>
          <s-list-item>Disable Sunday delivery</s-list-item>
          <s-list-item>Order delivery attributes</s-list-item>
        </s-unordered-list>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};