import { useEffect, useState } from 'react';
import { LivingAppsService } from '@/services/livingAppsService';
import type { Dozenten, Teilnehmer, Raeume, Kurse, Anmeldungen } from '@/types/app';
import { format, isAfter, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  BookOpen,
  CalendarCheck,
  DoorOpen,
  GraduationCap,
  TrendingUp,
  Users,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Link } from 'react-router-dom';

interface AllStats {
  dozenten: Dozenten[];
  teilnehmer: Teilnehmer[];
  raeume: Raeume[];
  kurse: Kurse[];
  anmeldungen: Anmeldungen[];
  loading: boolean;
}

function ColoredStatCard({
  label,
  value,
  sub,
  icon: Icon,
  gradient,
  href,
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ElementType;
  gradient: string;
  href: string;
}) {
  return (
    <Link to={href} className="block group">
      <div className={`stat-card-colored ${gradient} transition-smooth group-hover:scale-[1.02]`}>
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium" style={{ opacity: 0.85 }}>{label}</p>
            <p className="text-3xl font-extrabold mt-1 tracking-tight">{value}</p>
            <p className="text-xs mt-1" style={{ opacity: 0.7 }}>{sub}</p>
          </div>
          <div className="rounded-xl p-2.5" style={{ background: 'oklch(1 0 0 / 0.15)' }}>
            <Icon size={22} />
          </div>
        </div>
      </div>
    </Link>
  );
}

