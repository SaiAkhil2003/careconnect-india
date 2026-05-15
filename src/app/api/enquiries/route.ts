import { NextRequest, NextResponse } from "next/server";
import {
  sendFamilyEnquiryConfirmation,
  sendProviderLeadEmail,
} from "@/lib/notifications/email";
import { sendProviderWhatsAppLead } from "@/lib/notifications/whatsapp";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createE2eMockEnquiry,
  E2E_MOCK_PROVIDERS,
  isE2eMockMode,
} from "@/lib/testing/e2e-mocks";
import type { Enquiry, Provider } from "@/lib/types";

export const dynamic = "force-dynamic";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type EnquiryPayload = {
  provider_id?: unknown;
  family_name?: unknown;
  family_phone?: unknown;
  family_email?: unknown;
  message?: unknown;
  service_needed?: unknown;
};

type ProviderForDelivery = Pick<
  Provider,
  | "id"
  | "provider_name"
  | "email"
  | "lead_email"
  | "lead_whatsapp"
  | "listing_tier"
>;

type DeliverySummary = {
  family_email_attempted: boolean;
  provider_email_attempted: boolean;
  whatsapp_attempted: boolean;
  provider_delivery_success: boolean;
};

function jsonResponse<T>(
  body: { success: true; data: T } | { success: false; error: string },
  status = 200,
) {
  return NextResponse.json(body, { status });
}

function requiredString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function optionalString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getProviderLeadEmail(provider: ProviderForDelivery) {
  return provider.lead_email ?? provider.email;
}

