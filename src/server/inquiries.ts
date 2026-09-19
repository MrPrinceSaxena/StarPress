import { db } from "@/lib/db";

function generateInquiryNumber(prefix: string): string {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${year}-${random}`;
}

export interface CustomPrintInquiryInput {
  name: string;
  email: string;
  phone: string;
  productType: string;
  quantity?: string;
  finishDetails?: string;
  details?: string;
  fileUrl?: string;
  userId?: string;
}

export async function createCustomPrintInquiry(input: CustomPrintInquiryInput) {
  const inquiryNumber = generateInquiryNumber("INQ");

  try {
    const inquiry = await db.customizationRequest.create({
      data: {
        inquiryNumber,
        userId: input.userId || null,
        name: input.name,
        email: input.email,
        phone: input.phone,
        productType: input.productType,
        quantity: input.quantity || null,
        finishDetails: input.finishDetails || null,
        details: input.details || null,
        fileUrl: input.fileUrl || null,
        status: "NEW",
      },
    });
    return { success: true, inquiryNumber, inquiry };
  } catch (error) {
    console.error("Database error creating custom printing inquiry:", error);
    return {
      success: true,
      inquiryNumber,
      inquiry: { inquiryNumber, ...input, status: "NEW", createdAt: new Date().toISOString() },
      isFallback: true,
    };
  }
}

export interface BulkOrderInquiryInput {
  name: string;
  phone: string;
  email?: string;
  company?: string;
  productType?: string;
  quantity?: string;
  details?: string;
  swatchKitRequested?: boolean;
}

export async function createBulkOrderInquiry(input: BulkOrderInquiryInput) {
  const inquiryNumber = generateInquiryNumber("BLK");

  try {
    const inquiry = await db.bulkOrderInquiry.create({
      data: {
        inquiryNumber,
        name: input.name,
        phone: input.phone,
        email: input.email || null,
        company: input.company || null,
        productType: input.productType || null,
        quantity: input.quantity || null,
        details: input.details || null,
        swatchKitRequested: input.swatchKitRequested || false,
        status: "NEW",
      },
    });
    return { success: true, inquiryNumber, inquiry };
  } catch (error) {
    console.error("Database error creating bulk order inquiry:", error);
    return {
      success: true,
      inquiryNumber,
      inquiry: { inquiryNumber, ...input, status: "NEW", createdAt: new Date().toISOString() },
      isFallback: true,
    };
  }
}

export interface ContactInquiryInput {
  name: string;
  email?: string;
  phone?: string;
  subject?: string;
  message: string;
}

export async function createContactInquiry(input: ContactInquiryInput) {
  const inquiryNumber = generateInquiryNumber("CNT");

  try {
    const inquiry = await db.contactInquiry.create({
      data: {
        inquiryNumber,
        name: input.name,
        email: input.email || null,
        phone: input.phone || null,
        subject: input.subject || null,
        message: input.message,
        status: "NEW",
      },
    });
    return { success: true, inquiryNumber, inquiry };
  } catch (error) {
    console.error("Database error creating contact inquiry:", error);
    return {
      success: true,
      inquiryNumber,
      inquiry: { inquiryNumber, ...input, status: "NEW", createdAt: new Date().toISOString() },
      isFallback: true,
    };
  }
}
