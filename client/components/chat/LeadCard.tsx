import { MapPin, Phone, Globe, ExternalLink, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Lead {
  Name: string;
  Phone?: string;
  Address?: string;
  Website?: string;
  'Has Website': boolean;
  Rating?: number | null;
  Category?: string;
  lat?: number | null;
  lng?: number | null;
}

interface Props {
  lead: Lead;
  onSendMessage?: (msg: string) => void;
}

function StarRating({ rating }: { rating: number }) {
  const color =
    rating >= 4 ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800'
    : rating >= 3 ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800'
    : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800';
  return (
    <span className={cn('inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold shrink-0', color)}>
      ⭐ {rating.toFixed(1)}
    </span>
  );
}

export function LeadCard({ lead, onSendMessage }: Props) {
  const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const hasCoords = lead.lat != null && lead.lng != null;

  const mapUrl = hasCoords
    ? `https://maps.googleapis.com/maps/api/staticmap`
      + `?center=${lead.lat},${lead.lng}&zoom=15&size=560x200`
      + `&markers=color:red%7C${lead.lat},${lead.lng}`
      + `&key=${MAPS_KEY}`
    : null;

  const mapsLink = hasCoords
    ? `https://www.google.com/maps?q=${lead.lat},${lead.lng}`
    : `https://www.google.com/maps/search/${encodeURIComponent(lead.Address || lead.Name)}`;

  const handleAnalyze = () => {
    if (!onSendMessage) return;
    const parts = [
      lead.Name,
      lead.Address || '',
      `rating ${lead.Rating ?? 0}`,
      `category ${lead.Category || ''}`,
      `has website: ${lead['Has Website'] ? 'yes' : 'no'}`,
      `city: ${(lead.Address || '').split(',').slice(-2, -1)[0]?.trim() || ''}`,
    ];
    onSendMessage(`analyze lead: ${parts.join(' | ')}`);
  };

  return (
    <div className="mt-2 rounded-2xl border bg-white dark:bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="p-4 pb-3 space-y-2.5">
        {/* Header: name + rating */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-bold text-foreground leading-snug flex-1 min-w-0">{lead.Name}</p>
          {lead.Rating != null && <StarRating rating={lead.Rating} />}
        </div>

        {/* Category chip */}
        {lead.Category && (
          <span className="inline-flex items-center rounded-full bg-muted/60 border border-border/40 px-2 py-0.5 text-[11px] text-muted-foreground capitalize">
            {lead.Category}
          </span>
        )}

        {/* Address */}
        {lead.Address && (
          <div className="flex items-start gap-1.5 text-[12px] text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span className="line-clamp-2">{lead.Address}</span>
          </div>
        )}

        {/* Phone */}
        {lead.Phone && (
          <a
            href={`tel:${lead.Phone}`}
            className="flex items-center gap-1.5 text-[12px] text-primary hover:underline w-fit"
          >
            <Phone className="h-3.5 w-3.5 shrink-0" />
            {lead.Phone}
          </a>
        )}

        {/* Website status */}
        <div className="flex items-center gap-1.5">
          <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          {lead['Has Website'] && lead.Website ? (
            <a
              href={lead.Website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] text-green-600 dark:text-green-400 hover:underline truncate max-w-[200px]"
            >
              {lead.Website.replace(/^https?:\/\//, '')}
            </a>
          ) : lead['Has Website'] ? (
            <span className="text-[12px] text-green-600 dark:text-green-400">Has website</span>
          ) : (
            <span className="text-[12px] text-muted-foreground/60">No website</span>
          )}
        </div>

        {/* Mini map */}
        {mapUrl && (
          <img
            src={mapUrl}
            alt="Location map"
            className="w-full h-[90px] rounded-lg object-cover border border-border/30"
            loading="lazy"
          />
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 pt-0.5">
          <a
            href={mapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 h-7 rounded-full border border-border/60 bg-muted/40 px-3 text-[11px] font-medium text-foreground hover:bg-muted transition-colors"
          >
            <MapPin className="h-3 w-3" />
            Open in Maps
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
          {onSendMessage && (
            <button
              onClick={handleAnalyze}
              className="inline-flex items-center gap-1 h-7 rounded-full border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 px-3 text-[11px] font-medium text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors"
            >
              <BarChart2 className="h-3 w-3" />
              Analyze →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