function getDeliveryMethod(
  emailDelivered: boolean,
  whatsappDelivered: boolean,
): Enquiry["delivery_method"] | null {
  if (emailDelivered && whatsappDelivered) {
    return "both";
  }

  if (emailDelivered) {
    return "email";
  }

  if (whatsappDelivered) {
    return "whatsapp";
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    let payload: EnquiryPayload;

    try {
      payload = (await request.json()) as EnquiryPayload;
    } catch {
      return jsonResponse(
        { success: false, error: "Request body must be valid JSON." },
        400,
      );
    }

    const providerId = requiredString(payload.provider_id);
    const familyName = requiredString(payload.family_name);
    const familyPhone = requiredString(payload.family_phone);
    const serviceNeeded = requiredString(payload.service_needed);
    const familyEmail = optionalString(payload.family_email);
    const message = optionalString(payload.message);

    if (!providerId) {
      return jsonResponse(
        { success: false, error: "provider_id is required." },
        400,
      );
    }

    if (!UUID_PATTERN.test(providerId)) {
      return jsonResponse(
        { success: false, error: "provider_id must be a valid UUID." },
        400,
      );
    }

    if (!familyName) {
      return jsonResponse(
        { success: false, error: "family_name is required." },
        400,
      );
    }

    if (!familyPhone) {
      return jsonResponse(
        { success: false, error: "family_phone is required." },
        400,
      );
    }

    if (!serviceNeeded) {
      return jsonResponse(
        { success: false, error: "service_needed is required." },
        400,
      );
    }

    if (isE2eMockMode()) {
      const provider = E2E_MOCK_PROVIDERS.find(
        (mockProvider) =>
          mockProvider.id === providerId && mockProvider.is_active,
      );

      if (!provider) {
        return jsonResponse(
          { success: false, error: "Provider not found." },
          404,
        );
      }

      const deliverySummary: DeliverySummary = {
        family_email_attempted: Boolean(familyEmail),
        provider_email_attempted: false,
        whatsapp_attempted: false,
        provider_delivery_success: false,
      };

      return jsonResponse<{
        enquiry: Enquiry;
        delivery_summary: DeliverySummary;
      }>({
        success: true,
        data: {
          enquiry: createE2eMockEnquiry({
            provider_id: providerId,
            family_name: familyName,
            family_phone: familyPhone,
            family_email: familyEmail,
            service_needed: serviceNeeded,
            message,
          }),
          delivery_summary: deliverySummary,
        },
      });
    }

    const supabase = createSupabaseServerClient();
    const { data: provider, error: providerError } = await supabase
      .from("providers")
      .select("id, provider_name, email, lead_email, lead_whatsapp, listing_tier")
      .eq("id", providerId)
      .eq("is_active", true)
      .maybeSingle();

    if (providerError) {
      return jsonResponse(
        { success: false, error: "Unable to validate provider." },
        500,
      );
    }

    if (!provider) {
      return jsonResponse(
        { success: false, error: "Provider not found." },
        404,
      );
    }

    const { data: enquiry, error: insertError } = await supabase
      .from("enquiries")
      .insert({
        provider_id: providerId,
        family_name: familyName,
        family_phone: familyPhone,
        family_email: familyEmail,
        message,
        service_needed: serviceNeeded,
        delivery_method: "email",
      })
      .select("*")
      .single();

    if (insertError) {
      return jsonResponse(
        { success: false, error: "Unable to create enquiry." },
        500,
      );
    }

    const { error: analyticsError } = await supabase.rpc(
      "increment_provider_analytics",
      {
        target_provider_id: providerId,
        metric: "enquiry_count",
      },
    );

    if (analyticsError) {
      console.error("Failed to increment enquiry count", analyticsError);
    }

    const deliverySummary: DeliverySummary = {
      family_email_attempted: Boolean(familyEmail),
      provider_email_attempted: false,
      whatsapp_attempted: false,
      provider_delivery_success: false,
    };
    const providerForDelivery = provider as ProviderForDelivery;

    if (familyEmail) {
      await sendFamilyEnquiryConfirmation({
        family_email: familyEmail,
        family_name: familyName,
        provider_name: providerForDelivery.provider_name,
        service_needed: serviceNeeded,
      });
    }

    const providerLeadEmail = getProviderLeadEmail(providerForDelivery);
    const shouldSendProviderEmail =
      (providerForDelivery.listing_tier === "standard" ||
        providerForDelivery.listing_tier === "premium") &&
      Boolean(providerLeadEmail);

    let providerEmailDelivered = false;

    if (shouldSendProviderEmail) {
      deliverySummary.provider_email_attempted = true;
      providerEmailDelivered = await sendProviderLeadEmail({
        lead_email: providerLeadEmail,
        provider_name: providerForDelivery.provider_name,
        family_name: familyName,
        family_phone: familyPhone,
        family_email: familyEmail,
        service_needed: serviceNeeded,
        message,
      });
    }

    const shouldSendWhatsApp =
      providerForDelivery.listing_tier === "premium" &&
      Boolean(providerForDelivery.lead_whatsapp);
    let whatsappDelivered = false;

    if (shouldSendWhatsApp) {
      deliverySummary.whatsapp_attempted = true;
      whatsappDelivered = await sendProviderWhatsAppLead({
        listing_tier: providerForDelivery.listing_tier,
        lead_whatsapp: providerForDelivery.lead_whatsapp,
        provider_name: providerForDelivery.provider_name,
        family_name: familyName,
        family_phone: familyPhone,
        service_needed: serviceNeeded,
        message,
      });
    }

    deliverySummary.provider_delivery_success =
      providerEmailDelivered || whatsappDelivered;

    const deliveryMethod = getDeliveryMethod(
      providerEmailDelivered,
      whatsappDelivered,
    );
    let savedEnquiry = enquiry;

    if (deliverySummary.provider_delivery_success && deliveryMethod) {
      const { data: updatedEnquiry, error: deliveryUpdateError } =
        await supabase
          .from("enquiries")
          .update({
            is_delivered: true,
            delivery_method: deliveryMethod,
          })
          .eq("id", enquiry.id)
          .select("*")
          .single();

      if (deliveryUpdateError) {
        console.error(
          "Failed to update enquiry delivery status",
          deliveryUpdateError.message,
        );
      } else {
        savedEnquiry = updatedEnquiry;
      }
    }

    return jsonResponse<{
      enquiry: Enquiry;
      delivery_summary: DeliverySummary;
    }>({
      success: true,
      data: {
        enquiry: savedEnquiry,
        delivery_summary: deliverySummary,
      },
    });
  } catch (error) {
    console.error("POST /api/enquiries failed", error);

    return jsonResponse(
      { success: false, error: "Unexpected server error." },
      500,
    );
  }
}
