'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/admin/services';
import { ProductConfiguration, productConfigurationSchema } from '@/lib/product-configuration';
const initial: ProductConfiguration = { version: 1, revision: 1, quantity: { unit: 'piece', piecesPerUnit: 1, minimum: 1, maximum: 1000, step: 1 }, unitPricePaise: 0, options: [], addOns: [], fields: [], artwork: { mode: 'none', instructions: '' } };
const identifier = () => crypto.randomUUID();
export default function ProductConfigurationEditor({ productId }: { productId: string }) {
  const [config, setConfig] = useState(initial);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savedConfig, setSavedConfig] = useState('');
  const dirty = JSON.stringify(config) !== savedConfig;
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [available, setAvailable] = useState(false);
  const endpoint = `/api/admin/products/${encodeURIComponent(productId)}/configuration`;
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setAvailable(false);
    apiFetch<{ draft: { configuration: ProductConfiguration; revision: number } | null }>(endpoint).then(({ draft }) => {
      if (cancelled) return;
      setConfig(draft ? productConfigurationSchema.parse(draft.configuration) : initial);
      setRevision(draft?.revision || 0); setSavedConfig(JSON.stringify(draft ? productConfigurationSchema.parse(draft.configuration) : initial)); setAvailable(true);
    }).catch(error => { if (!cancelled) setMessage(error.message); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [endpoint]);
  async function save() {
    const parsed = productConfigurationSchema.safeParse(config);
    if (!parsed.success) { setMessage(parsed.error.issues.map(i => i.message).join('. ')); return; }
    setSaving(true); setMessage('');
    try {
      const { draft } = await apiFetch<{ draft: { revision: number; configuration: ProductConfiguration } }>(endpoint, { method: 'PUT', body: JSON.stringify({ expectedRevision: revision, configuration: parsed.data }) });
      setSavedConfig(JSON.stringify(draft.configuration)); setRevision(draft.revision); setConfig(draft.configuration); setMessage('Draft saved. Live ordering is unchanged.');
    } catch (error) { setMessage((error as Error).message); } finally { setSaving(false); }
  }
  const inputClass = 'block w-full rounded border border-slate-300 bg-white p-2 text-slate-900';
  const text = (label: string, value: string, change: (value: string) => void) => <label className="block text-sm">{label}<input className={inputClass} value={value} onChange={e => change(e.target.value)} /></label>;
  const number = (label: string, value: number, change: (value: number) => void, step = 1) => <label className="block text-sm">{label}<input type="number" min={0} step={step} className={inputClass} value={Number.isFinite(value) ? value : ''} onChange={e => change(e.target.valueAsNumber)} /></label>;
  if (loading) return <p role="status">Loading ordering configuration…</p>;
  return <section className="space-y-5 rounded-xl border bg-white p-5 text-slate-900">
    <h2 className="text-lg font-bold">Ordering configuration draft</h2>
    <p className="text-sm">Configure ordering rules here. Drafts do not change live checkout.</p>
    <fieldset disabled={!available || saving} className="space-y-5 disabled:opacity-60">
      <div className="grid gap-4 sm:grid-cols-2">
        <label>Ordering unit<select className={inputClass} value={config.quantity.unit} onChange={e => setConfig({ ...config, quantity: { ...config.quantity, unit: e.target.value as 'piece' | 'pack', piecesPerUnit: 1 } })}><option value="piece">Individual piece</option><option value="pack">Pack</option></select></label>
        {number('Price per ordering unit (₹)', config.unitPricePaise / 100, v => setConfig({ ...config, unitPricePaise: Math.round(v * 100) }), 0.01)}
        {config.quantity.unit === 'pack' && number('Pieces in each pack', config.quantity.piecesPerUnit, v => setConfig({ ...config, quantity: { ...config.quantity, piecesPerUnit: v } }))}
        {(['minimum', 'maximum', 'step'] as const).map(key => <div key={key}>{number(`Quantity ${key}`, config.quantity[key], v => setConfig({ ...config, quantity: { ...config.quantity, [key]: v } }))}</div>)}
      </div>
      <h3 className="font-bold">Product options</h3>
      {config.options.map((option, index) => <div key={option.id} className="space-y-2 rounded border p-3">
        {text('Option name', option.label, label => setConfig({ ...config, options: config.options.map((o, i) => i === index ? { ...o, label } : o) }))}
        <label><input type="checkbox" checked={option.required} onChange={e => setConfig({ ...config, options: config.options.map((o, i) => i === index ? { ...o, required: e.target.checked } : o) })} /> Required selection</label>
        {option.choices.map((choice, ci) => <div key={choice.id} className="grid gap-2 sm:grid-cols-3">
          {text('Choice', choice.label, label => setConfig({ ...config, options: config.options.map((o, i) => i === index ? { ...o, choices: o.choices.map((c, j) => j === ci ? { ...c, label } : c) } : o) }))}
          {number('Extra per unit (₹)', choice.pricePaise / 100, v => setConfig({ ...config, options: config.options.map((o, i) => i === index ? { ...o, choices: o.choices.map((c, j) => j === ci ? { ...c, pricePaise: Math.round(v * 100) } : c) } : o) }), 0.01)}
          <button type="button" onClick={() => setConfig({ ...config, options: config.options.map((o, i) => i === index ? { ...o, choices: o.choices.filter((_, j) => j !== ci) } : o) })}>Remove choice</button>
        </div>)}
        <button type="button" onClick={() => setConfig({ ...config, options: config.options.map((o, i) => i === index ? { ...o, choices: [...o.choices, { id: identifier(), label: '', pricePaise: 0 }] } : o) })}>Add choice</button>
        <button type="button" className="ml-4" onClick={() => setConfig({ ...config, options: config.options.filter((_, i) => i !== index) })}>Remove option</button>
      </div>)}
      <button type="button" onClick={() => setConfig({ ...config, options: [...config.options, { id: identifier(), label: '', required: true, choices: [] }] })}>Add product option</button>
      <h3 className="font-bold">Add-on services</h3>
      {config.addOns.map((addOn, index) => <div key={addOn.id} className="grid gap-3 rounded border p-3 sm:grid-cols-2">
        {text('Service name', addOn.label, label => setConfig({ ...config, addOns: config.addOns.map((a, i) => i === index ? { ...a, label } : a) }))}
        {number('Price (₹)', addOn.pricePaise / 100, v => setConfig({ ...config, addOns: config.addOns.map((a, i) => i === index ? { ...a, pricePaise: Math.round(v * 100) } : a) }), 0.01)}
        <label>Charge<select className={inputClass} value={addOn.charge} onChange={e => setConfig({ ...config, addOns: config.addOns.map((a, i) => i === index ? { ...a, charge: e.target.value as 'per_order' | 'per_unit' } : a) })}><option value="per_order">Once per product line</option><option value="per_unit">Per ordering unit</option></select></label>
        <button type="button" onClick={() => setConfig({ ...config, addOns: config.addOns.filter((_, i) => i !== index) })}>Remove service</button>
      </div>)}
      <button type="button" onClick={() => setConfig({ ...config, addOns: [...config.addOns, { id: identifier(), label: '', pricePaise: 0, charge: 'per_order' }] })}>Add service</button>
      <h3 className="font-bold">Customer instructions and personalization</h3>
      {config.fields.map((field, index) => <div key={field.id} className="grid gap-3 rounded border p-3 sm:grid-cols-2">
        {text('Field label', field.label, label => setConfig({ ...config, fields: config.fields.map((f, i) => i === index ? { ...f, label } : f) }))}
        {number('Maximum characters', field.maxLength, maxLength => setConfig({ ...config, fields: config.fields.map((f, i) => i === index ? { ...f, maxLength } : f) }))}
        <label><input type="checkbox" checked={field.required} onChange={e => setConfig({ ...config, fields: config.fields.map((f, i) => i === index ? { ...f, required: e.target.checked } : f) })} /> Required</label>
        <button type="button" onClick={() => setConfig({ ...config, fields: config.fields.filter((_, i) => i !== index) })}>Remove field</button>
      </div>)}
      <button type="button" onClick={() => setConfig({ ...config, fields: [...config.fields, { id: identifier(), label: '', required: false, maxLength: 200 }] })}>Add customer field</button>
      <label className="block">Artwork<select className={inputClass} value={config.artwork.mode} onChange={e => setConfig({ ...config, artwork: { ...config.artwork, mode: e.target.value as ProductConfiguration['artwork']['mode'] } })}><option value="none">Not needed</option><option value="optional">Optional</option><option value="required">Required</option></select></label>
      {text('Artwork instructions', config.artwork.instructions, instructions => setConfig({ ...config, artwork: { ...config.artwork, instructions } }))}
      <button type="button" onClick={save} className="rounded bg-slate-900 px-4 py-2 text-white">{saving ? 'Saving…' : 'Save ordering draft'}</button>
      <p>Stock is counted in ordering units. For packs, confirm stock counts packs before publishing.</p>
      <button type="button" disabled={dirty || revision === 0} onClick={async () => {
        setSaving(true);
        try { await apiFetch(endpoint, { method: 'POST', body: JSON.stringify({ revision }) }); setMessage('Saved configuration published.'); }
        catch (error) { setMessage((error as Error).message); } finally { setSaving(false); }
      }}>Publish saved configuration</button>
    </fieldset>
    <p role="status" aria-live="polite">{message}</p>
  </section>;
}
