'use client';
import { useState } from 'react';
import { CatalogProduct } from '@/lib/catalog';
import { ProductConfiguration, priceConfiguration, validateConfigurationSelection } from '@/lib/product-configuration';
import { useCart } from '@/context/CartContext';
import { apiFetch } from '@/lib/admin/services';
export default function ConfiguredProduct({ product, config }: { product: CatalogProduct; config: ProductConfiguration }) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(config.quantity.minimum);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [addOnIds, setAddOns] = useState<string[]>([]);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [artworkUrl, setArtwork] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const selection = { revision: config.revision, selections, addOnIds, fields };
  let total: number | null = null;
  try { total = priceConfiguration(config, quantity, selections, addOnIds).totalPaise / 100; } catch {}
  const input = 'block w-full rounded-lg border border-border-subtle bg-bg-surface p-3 text-text-primary';
  return <section className="space-y-5">
    {config.options.map(option => <label key={option.id} className="block">{option.label}{option.required ? ' *' : ''}<select className={input} value={selections[option.id] || ''} onChange={e => setSelections({ ...selections, [option.id]: e.target.value })}><option value="">Select {option.label}</option>{option.choices.map(c => <option key={c.id} value={c.id}>{c.label} (+₹{c.pricePaise / 100})</option>)}</select></label>)}
    <label className="block">Quantity ({config.quantity.unit}s){config.quantity.unit === 'pack' ? ` — ${config.quantity.piecesPerUnit} pieces per pack` : ''}<input className={input} type="number" min={config.quantity.minimum} max={config.quantity.maximum} step={config.quantity.step} value={quantity} onChange={e => setQuantity(e.target.valueAsNumber)} /></label>
    {config.addOns.map(a => <label key={a.id} className="block"><input type="checkbox" checked={addOnIds.includes(a.id)} onChange={e => setAddOns(e.target.checked ? [...addOnIds, a.id] : addOnIds.filter(id => id !== a.id))} /> {a.label} — ₹{a.pricePaise / 100} {a.charge === 'per_unit' ? 'per unit' : 'per product line'}</label>)}
    {config.fields.map(f => <label key={f.id} className="block">{f.label}{f.required ? ' *' : ''}<textarea className={input} maxLength={f.maxLength} required={f.required} value={fields[f.id] || ''} onChange={e => setFields({ ...fields, [f.id]: e.target.value })} /></label>)}
    {config.artwork.mode !== 'none' && <label className="block">Artwork ({config.artwork.mode})<p>{config.artwork.instructions}</p><input type="file" accept=".pdf,.png,.jpg,.jpeg" disabled={busy} onChange={async e => {
      const file = e.target.files?.[0]; if (!file) return;
      if (file.size > 4 * 1024 * 1024) { setMessage('Maximum file size is 4 MB.'); return; }
      setBusy(true); setArtwork('');
      try { const result = await apiFetch<{ url: string }>('/api/artwork', { method: 'POST', headers: { 'Content-Type': file.type }, body: file }); setArtwork(result.url); setMessage('Artwork uploaded.'); }
      catch (error) { setMessage((error as Error).message); } finally { setBusy(false); }
    }} /><p className="text-sm">PDF, PNG or JPEG, up to 4 MB. Sign in to upload.</p></label>}
    <p className="text-xl font-bold">{total === null ? 'Select your options to see the price' : `₹${total.toFixed(2)}`}</p>
    <button type="button" disabled={busy || total === null} className="rounded-lg bg-brand-yellow px-6 py-3 text-black disabled:opacity-50" onClick={() => {
      try {
        validateConfigurationSelection(config, selection);
        if (config.artwork.mode === 'required' && !artworkUrl) throw new Error('Upload your artwork first.');
        const priced = priceConfiguration(config, quantity, selections, addOnIds);
        addItem({ id: crypto.randomUUID(), productId: product.id, productSlug: product.slug, name: product.name, price: priced.totalPaise / 100 / quantity, quantity, imageSrc: product.images[0], href: `/shop/${product.slug}`, artworkUrl, specs: { configurationSelection: selection, configuration: config }, customizations: { notes: config.fields.map(f => `${f.label}: ${fields[f.id] || ''}`).join('\n') } }, quantity);
        setMessage('Added to cart.');
      } catch (error) { setMessage((error as Error).message); }
    }}>Add to cart</button><p role="status" aria-live="polite">{busy ? 'Uploading artwork…' : message}</p>
  </section>;
}
