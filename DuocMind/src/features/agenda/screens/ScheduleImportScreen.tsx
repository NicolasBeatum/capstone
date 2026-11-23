import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { LiquidBackground } from '@/shared/components/Glass';
import { GotaLoader } from '@/shared/components/GotaLoader';
import { Reveal } from '@/shared/motion/Reveal';
import { usePlanner } from '@/shared/planner/application/usePlanner';
import type { Semester } from '@/shared/planner/domain/schedule';
import type { DuocTimetable } from '../domain/duocTimetable';
import {
  buildImport,
  findSameSemester,
  type ImportMode,
  type ImportSelection,
  nextFreeSemesterName,
} from '../application/scheduleImport';
import { useScheduleImport } from '../application/useScheduleImport';
import { ImportPreview } from '../components/ImportPreview';
import { PlannerHeader } from '../components/PlannerHeader';
import { PlannerButton, PlannerModal } from '../components/PlannerControls';
import { styles as a } from './AgendaScreen.styles';
import { scheduleStyles as s } from './ScheduleScreen.styles';
import { importStyles as i } from './ScheduleImportScreen.styles';

function initialSelection(parsed: DuocTimetable): ImportSelection {
  return { semesterName: parsed.semesterName, subjectNames: {}, excluded: new Set() };
}

export default function ScheduleImportScreen() {
  const router = useRouter(), planner = usePlanner(), reader = useScheduleImport();
  const doc = planner.snapshot?.document.schedule;
  const [selection, setSelection] = useState<ImportSelection | null>(null);
  const [repeated, setRepeated] = useState<Semester | null>(null);
  const [error, setError] = useState<string | null>(null);
  const parsed = reader.state.status === 'ready' ? reader.state.parsed : null;
  const current = parsed ? selection ?? initialSelection(parsed) : null;

  const pick = () => {
    setSelection(null);
    setError(null);
    void reader.pick();
  };
  const close = () => router.replace('/schedule');
  const save = async (mode?: ImportMode) => {
    if (!parsed || !current || !doc) return;
    if (!current.semesterName.trim()) {
      setError('Escribe un nombre para el semestre.');
      return;
    }
    const same = findSameSemester(doc, current.semesterName);
    if (same && !mode) {
      setRepeated(same);
      return;
    }
    try {
      await planner.applyImport(
        doc,
        buildImport(parsed, current, mode ?? { kind: 'new' }, Crypto.randomUUID),
      );
      setRepeated(null);
      close();
    } catch (e) {
      setRepeated(null);
      setError(e instanceof Error ? e.message : 'No se pudo guardar el horario.');
    }
  };

  return (
    <View style={a.safeArea}>
      <LiquidBackground />
      <ScrollView
        contentContainerStyle={a.scrollContent}
        keyboardShouldPersistTaps='handled'
        showsVerticalScrollIndicator={false}
      >
        <Reveal>
          <PlannerHeader
            title='Importar desde Duoc'
            subtitle='Tu boletín se lee en este teléfono y no se envía a ningún lado.'
            backLabel='Volver a mis horarios'
            onBack={close}
          />
        </Reveal>
        {reader.state.status === 'idle' && (
          <Reveal index={1}>
            <View style={s.card}>
              <Text style={s.cardTitle}>Boletín de carga académica</Text>
              <View style={i.steps}>
                <Text style={i.step}>1. Entra al portal de Duoc y descarga tu boletín en PDF.</Text>
                <Text style={i.step}>2. Elígelo aquí y revisa tus clases antes de guardar.</Text>
              </View>
              <PlannerButton label='Elegir PDF' disabled={!doc} onPress={pick} />
            </View>
          </Reveal>
        )}
        {reader.state.status === 'reading' && (
          <View style={i.loader}>
            <GotaLoader text='Leyendo tu boletín…' />
          </View>
        )}
        {reader.state.status === 'error' && (
          <Reveal index={1}>
            <View style={s.card}>
              <Text style={s.error} accessibilityRole='alert'>{reader.state.message}</Text>
              <View style={i.actions}>
                <PlannerButton label='Elegir otro archivo' onPress={pick} />
                <PlannerButton secondary label='Volver' onPress={close} />
              </View>
            </View>
          </Reveal>
        )}
        {parsed && current && (
          <>
            <ImportPreview parsed={parsed} selection={current} onChange={setSelection} />
            {error && <Text style={s.error} accessibilityRole='alert'>{error}</Text>}
            <View style={i.actions}>
              <PlannerButton
                label='Guardar horario'
                disabled={planner.busy || !doc}
                onPress={() => void save()}
              />
              <PlannerButton secondary label='Cancelar' disabled={planner.busy} onPress={close} />
            </View>
          </>
        )}
      </ScrollView>
      {repeated && doc && current && (
        <PlannerModal
          sheet
          title={`Ya tienes «${repeated.name}»`}
          busy={planner.busy}
          onClose={() => setRepeated(null)}
        >
          <Text style={s.subtitle}>
            Puedes reemplazar sus ramos y clases por los del boletín, o guardar este horario como un
            semestre nuevo. Tus actividades, pruebas y tareas se conservan.
          </Text>
          <PlannerButton
            label='Reemplazar ese semestre'
            disabled={planner.busy}
            onPress={() => void save({ kind: 'replace', semesterId: repeated.id })}
          />
          <PlannerButton
            secondary
            label={`Crear «${nextFreeSemesterName(doc, current.semesterName)}»`}
            a11yLabel='Crear otro semestre'
            disabled={planner.busy}
            onPress={() => void save({ kind: 'new' })}
          />
        </PlannerModal>
      )}
    </View>
  );
}
