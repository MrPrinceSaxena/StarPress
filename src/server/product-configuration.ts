import { db } from "@/lib/db";
import { productConfigurationSchema } from "@/lib/product-configuration";

export async function saveConfigurationDraft(productId: string, expectedRevision: number, input: unknown, actor: string, client: typeof db = db) {
  const configuration = productConfigurationSchema.parse(input);
  return client.$transaction(async tx => {
    // Lock the product even when no draft exists, serializing simultaneous first saves.
    const products = await tx.$queryRaw<Array<{ id: string }>>`SELECT id FROM "Product" WHERE id = ${productId} FOR UPDATE`;
    if (!products.length) throw Object.assign(new Error("Save the product before configuring it."), { statusCode: 404 });
    const current = await tx.productConfigurationDraft.findUnique({ where: { productId } });
    if ((current?.revision || 0) !== expectedRevision) throw Object.assign(new Error("Configuration changed. Reload before saving."), { statusCode: 409 });
    const revision = expectedRevision + 1;
    const data = { revision, configuration: { ...configuration, revision }, updatedBy: actor };
    const saved = await tx.productConfigurationDraft.upsert({ where: { productId }, create: { productId, ...data }, update: data });
    await tx.adminAuditLog.create({ data: { adminEmail: actor, entityType: "product_configuration", entityId: productId, action: "save_draft", changes: { previousRevision: expectedRevision, revision } } });
    return saved;
  });
}

export async function readPublishedConfiguration(productId: string, client: typeof db = db) {
  if (process.env.PRODUCT_CONFIGURATION_ENABLED === "false") return null;
  const row = await client.productConfigurationDraft.findUnique({ where: { productId } });
  return row?.published ? productConfigurationSchema.parse(row.published) : null;
}
export async function publishConfiguration(productId: string, revision: number, actor: string) {
  return db.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM "Product" WHERE id = ${productId} FOR UPDATE`;
    const draft = await tx.productConfigurationDraft.findUnique({ where: { productId } });
    if (!draft || draft.revision !== revision) throw Object.assign(new Error("Reload and save the latest draft before publishing."), { statusCode: 409 });
    const configuration = productConfigurationSchema.parse(draft.configuration);
    // Inventory is denominated in ordering units; pack size is immutable once published.
    const previous = draft.published ? productConfigurationSchema.parse(draft.published) : null;
    if (previous && (previous.quantity.unit !== configuration.quantity.unit || previous.quantity.piecesPerUnit !== configuration.quantity.piecesPerUnit)) throw Object.assign(new Error("Create a new product to change published inventory units."), { statusCode: 409 });
    await tx.productConfigurationDraft.update({ where: { productId }, data: { published: configuration } });
    await tx.adminAuditLog.create({ data: { adminEmail: actor, entityType: "product_configuration", entityId: productId, action: "publish", changes: { revision, configuration } } });
    return configuration;
  });
}
