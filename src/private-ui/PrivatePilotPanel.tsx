import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import type { Locale } from '../domain/model';
import type { VisualizationIntent } from '../private/model';
import { asPrivateError } from '../private/api';
import type { PrivateOutfit } from '../private/outfits';
import { rehydratePrivateOutfit } from '../private/outfits';
import { isIntentCurrent } from '../private/visualization';
import { hasCanonicalInputs } from '../private/canonicalInput';
import { newPrivateId, type usePrivateWardrobe } from '../private/usePrivateWardrobe';
import { Button, Chip, Dialog } from '../ui/Controls';
import { privateError } from './copy';
import { p33Copy } from './p33copy';
import { p33cCopy } from './p33ccopy';
import { p33Styles as s } from './p33styles';
import { CanonicalInputPhoto } from './CanonicalInputPhoto';
type Api = ReturnType<typeof usePrivateWardrobe>;

export function PreviewExample({ locale }: { locale: Locale }) {
  return Platform.OS === 'web' ? <Button label={p33cCopy(locale).example} kind="quiet" onPress={() => window.open('/p33c1/', '_blank', 'noopener,noreferrer')} /> : null;
}

export function PrivatePilotPanel({ api, locale, now }: { api: Api; locale: Locale; now: number }) {
  const t = p33cCopy(locale); const common = p33Copy(locale); const visual = api.snapshot?.visualization; const pilot = visual?.pilot;
  const [revoke, setRevoke] = useState<number | null>(null); const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  if (!visual || !pilot) return null;
  const ended = pilot.status === 'closed' || Boolean(pilot.endsAt && Date.parse(pilot.endsAt) <= now);
  const check = async () => { try { if (api.visualizationAttempt) await api.getVisualization(api.visualizationAttempt.id); } catch (issue) { setError(privateError(locale, issue)); } finally { await api.refresh(); } };
  return <View style={s.stack}>
    <View style={s.warning}><Text style={s.title} accessibilityRole="header">{t.title}</Text>
      {visual.mode !== 'private_pilot' ? <><Text style={s.title}>{common.visualOff}</Text><Text style={s.body}>{t.off}</Text></> : null}
      {ended || pilot.status !== 'active' ? <Text style={s.body}>{ended ? t.closed : t.prepared}</Text> : null}
      <Text style={s.body}>{t.limits}: {pilot.sentCount}/{pilot.maxSends} · {t.account}: {pilot.accountSentCount}/{pilot.accountMaxSends}</Text>
      <Text style={s.body}>{t.daily}: {pilot.dailySentCount}/{pilot.dailyMaxSends}</Text>
      <Text style={s.body}>{common.spent}: {pilot.spentPln.toFixed(2)} PLN · {common.reserved}: {pilot.reservedPln.toFixed(2)} PLN</Text>
      <Text style={s.body}>{t.available}: {pilot.availablePln.toFixed(2)} PLN / {pilot.budgetPln.toFixed(2)} PLN</Text>
      {visual.monthlyBudget ? <View style={s.stack}><Text style={s.title}>{t.monthly}</Text>
        <Text style={s.body}>{common.spent}: {visual.monthlyBudget.spentPln.toFixed(2)} PLN · {common.reserved}: {visual.monthlyBudget.reservedPln.toFixed(2)} PLN</Text>
        <Text style={s.body}>{t.available}: {visual.monthlyBudget.availablePln.toFixed(2)} PLN / {visual.monthlyBudget.budgetPln.toFixed(2)} PLN</Text>
        <Text style={s.note}>{t.monthlyHelp}</Text></View> : null}
      <Text style={s.body}>{t.deadline}: {pilot.endsAt ? new Date(pilot.endsAt).toLocaleString(locale === 'pl' ? 'pl-PL' : 'en-GB') : t.prepared}</Text>
      {pilot.startsAt ? <Text style={s.note}>{t.started}: {new Date(pilot.startsAt).toLocaleString(locale === 'pl' ? 'pl-PL' : 'en-GB')}</Text> : null}
      {pilot.blocked && pilot.status === 'active' && !ended ? <Text style={s.error} accessibilityRole="alert">{t.stopped}</Text> : null}
      <Text style={s.note}>{common.reservationHelp}</Text>
      <PreviewExample locale={locale} />
    </View>
    {api.visualizationAttempt?.trialId && api.visualizationAttempt.status === 'unconfirmed' ? <View style={s.warning}><Text style={s.body} accessibilityRole="alert">{t.unknown}</Text><Button label={t.check} kind="secondary" disabled={api.busy} onPress={() => { void check(); }} /></View> : null}
    {visual.consent.accepted ? <Button label={t.revoke} kind="quiet" disabled={api.busy} onPress={() => { setRevoke(visual.consent.revision ?? 0); setError(''); }} /> : null}
    {notice ? <Text style={s.body} accessibilityRole="alert">{notice}</Text> : null}
    {error ? <Text style={s.error} accessibilityRole="alert">{error}</Text> : null}
    <Dialog visible={revoke !== null} title={t.revoke} closeLabel={common.cancel} onClose={() => { if (!api.busy) setRevoke(null); }}>
      <Text style={s.body}>{t.revokeBody}</Text>{error ? <Text style={s.error}>{error}</Text> : null}
      <Button label={t.revoke} disabled={api.busy || revoke !== visual.consent.revision} onPress={() => { if (revoke !== null) void api.revokeAiConsent(revoke).then(() => { setRevoke(null); setNotice(t.revoked); }).catch(issue => setError(privateError(locale, issue))); }} />
    </Dialog>
  </View>;
}

