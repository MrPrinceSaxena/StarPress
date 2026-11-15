import { z } from "zod";
const id = z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/);
const money = z.number().int().min(0).max(100000000);
const choice = z.object({ id, label: z.string().min(1).max(120), pricePaise: money });
export const productConfigurationSchema = z.object({
  version: z.literal(1),
  revision: z.number().int().positive(),
  quantity: z.object({
    unit: z.enum(["piece", "pack"]), piecesPerUnit: z.number().int().positive().max(1000000),
    minimum: z.number().int().positive(), maximum: z.number().int().positive().max(1000000),
    step: z.number().int().positive(),
  }).refine(q => q.maximum >= q.minimum && (q.unit !== "piece" || q.piecesPerUnit === 1), "Invalid quantity rules"),
  unitPricePaise: money,
  options: z.array(z.object({ id, label: z.string().min(1).max(120), required: z.boolean(), choices: z.array(choice).min(1).max(100) })).max(30),
  addOns: z.array(choice.extend({ charge: z.enum(["per_order", "per_unit"]) })).max(30),
  fields: z.array(z.object({ id, label: z.string().min(1).max(120), required: z.boolean(), maxLength: z.number().int().min(1).max(5000) })).max(30),
  artwork: z.object({ mode: z.enum(["none", "optional", "required"]), instructions: z.string().max(2000) }),
}).superRefine((config, ctx) => {
  for (const entries of [config.options, config.addOns, config.fields, ...config.options.map(o => o.choices)]) {
    if (new Set(entries.map(e => e.id)).size !== entries.length) ctx.addIssue({ code: "custom", message: "Configuration identifiers must be unique" });
  }
});
export type ProductConfiguration = z.infer<typeof productConfigurationSchema>;

export function priceConfiguration(config: ProductConfiguration, quantity: number, selections: Record<string, string>, addOnIds: string[]) {
  const q = config.quantity;
  if (!Number.isInteger(quantity) || quantity < q.minimum || quantity > q.maximum || (quantity - q.minimum) % q.step) throw new Error("Invalid quantity");
  if (Object.keys(selections).some(key => !config.options.some(o => o.id === key))) throw new Error("Unknown option");
  let unit = config.unitPricePaise;
  for (const option of config.options) {
    const selected = selections[option.id];
    if (!selected && !option.required) continue;
    const value = option.choices.find(c => c.id === selected);
    if (!value) throw new Error(`Select a valid ${option.label}`);
    unit += value.pricePaise;
  }
  if (new Set(addOnIds).size !== addOnIds.length) throw new Error("Duplicate add-on");
  let total = unit * quantity;
  for (const selected of addOnIds) {
    const addOn = config.addOns.find(a => a.id === selected);
    if (!addOn) throw new Error("Unknown add-on");
    total += addOn.pricePaise * (addOn.charge === "per_unit" ? quantity : 1);
  }
  if (!Number.isSafeInteger(total)) throw new Error("Price exceeds supported range");
  return { totalPaise: total, quantity, pieces: quantity * q.piecesPerUnit, revision: config.revision };
}

export const configurationSelectionSchema = z.object({
  revision: z.number().int().positive(),
  selections: z.record(z.string().max(80), z.string().max(80)).refine(v => Object.keys(v).length <= 30),
  addOnIds: z.array(z.string().max(80)).max(30),
  fields: z.record(z.string().max(80), z.string().max(5000)).refine(v => Object.keys(v).length <= 30),
});
export type ConfigurationSelection = z.infer<typeof configurationSelectionSchema>;
export function validateConfigurationSelection(config: ProductConfiguration, selection: ConfigurationSelection) {
  if (selection.revision !== config.revision) throw new Error('Product options changed. Reconfigure this item.');
  if (Object.keys(selection.fields).some(id => !config.fields.some(f => f.id === id))) throw new Error('Unknown customization field');
  for (const field of config.fields) {
    const value = selection.fields[field.id]?.trim() || '';
    if ((field.required && !value) || value.length > field.maxLength) throw new Error(`Check ${field.label}`);
  }
}
