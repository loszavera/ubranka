import { useEffect, useState } from 'react';
import { Linking, Platform, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import type { Locale } from '../domain/model';
import type { VisualizationJob } from '../private/model';
import { rehydratePrivateOutfit, type PrivateOutfit } from '../private/outfits';
import type { usePrivateWardrobe } from '../private/usePrivateWardrobe';
import { Button, Dialog, styles } from '../ui/Controls';
import { privateError } from './copy';
import { p33Copy } from './p33copy';
import { p33Styles as s } from './p33styles';
import { PrivatePhoto } from './PrivatePhoto';
import { SyntheticTrialPanel, VisualizationReviewForm } from './SyntheticTrialPanel';
import { p33bCopy } from './p33bcopy';
import { p33cCopy } from './p33ccopy';
import { PrivatePilotPanel, PrivateVisualizationPreparation } from './PrivatePilotPanel';
import { resultVariant } from '../private/visualization';

type Api = ReturnType<typeof usePrivateWardrobe>;
function Example({ locale }: { locale: Locale }) {
  const t = p33Copy(locale); const [error, setError] = useState('');
  return <View style={s.card}><Text style={s.body}>{t.exampleLabel}</Text>
    <Button label={t.example} kind="secondary" onPress={() => {
      if (Platform.OS === 'web') window.open('/p32/', '_blank', 'noopener,noreferrer');
      else void Linking.openURL('https://ubranka.vercel.app/p32/').catch(issue => setError(privateError(locale, issue)));
    }} />{error ? <Text style={s.error}>{error}</Text> : null}</View>;
}

export function VisualizationPreparation({ outfit, api, locale }: { outfit: PrivateOutfit; api: Api; locale: Locale }) {
  return api.snapshot?.visualization?.pilot ? <PrivateVisualizationPreparation outfit={outfit} api={api} locale={locale} /> : <LegacyPreparation outfit={outfit} api={api} locale={locale} />;
}
function LegacyPreparation({ outfit, api, locale }: { outfit: PrivateOutfit; api: Api; locale: Locale }) {
  const t = p33Copy(locale); const snapshot = api.snapshot;
  const [bodyRevision] = useState(snapshot?.bodyFit?.revision);
  const profile = snapshot?.state.data.profiles.find(value => value.id === outfit.profileId);
  const valid = snapshot && profile && rehydratePrivateOutfit({ savedOutfit: { ...outfit, createdAt: '' }, accountId: snapshot.accountId, items: snapshot.items, profile, bodyFit: snapshot.bodyFit?.data }).outfit;
  const bodyChanged = snapshot?.bodyFit?.revision !== bodyRevision;
  const items = valid ? outfit.itemIds.map(id => snapshot?.items.find(item => item.id === id)).filter(item => !!item) : [];
  const missing = !snapshot?.bodyFit?.photo || items.some(item => !item.photo);
  return <View style={s.stack}>
    <View style={s.warning}><Text style={s.title}>{t.visualOff}</Text><Text style={s.body}>{snapshot?.visualization?.trial ? p33bCopy(locale).caseOnly : t.visualOffHelp}</Text></View>
    {!valid || bodyChanged ? <Text style={s.error}>{t.invalidInputs}</Text> : <>
      <Text style={s.title}>{t.personInput}</Text>
      {snapshot?.bodyFit?.photo ? <PrivatePhoto path={snapshot.bodyFit.photo.thumbPath} api={api} locale={locale} label={t.fitPhoto} /> : <Text style={s.note}>{t.missing}</Text>}
      <Text style={s.title}>{t.clothingInputs}</Text><View style={styles.row}>{items.map(item => <View key={item.id} style={s.small}>
        {item.photo ? <PrivatePhoto path={item.photo.thumbPath} api={api} locale={locale} label={item.name} height={150} /> : <Text style={s.note}>{t.missing}</Text>}<Text style={s.body}>{item.name}</Text>
      </View>)}</View>{missing ? <Text style={s.note}>{t.missingInputs}</Text> : null}
    </>}
    <Text style={s.body}>{t.dataPreview}</Text><Text style={s.body}>{t.aiConsent}</Text><Text style={s.note}>{t.unknownCost}</Text>
    <Button label={t.sendDisabled} disabled onPress={() => {}} /><Example locale={locale} />
  </View>;
}

export function VisualizationPanel({ api, locale }: { api: Api; locale: Locale }) {
  const t = p33Copy(locale); const c = p33cCopy(locale); const visual = api.snapshot?.visualization;
  const [deleting, setDeleting] = useState<VisualizationJob | null>(null);
  const [deleteAllRevision, setDeleteAllRevision] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [reviewing, setReviewing] = useState<VisualizationJob | null>(null);
  const [enlargedId, setEnlargedId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  if (!visual) return <Text style={s.body}>{t.unavailable}</Text>;
  const limits = visual.limits;
  const enlarged = visual.jobs.find(job => job.id === enlargedId && job.status === 'succeeded' && job.result && Date.parse(job.expiresAt) > now);
  const run = (action: Promise<unknown>) => { setError(''); void action.catch(issue => setError(privateError(locale, issue))); };
  const money = (value: number | null) => value === null ? t.unknown : `${value.toFixed(2)} PLN`;
  return <View style={s.stack}>
    {visual.pilot ? <PrivatePilotPanel api={api} locale={locale} /> : visual.trial ? <SyntheticTrialPanel api={api} locale={locale} now={now} /> : <><View style={s.warning}><Text accessibilityRole="header" style={s.title}>{t.visualOff}</Text><Text style={s.body}>{t.visualOffHelp}</Text><Text style={s.note}>{t.noPilot}</Text></View>
      <View style={s.card}><Text style={s.body}>{t.results}: {limits.usedResults}/{limits.results} · {t.attempts}: {limits.usedAttempts}/{limits.attempts} · {t.daily}: {limits.usedDailyAttempts}/{limits.dailyAttempts}</Text>
      <Text style={s.body}>{t.spent}: {money(limits.spentPln)} · {t.reserved}: {money(limits.reservedPln)}</Text><Text style={s.note}>{t.reservationHelp}</Text></View>
    </>}
    <Example locale={locale} />
    <Text accessibilityRole="header" style={s.title}>{t.history}</Text>
    {!visual.jobs.length ? <Text style={s.body}>{t.noJobs}</Text> : null}
    {visual.jobs.map(job => <View key={job.id} style={s.card}>
      <Text style={s.title}>{t.jobStates[job.status]}</Text><Text style={s.note}>{new Date(job.createdAt).toLocaleString(locale === 'pl' ? 'pl-PL' : 'en-GB')}</Text>
      <Text style={s.body}>{t.spent}: {money(job.spentPln)} · {t.reserved}: {money(job.reservedPln)}</Text>
      {job.status === 'outcome_unknown' || job.status === 'sent' ? <Text style={s.body}>{t.reservationHelp}</Text> : null}
      {job.status === 'succeeded' && job.result && Date.parse(job.expiresAt) > now ? <><View style={{ width: '100%', maxWidth: 300, alignSelf: 'center' }}><PrivatePhoto path={job.result.thumbPath} api={api} locale={locale} label={p33bCopy(locale).result} height={450} mimeType={job.result.thumbMimeType ?? job.result.mimeType} maxBytes={100_000} lazy /></View><Text style={s.note}>{t.visualCaveat}</Text>
        <Button label={c.enlarge} kind="secondary" disabled={api.busy} onPress={() => setEnlargedId(job.id)} /><Button label={t.download} kind="secondary" disabled={api.busy} onPress={() => run(api.downloadVisualization(job.id))} />
        <Button label={p33bCopy(locale).rate} kind="secondary" disabled={api.busy} onPress={() => { api.clearError(); setReviewing(job); }} /></> : job.status === 'succeeded' ? <Text style={s.note}>{t.noResult}</Text> : null}
      {job.review ? <Text style={s.note}>{p33bCopy(locale).reviewed}: {Object.values(job.review.scores).reduce((sum, value) => sum + value, 0)}/10{job.review.criticalError ? ` · ${p33bCopy(locale).critical}` : ''}</Text> : null}
      {job.status === 'reserved' ? <Button label={t.cancelJob} disabled={api.busy} kind="secondary" onPress={() => run(api.cancelVisualization(job.id, job.revision))} /> : null}
      {['reserved', 'sent', 'outcome_unknown'].includes(job.status) ? <Button label={c.check} kind="secondary" disabled={api.busy} onPress={() => run(api.getVisualization(job.id).then(() => api.refresh()))} /> : null}
      {['succeeded', 'failed', 'outcome_unknown', 'cancelled', 'expired'].includes(job.status) ? <Button label={t.deleteJob} disabled={api.busy} kind="quiet" onPress={() => { api.clearError(); setDeleting(job); }} /> : null}
    </View>)}
    {error ? <Text style={s.error} accessibilityRole="alert">{error}</Text> : null}
    {api.snapshot?.bodyFit && visual.jobs.length ? <Button label={c.deleteAll} kind="quiet" disabled={api.busy} onPress={() => setDeleteAllRevision(api.snapshot!.bodyFit!.revision)} /> : null}
    <Dialog visible={!!deleting} title={t.deleteJob} closeLabel={t.cancel} onClose={() => { if (!api.busy) setDeleting(null); }}>
      <Text style={s.body}>{t.deleteJobBody}</Text>{error ? <Text style={s.error}>{error}</Text> : null}
      <Button label={t.deleteJob} disabled={api.busy} onPress={() => { if (deleting) run(api.deleteVisualization(deleting.id, deleting.revision).then(() => setDeleting(null))); }} />
    </Dialog>
    <Dialog visible={deleteAllRevision !== null} title={c.deleteAll} closeLabel={t.cancel} onClose={() => { if (!api.busy) setDeleteAllRevision(null); }}>
      <Text style={s.body}>{c.deleteBody}</Text>{error ? <Text style={s.error}>{error}</Text> : null}
      <Button label={c.deleteAll} disabled={api.busy || deleteAllRevision !== api.snapshot?.bodyFit?.revision} onPress={() => { if (deleteAllRevision !== null) run(api.deleteAiData(deleteAllRevision).then(() => setDeleteAllRevision(null))); }} />
    </Dialog>
    <Dialog visible={!!reviewing} title={p33bCopy(locale).rate} closeLabel={t.cancel} onClose={() => { if (!api.busy) setReviewing(null); }}>
      {reviewing ? <VisualizationReviewForm key={reviewing.id} job={reviewing} api={api} locale={locale} onDone={() => setReviewing(null)} /> : null}
    </Dialog>
    <Dialog visible={!!enlarged} title={c.original} closeLabel={c.close} onClose={() => setEnlargedId(null)}>
      {enlarged?.result ? <FullResult key={enlarged.result.mainPath} job={enlarged} api={api} locale={locale} /> : null}
    </Dialog>
  </View>;
}

function FullResult({ job, api, locale }: { job: VisualizationJob; api: Api; locale: Locale }) {
  const t = p33cCopy(locale); const window = useWindowDimensions(); const [originalSize, setOriginalSize] = useState(false);
  if (!job.result) return null;
  const variant = resultVariant(job.result, false); const width = originalSize ? variant.width : Math.min(420, window.width - 96);
  return <View style={s.stack}><Text style={s.note}>{t.originalHelp}</Text>
    <Button label={originalSize ? t.fit : t.actual} kind="secondary" onPress={() => setOriginalSize(!originalSize)} />
    <ScrollView horizontal contentContainerStyle={{ alignItems: 'flex-start' }}><PrivatePhoto api={api} locale={locale} path={variant.path} mimeType={variant.mimeType} maxBytes={8_000_000} label={t.original} width={width} height={width * variant.height / variant.width} /></ScrollView>
  </View>;
}
