import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

import { errorMessage } from "../api/client";
import { useCreateClientWithDeal, useHealth, useOverride, usePipeline } from "../api/hooks";
import type { AssignmentResult, ClientCreateResult, ClientSize, Domain, Region } from "../api/types";
import { AssignmentPanel } from "../components/AssignmentPanel";
import { DomainChip } from "../components/Badges";
import { Drawer } from "../components/Overlay";
import { DOMAINS } from "../lib/domains";
import { formatINR, SIZE_LABEL } from "../lib/format";

const INDUSTRIES = ["BFSI", "Healthcare", "Retail", "Manufacturing", "Logistics", "EdTech", "Media", "Energy"];
const SIZES: ClientSize[] = ["SMB", "MID_MARKET", "ENTERPRISE"];
const REGIONS: Region[] = ["North", "South", "East", "West", "International"];

interface FormState {
  name: string;
  industry: string;
  size: ClientSize;
  region: Region;
  title: string;
  value: string;
  domain: Domain;
  expectedClose: string;
  ownerId: string; // "" = assign automatically
}

/** Last day of the month after `asOf` ("YYYY-MM-DD"), a sensible default close date. */
function defaultCloseDate(asOf: string | undefined): string {
  if (!asOf) return "";
  const [y, m] = asOf.split("-").map(Number);
  const last = new Date(Date.UTC(y, m + 1, 0)); // day 0 of month m+2 = last day of month m+1
  return last.toISOString().slice(0, 10);
}

export function NewClientDealDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="New client and deal"
      subtitle="The deal is assigned automatically unless you choose an owner."
      width={760}
    >
      <NewClientDealForm onClose={onClose} />
    </Drawer>
  );
}

function NewClientDealForm({ onClose }: { onClose: () => void }) {
  const health = useHealth();
  const pipeline = usePipeline();
  const create = useCreateClientWithDeal();
  const override = useOverride();

  const blank = (): FormState => ({
    name: "",
    industry: "Manufacturing",
    size: "MID_MARKET",
    region: "South",
    title: "",
    value: "",
    domain: "IoT",
    expectedClose: defaultCloseDate(health.data?.as_of_date),
    ownerId: "",
  });
  const [form, setForm] = useState<FormState>(blank);
  const [created, setCreated] = useState<ClientCreateResult | null>(null);
  const [assignment, setAssignment] = useState<AssignmentResult | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));
  const value = Number(form.value);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    create.mutate(
      {
        client: { name: form.name.trim(), industry: form.industry, size: form.size, region: form.region },
        deal: {
          title: form.title.trim(),
          value,
          domain: form.domain,
          expected_close_date: form.expectedClose,
          owner_id: form.ownerId || null,
        },
      },
      {
        onSuccess: (result) => {
          setCreated(result);
          setAssignment(result.assignment);
        },
      },
    );
  };

  const doOverride = (repId: string) => {
    if (!created) return;
    override.mutate({ dealId: created.deal.id, repId }, { onSuccess: setAssignment });
  };

  if (created && assignment) {
    return (
      <div className="space-y-5 px-5 py-4">
        <div className="flex items-start justify-between gap-4 rounded border border-line bg-canvas/60 px-3.5 py-3">
          <div className="text-[13px]">
            <div className="font-semibold">{created.client.name}</div>
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-ink-muted">
              <span>{created.deal.title}</span>
              <span>·</span>
              <span className="num">{formatINR(created.deal.value)}</span>
              <DomainChip domain={created.deal.domain} />
            </div>
          </div>
          <span className="text-xs text-won">Created</span>
        </div>

        <AssignmentPanel
          result={assignment}
          onOverride={doOverride}
          overridingId={override.isPending ? override.variables?.repId : null}
        />
        {override.error && <p className="text-[13px] text-lost">{errorMessage(override.error)}</p>}

        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <button
            type="button"
            className="btn"
            onClick={() => {
              setCreated(null);
              setAssignment(null);
              setForm(blank());
              create.reset();
              override.reset();
            }}
          >
            Create another
          </button>
          <Link to={`/deals/${created.deal.id}`} className="btn btn-primary" onClick={onClose}>
            Open deal
          </Link>
        </div>
      </div>
    );
  }

  const owners = [...(pipeline.data?.reps ?? [])].sort((a, b) => a.name.localeCompare(b.name));
  return (
    <form onSubmit={submit} className="space-y-6 px-5 py-4">
      <fieldset className="space-y-3">
        <legend className="section-title mb-2">Client</legend>
        <div>
          <label className="label" htmlFor="client-name">
            Company name
          </label>
          <input id="client-name" className="input" required maxLength={200} value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label" htmlFor="industry">
              Industry
            </label>
            <select id="industry" className="input" value={form.industry} onChange={(e) => set("industry", e.target.value)}>
              {INDUSTRIES.map((i) => (
                <option key={i}>{i}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="size">
              Size
            </label>
            <select id="size" className="input" value={form.size} onChange={(e) => set("size", e.target.value as ClientSize)}>
              {SIZES.map((s) => (
                <option key={s} value={s}>
                  {SIZE_LABEL[s]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="region">
              Region
            </label>
            <select id="region" className="input" value={form.region} onChange={(e) => set("region", e.target.value as Region)}>
              {REGIONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="section-title mb-2">First deal</legend>
        <div>
          <label className="label" htmlFor="title">
            Title
          </label>
          <input id="title" className="input" required maxLength={200} value={form.title} onChange={(e) => set("title", e.target.value)} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label" htmlFor="domain">
              Domain
            </label>
            <select id="domain" className="input" value={form.domain} onChange={(e) => set("domain", e.target.value as Domain)}>
              {DOMAINS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="value">
              Value (₹)
            </label>
            <input
              id="value"
              className="input num"
              required
              type="number"
              min={1}
              step={1000}
              value={form.value}
              onChange={(e) => set("value", e.target.value)}
            />
            <p className="mt-1 text-xs text-ink-faint">{value > 0 ? formatINR(value) : "Amount in rupees"}</p>
          </div>
          <div>
            <label className="label" htmlFor="close">
              Expected close
            </label>
            <input id="close" className="input" required type="date" value={form.expectedClose} onChange={(e) => set("expectedClose", e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="owner">
            Owner
          </label>
          <select id="owner" className="input" value={form.ownerId} onChange={(e) => set("ownerId", e.target.value)}>
            <option value="">Assign automatically (recommended)</option>
            {owners.map((r) => (
              <option key={r.sales_person_id} value={r.sales_person_id}>
                {r.name} ({r.open_count}/{r.capacity} open)
              </option>
            ))}
          </select>
        </div>
      </fieldset>

      {create.error && (
        <p className="rounded border border-lost/25 bg-lost-soft px-3 py-2 text-[13px] text-lost">{errorMessage(create.error)}</p>
      )}

      <div className="flex justify-end gap-2 border-t border-line pt-4">
        <button type="button" className="btn" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={create.isPending}>
          {create.isPending ? "Creating…" : "Create and assign"}
        </button>
      </div>
    </form>
  );
}