export function PrivateVisualizationPreparation({ outfit, api, locale }: { outfit: PrivateOutfit; api: Api; locale: Locale }) {
  const t = p33cCopy(locale); const common = p33Copy(locale); const snapshot = api.snapshot;
  const [intent, setIntent] = useState<VisualizationIntent | null>(null); const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const profile = snapshot?.state.data.profiles.find(value => value.id === outfit.profileId);
  const valid = snapshot && profile && rehydratePrivateOutfit({ savedOutfit: { ...outfit, createdAt: '' }, accountId: snapshot.accountId, items: snapshot.items, profile, bodyFit: snapshot.bodyFit?.data }).outfit;
  const saved = snapshot?.styling?.data.outfits.some(value => value.id === outfit.id);
  const missing = !snapshot?.bodyFit?.photo || outfit.itemIds.some(id => !snapshot?.items.find(value => value.id === id && value.status === 'active')?.photo);
  const prepare = async () => {
    if (!snapshot?.styling || !valid || loading) return;
    setLoading(true); setError('');
    try {
      if (!saved) await api.saveStyling({ ...snapshot.styling.data, outfits: [...snapshot.styling.data.outfits, { id: outfit.id, profileId: outfit.profileId, occasion: outfit.occasion, itemIds: outfit.itemIds, itemRevisions: outfit.itemRevisions, createdAt: new Date().toISOString() }] }, snapshot.styling.revision);
      setIntent(await api.prepareVisualization(outfit.id));
    } catch (issue) { setError(privateError(locale, issue)); }
    finally { setLoading(false); }
  };
  return <View style={s.stack}>
    {snapshot?.visualization?.mode !== 'private_pilot' ? <View style={s.warning}><Text style={s.title}>{common.visualOff}</Text><Text style={s.body}>{t.off}</Text></View> : null}
    {intent ? <PrivateConfirmation key={intent.id} intent={intent} api={api} locale={locale} /> : <>
      {!valid ? <Text style={s.error}>{common.invalidInputs}</Text> : null}
      {missing ? <Text style={s.note}>{common.missingInputs}</Text> : null}
      {!saved ? <Text style={s.body}>{t.saved}</Text> : null}
      <Button label={loading ? t.loading : saved ? t.inspect : t.saveInspect} disabled={api.busy || loading || !valid || missing} onPress={() => { void prepare(); }} />
    </>}
    {error ? <Text style={s.error} accessibilityRole="alert">{error}</Text> : null}
    <PreviewExample locale={locale} />
  </View>;
}

