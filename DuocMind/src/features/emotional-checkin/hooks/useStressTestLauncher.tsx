import React, { useCallback, useRef, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { RecentTestModal } from '../components/RecentTestModal';
import { daysSinceApplication, isStressTestDue } from '../domain/stressTestRecency';
import { fetchLastStressTest } from '../infrastructure/stressTestRepository';

export type LastStressTest =
  | { status: 'loading' }
  /** Sin sesión o sin conexión: no se sabe si el estudiante respondió el test. */
  | { status: 'unknown' }
  | { status: 'ready'; lastAppliedAt: string | null; lastLevel: string | null };

/**
 * Consulta la última aplicación del PSS-10 cada vez que la vista se enfoca, así el
 * dato se actualiza al volver de responder el test. `open` muestra el aviso de test
 * reciente sobre la vista actual y solo navega al test si el estudiante continúa.
 */
export function useStressTestLauncher() {
  const router = useRouter();
  const [lastStressTest, setLastStressTest] = useState<LastStressTest>({ status: 'loading' });
  const [recentTestDays, setRecentTestDays] = useState(0);
  // Separado de los días para que el contenido no cambie mientras el Modal se desvanece.
  const [modalVisible, setModalVisible] = useState(false);
  const pending = useRef<Promise<string | null>>(Promise.resolve(null));

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const request = fetchLastStressTest();
      pending.current = request.then((last) => last?.appliedAt ?? null).catch(() => null);
      request.then(
        (last) =>
          active &&
          setLastStressTest({
            status: 'ready',
            lastAppliedAt: last?.appliedAt ?? null,
            lastLevel: last?.level ?? null,
          }),
        () => active && setLastStressTest({ status: 'unknown' }),
      );
      return () => {
        active = false;
      };
    }, []),
  );

  const goToTest = useCallback(() => router.push('/daily-test'), [router]);

  const open = useCallback(async () => {
    const lastAppliedAt = await pending.current;
    // Solo se avisa si el test es reciente; pasados 30 días ya corresponde responderlo.
    if (lastAppliedAt && !isStressTestDue(lastAppliedAt)) {
      setRecentTestDays(daysSinceApplication(lastAppliedAt));
      setModalVisible(true);
      return;
    }
    goToTest();
  }, [goToTest]);

  const modal = (
    <RecentTestModal
      visible={modalVisible}
      days={recentTestDays}
      onClose={() => setModalVisible(false)}
      onContinue={() => {
        setModalVisible(false);
        goToTest();
      }}
    />
  );

  return { lastStressTest, open, goToTest, modal };
}
