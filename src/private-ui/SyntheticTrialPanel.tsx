import { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import type { Locale } from '../domain/model';
import type { SyntheticCase, VisualizationJob, VisualizationReview } from '../private/model';
import { newPrivateId, type usePrivateWardrobe } from '../private/usePrivateWardrobe';
import { Button, Chip, Dialog, Field, styles } from '../ui/Controls';
import { privateCopy, privateError } from './copy';
import { p33Copy } from './p33copy';
import { p33bCopy } from './p33bcopy';
import { p33Styles as s } from './p33styles';
import { PrivatePhoto } from './PrivatePhoto';
type Api = ReturnType<typeof usePrivateWardrobe>;

export function SyntheticTrialPanel({ api, locale, now }: { api: Api; locale: Locale; now: number }) {
  const t = p33bCopy(locale); const common = p33Copy(locale); const visual = api.snapshot?.visualization; const trial = visual?.trial;
  const [selected, setSelected] = useState<SyntheticCase | null>(null);
  const [error, setError] = useState('');
  if (!trial) return null;
  const blocked = visual?.mode !== 'synthetic_trial' || trial.blocked || trial.reservedPln > 0 || !trial.endsAt || !(Date.parse(trial.endsAt) > now) || trial.sentCount >= trial.maxSends
    || visual?.jobs.some(job => ['reserved', 'sent', 'outcome_unknown'].includes(job.status)) || api.visualizationAttempt?.status === 'unconfirmed';
  const check = async (id: string) => { setError(''); try { await api.getVisualization(id); } catch (issue) { setError(privateError(locale, issue)); } finally { await api.refresh(); } };
  return <View style={s.stack}>
    <View style={s.warning}><Text accessibilityRole="header" style={s.title}>{t.title}</Text><Text style={s.body}>{t.introduction}</Text>
      <Text style={s.body}>{t.sends}: {trial.sentCount}/{trial.maxSends} · {t.budget}: {trial.budgetPln.toFixed(2)} PLN</Text>
      <Text style={s.body}>{common.spent}: {trial.spentPln.toFixed(2)} PLN · {common.reserved}: {trial.reservedPln.toFixed(2)} PLN</Text>
      <Text style={s.body}>{t.deadline}: {trial.endsAt ? new Date(trial.endsAt).toLocaleString(locale === 'pl' ? 'pl-PL' : 'en-GB') : t.notStarted}</Text>
      {blocked ? <><Text style={s.title}>{visual?.mode === 'off' ? common.visualOff : t.blocked}</Text><Text style={s.body}>{t.blockedHelp}</Text></> : null}
      <Text style={s.note}>{t.risk}</Text>
    </View>
    {api.visualizationAttempt?.status === 'unconfirmed' ? <View style={s.warning}><Text accessibilityRole="alert" style={s.body}>{t.unconfirmed}</Text>
      <Button label={t.check} disabled={api.busy} kind="secondary" onPress={() => { void check(api.visualizationAttempt!.id); }} /></View> : null}
    {trial.cases.map(value => <View key={value.id} style={s.card}>
      <Text style={s.title}>{value.id} · {value.label}</Text>
      {value.jobId || value.sent || api.visualizationAttempt?.caseId === value.id ? <><Text style={s.note}>{t.caseUsed}</Text>
        {value.jobId ? <Button label={`${t.check}: ${value.id}`} kind="secondary" disabled={api.busy} onPress={() => { void check(value.jobId!); }} /> : null}</>
        : <Button label={`${t.reviewInputs}: ${value.id}`} kind="secondary" disabled={api.busy || blocked} onPress={() => { setSelected(value); setError(''); }} />}
    </View>)}
    {error ? <Text style={s.error} accessibilityRole="alert">{error}</Text> : null}
    <Dialog visible={!!selected} title={selected ? `${selected.id} · ${selected.label}` : t.reviewInputs} closeLabel={common.cancel} onClose={() => { if (!api.busy) setSelected(null); }}>
      {selected ? <TrialConfirmation key={selected.id} selected={selected} api={api} locale={locale} now={now} onAccepted={() => setSelected(null)} /> : null}
    </Dialog>
  </View>;
}

function TrialConfirmation({ selected, api, locale, now, onAccepted }: { selected: SyntheticCase; api: Api; locale: Locale; now: number; onAccepted: () => void }) {
  const t = p33bCopy(locale); const common = p33Copy(locale); const visual = api.snapshot?.visualization; const trial = visual?.trial;
  const [operationId] = useState(newPrivateId); const sent = useRef(false);
  const [submitted, setSubmitted] = useState(false);
  const [accepted, setAccepted] = useState(false); const [error, setError] = useState('');
  const current = trial?.cases.find(value => value.id === selected.id);
  const changed = JSON.stringify(current) !== JSON.stringify(selected);
  const blocked = changed || !current || visual?.mode !== 'synthetic_trial' || !trial || trial.blocked || trial.reservedPln > 0 || !trial.endsAt || !(Date.parse(trial.endsAt) > now)
    || trial.sentCount >= trial.maxSends || current.sent || !!current.jobId || !!api.visualizationAttempt && api.visualizationAttempt.status !== 'accepted'
    || !!visual?.jobs.some(job => ['reserved', 'sent', 'outcome_unknown'].includes(job.status));
  const submit = async () => {
    if (sent.current || !accepted || blocked || api.busy) return;
    sent.current = true; setSubmitted(true); setError('');
    try { await api.requestVisualization(operationId, selected.id, accepted); onAccepted(); await api.refresh(); }
    catch (issue) { setError(privateError(locale, issue)); }
  };
  return <View style={s.stack}>
    <Text style={s.body}>{t.introduction}</Text>
    <Text style={s.title}>{t.person}</Text><PrivatePhoto api={api} locale={locale} path={selected.personPath} label={t.person} />
    {selected.itemPaths.map((path, index) => <View key={path} style={s.stack}><Text style={s.title}>{t.item} {index + 1}</Text><PrivatePhoto api={api} locale={locale} path={path} label={`${t.item} ${index + 1}`} /></View>)}
    <Text style={s.body}>{t.model}: {selected.model}</Text><Text style={s.title}>{t.reserve}: {selected.reservePln.toFixed(2)} PLN</Text>
    <Text style={s.body}>{t.data}</Text><Text style={s.note}>{t.retention}</Text><Text style={s.note}>{t.risk}</Text><Text style={s.body}>{t.once}</Text><Text style={s.note}>{common.visualCaveat}</Text>
    {changed ? <Text style={s.error}>{t.changed}</Text> : null}
    <Chip label={t.consent} selected={accepted} disabled={api.busy || blocked || submitted} onPress={() => setAccepted(!accepted)} />
    <Button label={t.send} disabled={api.busy || blocked || !accepted || submitted} onPress={() => { void submit(); }} />
    {error ? <Text style={s.error} accessibilityRole="alert">{error}</Text> : null}
    {api.visualizationAttempt?.id === operationId && api.visualizationAttempt.status === 'unconfirmed' ? <><Text style={s.body}>{t.unconfirmed}</Text>
      <Button label={t.check} kind="secondary" disabled={api.busy} onPress={() => { void api.getVisualization(operationId).then(async () => { onAccepted(); await api.refresh(); }).catch(issue => setError(privateError(locale, issue))); }} /></> : null}
  </View>;
}

const scoreFields = ['person', 'garments', 'completeness', 'artifacts', 'usefulness'] as const;
export function VisualizationReviewForm({ job, api, locale, onDone }: { job: VisualizationJob; api: Api; locale: Locale; onDone: () => void }) {
  const t = p33bCopy(locale); const [review, setReview] = useState<VisualizationReview>(() => job.review ?? { scores: { person: 0, garments: 0, completeness: 0, artifacts: 0, usefulness: 0 }, criticalError: false, note: '' });
  const [rated, setRated] = useState<readonly string[]>(() => job.review ? scoreFields : []);
  const [error, setError] = useState(''); const current = api.snapshot?.visualization?.jobs.find(value => value.id === job.id);
  const stale = current?.revision !== job.revision;
  return <View style={s.stack}><Text style={s.body}>{t.ratingHelp}</Text><Text style={s.note}>{t.scale}</Text>
    {scoreFields.map(key => <View key={key} style={s.stack}><Text style={styles.label}>{t[`${key}Score`]}</Text><View style={styles.row}>{[0, 1, 2].map(score => <Chip key={score} label={`${score}`} accessibilityLabel={`${t[`${key}Score`]}: ${score}`} selected={rated.includes(key) && review.scores[key] === score} disabled={api.busy || stale} onPress={() => { setReview({ ...review, scores: { ...review.scores, [key]: score } }); setRated([...new Set([...rated, key])]); }} />)}</View></View>)}
    <Chip label={t.critical} selected={review.criticalError} disabled={api.busy || stale} onPress={() => setReview({ ...review, criticalError: !review.criticalError })} />
    <Field label={t.note} value={review.note} maxLength={1000} editable={!api.busy && !stale} onChangeText={note => setReview({ ...review, note })} />
    {error ? <Text style={s.error}>{error}</Text> : null}{stale ? <Text style={s.error}>{t.reviewConflict}</Text> : null}
    {api.conflict ? <Button label={privateCopy(locale).reload} disabled={api.busy} kind="secondary" onPress={() => { void api.refresh(); }} /> : null}
    <Button label={t.saveReview} disabled={api.busy || stale || rated.length !== scoreFields.length} onPress={() => { void api.reviewVisualization(job.id, job.revision, review).then(onDone).catch(issue => setError(privateError(locale, issue))); }} />
  </View>;
}