function UpcomingKurseCard({ kurse, dozenten }: { kurse: Kurse[]; dozenten: Dozenten[] }) {
  const today = new Date();
  const upcoming = kurse
    .filter((k) => k.fields.startdatum && isAfter(parseISO(k.fields.startdatum), today))
    .sort((a, b) => (a.fields.startdatum! > b.fields.startdatum! ? 1 : -1))
    .slice(0, 5);

  const dozentenMap = new Map(dozenten.map((d) => [d.record_id, d.fields.name]));

  const statusStyle: Record<string, { bg: string; text: string; label: string }> = {
    geplant: { bg: '#fef3c7', text: '#b45309', label: 'Geplant' },
    aktiv: { bg: '#d1fae5', text: '#065f46', label: 'Aktiv' },
    abgeschlossen: { bg: '#f1f5f9', text: '#475569', label: 'Abgeschlossen' },
    abgesagt: { bg: '#fee2e2', text: '#b91c1c', label: 'Abgesagt' },
  };

  return (
    <div className="bg-card rounded-xl shadow-card p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-bold text-foreground">Bevorstehende Kurse</h3>
        <Link to="/kurse" className="text-xs text-primary font-semibold hover:underline">
          Alle anzeigen →
        </Link>
      </div>
      {upcoming.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">Keine bevorstehenden Kurse</p>
      ) : (
        <div className="space-y-3">
          {upcoming.map((kurs) => {
            const dozentId = kurs.fields.dozent
              ? kurs.fields.dozent.match(/([a-f0-9]{24})$/i)?.[1]
              : null;
            const dozentName = dozentId ? dozentenMap.get(dozentId) : null;
            const status = kurs.fields.status ?? 'geplant';
            const s = statusStyle[status] ?? statusStyle.geplant;
            return (
              <div
                key={kurs.record_id}
                className="flex items-center gap-4 p-3 rounded-lg transition-smooth"
                style={{ background: 'oklch(0.97 0.004 264)' }}
              >
                <div className="flex-shrink-0 w-10 h-10 gradient-card-indigo rounded-lg flex items-center justify-center">
                  <BookOpen size={16} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{kurs.fields.titel}</p>
                  <p className="text-xs text-muted-foreground">
                    {kurs.fields.startdatum
                      ? format(parseISO(kurs.fields.startdatum), 'dd. MMM yyyy', { locale: de })
                      : '—'}
                    {dozentName ? ` · ${dozentName}` : ''}
                  </p>
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                  style={{ background: s.bg, color: s.text }}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AnmeldungenStatusCard({ anmeldungen }: { anmeldungen: Anmeldungen[] }) {
  const bezahlt = anmeldungen.filter((a) => a.fields.bezahlt === true).length;
  const offen = anmeldungen.filter((a) => !a.fields.bezahlt).length;
  const total = anmeldungen.length;
  const pct = total > 0 ? Math.round((bezahlt / total) * 100) : 0;

  return (
    <div className="bg-card rounded-xl shadow-card p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-bold">Zahlungsstatus</h3>
        <Link to="/anmeldungen" className="text-xs text-primary font-semibold hover:underline">
          Details →
        </Link>
      </div>
      <div className="flex items-end gap-3 mb-4">
        <span className="text-4xl font-extrabold text-foreground">{pct}%</span>
        <span className="text-sm text-muted-foreground mb-1.5">bezahlt</span>
      </div>
      <div className="w-full rounded-full h-2.5 mb-4" style={{ background: 'oklch(0.94 0.008 264)' }}>
        <div
          className="h-2.5 rounded-full gradient-card-green transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg p-3 text-center" style={{ background: '#f0fdf4' }}>
          <p className="text-xl font-bold" style={{ color: '#15803d' }}>{bezahlt}</p>
          <p className="text-xs font-medium" style={{ color: '#16a34a' }}>Bezahlt</p>
        </div>
        <div className="rounded-lg p-3 text-center" style={{ background: '#fffbeb' }}>
          <p className="text-xl font-bold" style={{ color: '#b45309' }}>{offen}</p>
          <p className="text-xs font-medium" style={{ color: '#d97706' }}>Ausstehend</p>
        </div>
      </div>
    </div>
  );
}

function KurseStatusChart({ kurse }: { kurse: Kurse[] }) {
  const data = [
    { name: 'Geplant', count: kurse.filter((k) => k.fields.status === 'geplant').length, fill: 'oklch(0.62 0.18 84)' },
    { name: 'Aktiv', count: kurse.filter((k) => k.fields.status === 'aktiv').length, fill: 'oklch(0.5 0.15 152)' },
    { name: 'Abgeschlossen', count: kurse.filter((k) => k.fields.status === 'abgeschlossen').length, fill: 'oklch(0.45 0.22 264)' },
    { name: 'Abgesagt', count: kurse.filter((k) => k.fields.status === 'abgesagt').length, fill: 'oklch(0.55 0.2 30)' },
  ];

  return (
    <div className="bg-card rounded-xl shadow-card p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-bold">Kurse nach Status</h3>
        <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1" style={{ background: 'oklch(0.94 0.008 264)' }}>
          <TrendingUp size={13} className="text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-medium">{kurse.length} gesamt</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} barSize={48}>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.01 264)" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: 'oklch(0.52 0.02 264)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'oklch(0.52 0.02 264)' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: 'white',
              border: '1px solid oklch(0.9 0.01 264)',
              borderRadius: '0.75rem',
              fontSize: '12px',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
            }}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<AllStats>({
    dozenten: [],
    teilnehmer: [],
    raeume: [],
    kurse: [],
    anmeldungen: [],
    loading: true,
  });

  useEffect(() => {
    Promise.all([
      LivingAppsService.getDozenten(),
      LivingAppsService.getTeilnehmer(),
      LivingAppsService.getRaeume(),
      LivingAppsService.getKurse(),
      LivingAppsService.getAnmeldungen(),
    ])
      .then(([dozenten, teilnehmer, raeume, kurse, anmeldungen]) => {
        setStats({ dozenten, teilnehmer, raeume, kurse, anmeldungen, loading: false });
      })
      .catch(() => setStats((s) => ({ ...s, loading: false })));
  }, []);

  const { dozenten, teilnehmer, raeume, kurse, anmeldungen, loading } = stats;
  const today = new Date();
  const aktiveKurse = kurse.filter((k) => k.fields.status === 'aktiv').length;
  const bevorstehend = kurse.filter(
    (k) => k.fields.startdatum && isAfter(parseISO(k.fields.startdatum), today)
  ).length;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div
        className="rounded-2xl p-8 text-white relative overflow-hidden shadow-elevated"
        style={{
          background: 'linear-gradient(135deg, oklch(0.26 0.1 264) 0%, oklch(0.38 0.16 250) 100%)',
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 85% 15%, oklch(0.6 0.2 264 / 0.35) 0%, transparent 55%), radial-gradient(circle at 5% 85%, oklch(0.48 0.16 197 / 0.3) 0%, transparent 45%)',
          }}
        />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <p
              className="text-sm font-semibold uppercase tracking-widest mb-2"
              style={{ opacity: 0.75 }}
            >
              Bildungsmanagement
            </p>
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
              Kursverwaltungs&shy;system
            </h1>
            <p className="mt-2 text-sm max-w-md" style={{ opacity: 0.75 }}>
              Verwalten Sie Kurse, Dozenten, Teilnehmer und Räume an einem Ort — einfach und übersichtlich.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:flex lg:gap-4 flex-shrink-0">
            <div
              className="rounded-xl px-5 py-4 text-center"
              style={{
                background: 'oklch(1 0 0 / 0.12)',
                backdropFilter: 'blur(8px)',
                border: '1px solid oklch(1 0 0 / 0.15)',
              }}
            >
              <p className="text-2xl font-extrabold">{loading ? '—' : aktiveKurse}</p>
              <p className="text-xs mt-0.5" style={{ opacity: 0.75 }}>Aktive Kurse</p>
            </div>
            <div
              className="rounded-xl px-5 py-4 text-center"
              style={{
                background: 'oklch(1 0 0 / 0.12)',
                backdropFilter: 'blur(8px)',
                border: '1px solid oklch(1 0 0 / 0.15)',
              }}
            >
              <p className="text-2xl font-extrabold">{loading ? '—' : bevorstehend}</p>
              <p className="text-xs mt-0.5" style={{ opacity: 0.75 }}>Bevorstehend</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <ColoredStatCard
          label="Dozenten"
          value={loading ? '…' : dozenten.length}
          sub="Lehrpersonal"
          icon={GraduationCap}
          gradient="gradient-card-indigo"
          href="/dozenten"
        />
        <ColoredStatCard
          label="Teilnehmer"
          value={loading ? '…' : teilnehmer.length}
          sub="Registriert"
          icon={Users}
          gradient="gradient-card-teal"
          href="/teilnehmer"
        />
        <ColoredStatCard
          label="Räume"
          value={loading ? '…' : raeume.length}
          sub="Verfügbar"
          icon={DoorOpen}
          gradient="gradient-card-green"
          href="/raeume"
        />
        <ColoredStatCard
          label="Kurse"
          value={loading ? '…' : kurse.length}
          sub="Insgesamt"
          icon={BookOpen}
          gradient="gradient-card-amber"
          href="/kurse"
        />
        <ColoredStatCard
          label="Anmeldungen"
          value={loading ? '…' : anmeldungen.length}
          sub="Buchungen"
          icon={CalendarCheck}
          gradient="gradient-card-rose"
          href="/anmeldungen"
        />
      </div>

      {/* Content Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <UpcomingKurseCard kurse={kurse} dozenten={dozenten} />
        </div>
        <AnmeldungenStatusCard anmeldungen={anmeldungen} />
      </div>

      {/* Chart */}
      <KurseStatusChart kurse={kurse} />
    </div>
  );
}