function PrivateConfirmation({ intent, api, locale }: { intent: VisualizationIntent; api: Api; locale: Locale }) {
  const t = p33cCopy(locale); const common = p33Copy(locale); const [operationId] = useState(newPrivateId);
  const [accepted, setAccepted] = useState(false); const [policyAccepted, setPolicyAccepted] = useState(false); const [policyOpen, setPolicyOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false); const sent = useRef(false);
  const [ready, setReady] = useState<string[]>([]); const [error, setError] = useState('');
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const visual = api.snapshot?.visualization; const pilot = visual?.pilot; const current = isIntentCurrent(api.snapshot, intent, now) && hasCanonicalInputs(intent);
  const markReady = useCallback((photoId: string, loaded: boolean) => setReady(previous => loaded ? previous.includes(photoId) ? previous : [...previous, photoId] : previous.filter(value => value !== photoId)), []);
  const attempt = api.visualizationAttempt;
  const blocked = !current || visual?.mode !== 'private_pilot' || !pilot?.eligible || pilot.status !== 'active' || !pilot.endsAt || Date.parse(pilot.endsAt) <= now
    || pilot.blocked || pilot.reservedPln > 0 || pilot.sentCount >= pilot.maxSends || pilot.accountSentCount >= pilot.accountMaxSends || pilot.dailySentCount >= pilot.dailyMaxSends
    || intent.jobId !== null || intent.reservePln <= 0 || intent.reservePln > pilot.availablePln || attempt?.status === 'unconfirmed'
    || visual.jobs.some(job => ['reserved', 'sent', 'outcome_unknown'].includes(job.status));
  const send = async () => {
    if (sent.current || blocked || !accepted || !policyAccepted || ready.length !== intent.inputs.length) return;
    sent.current = true; setSubmitted(true); setError('');
    try { await api.requestPrivateVisualization(operationId, intent, accepted); await api.refresh(); }
    catch (issue) { setError(['NETWORK', 'INVALID_RESPONSE', 'SERVICE', 'CANCELLED'].includes(asPrivateError(issue).code) ? '' : privateError(locale, issue)); }
  };
  const check = async (id: string) => { try { await api.getVisualization(id); } catch (issue) { setError(privateError(locale, issue)); } finally { await api.refresh(); } };
  return <View style={s.stack}>
    {!current ? <Text style={s.error}>{t.changed}</Text> : intent.inputs.map((input, index) => {
      const item = api.snapshot?.items.find(value => value.photo?.id === input.photoId);
      const label = input.kind === 'body' ? common.personInput : item?.name ?? `${common.clothingInputs} ${index}`;
      return <View key={`${input.photoId}:${input.canonical!.sha256}`} style={s.stack}><Text style={s.title}>{label}</Text><CanonicalInputPhoto intent={intent} input={input} api={api} locale={locale} label={label} onReady={markReady} /></View>;
    })}
    <Text style={s.note}>{t.copies}</Text>
    <Text style={s.title}>{t.reserve}: {Number.isFinite(intent.reservePln) ? `${intent.reservePln.toFixed(2)} PLN` : common.unknown}</Text>
    <Text style={s.body}>{t.data}</Text><Text style={s.body}>{t.retention}</Text><Text style={s.note}>{t.once}</Text><Text style={s.body}>{t.priceBoundary}</Text><Text style={s.note}>{common.visualCaveat}</Text>
    <Button label={t.policy} kind="quiet" onPress={() => setPolicyOpen(!policyOpen)} />
    {policyOpen ? <View style={s.warning}><Text style={s.title}>{t.policy}</Text><Text style={s.body}>{t.policyStorage}</Text><Text style={s.body}>{t.policyProvider}</Text><Text style={s.body}>{t.policyDelete}</Text><Text style={s.body}>{t.policyLedger}</Text></View> : null}
    <Chip label={t.policyConsent} selected={policyAccepted && current} disabled={api.busy || blocked || submitted} onPress={() => setPolicyAccepted(!policyAccepted)} />
    <Chip label={t.consent} selected={accepted && current} disabled={api.busy || blocked || submitted} onPress={() => setAccepted(!accepted)} />
    <Button label={t.send} disabled={api.busy || blocked || !accepted || !policyAccepted || submitted || ready.length !== intent.inputs.length} onPress={() => { void send(); }} />
    {intent.jobId ? <><Text style={s.body}>{t.used}</Text><Button label={t.check} kind="secondary" disabled={api.busy} onPress={() => { void check(intent.jobId!); }} /></> : null}
    {attempt?.id === operationId ? <><Text style={s.body} accessibilityRole="alert">{attempt.status === 'accepted' ? t.accepted : t.unknown}</Text><Button label={t.check} kind="secondary" disabled={api.busy} onPress={() => { void check(operationId); }} /></> : null}
    {error ? <Text style={s.error} accessibilityRole="alert">{error}</Text> : null}
  </View>;
}
