import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { authClient, database, projectRoot, requireLocal, runtime } from './runtime.mjs';
const { chromium, expect } = createRequire(
  path.resolve(projectRoot, '../admin-web/package.json'),
)(
  '@playwright/test',
);
const origin = requireLocal(
    process.env.PLANNER_E2E_URL ?? 'http://localhost:8091',
  ),
  db = await database(),
  admin = authClient(true),
  email = `planner-${crypto.randomUUID()}@example.test`,
  password = crypto.randomBytes(24).toString('base64url');
const output = path.join(projectRoot, 'tools/.local/planner');
fs.mkdirSync(output, { recursive: true });
const eventId = crypto.randomUUID();
let browser, user, otherUser, eventCreated = false;
try {
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (created.error) throw Error('No se pudo crear la cuenta sintética.');
  user = created.data.user;
  await db.query(
    "insert into public.estudiante(auth_user_id,rut,primer_nombre,primer_apellido) values($1,$2,'Prueba','Agenda')",
    [user.id, `PLANNER-E2E-${user.id}`],
  );
  browser = await chromium.launch();
  const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      reducedMotion: 'reduce',
    }),
    page = await context.newPage(),
    errors = [],
    remoteWrites = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('request', (request) => {
    if (request.url().includes('/rpc/save_personal_schedule')) {
      remoteWrites.push(request.postDataJSON());
    }
  });
  await page.goto(origin + '/login');
  await page.getByPlaceholder('ejemplo@universidad.edu').fill(email);
  await page.getByPlaceholder('••••••••').fill(password);
  await page.getByRole('button', { name: /Iniciar Sesión/ }).click();
  await page.waitForURL(/dashboard/, { timeout: 60000 });
  await page.goto(origin + '/agenda');
  const createSchedule = page.getByRole('button', {
    name: 'Crear mi horario',
    exact: true,
  });
  await createSchedule.waitFor({ timeout: 60000 });
  await expect(createSchedule).toBeEnabled();
  await expect.poll(async () => {
    const box = await createSchedule.boundingBox();
    return box !== null && box.y + box.height < 844;
  }).toBe(true);
  await page.screenshot({
    path: path.join(output, 'agenda-empty-class-entry.png'),
  });
  await createSchedule.click();
  await page.getByRole('button', { name: 'Guardar clases', exact: true })
    .click();
  const missingName = page.getByText(
    'Escribe un texto de entre 1 y 120 caracteres.',
    {
      exact: true,
    },
  );
  await missingName.waitFor();
  const errorBox = await missingName.boundingBox();
  assert(errorBox && errorBox.y >= 0 && errorBox.y + errorBox.height <= 844);
  await page.getByLabel('Nombre del semestre', { exact: true }).fill(
    'Horario de prueba',
  );
  await page.getByLabel('Nombre del ramo', { exact: true }).fill(
    'Clase desde Agenda',
  );
  await page.getByRole('radio', { name: 'Bloque 1: Lunes', exact: true })
    .click();
  await page.getByLabel('Sala del bloque 1 (opcional)', { exact: true }).fill(
    'Sala 301',
  );
  await page.getByRole('button', {
    name: 'Agregar otro bloque semanal',
    exact: true,
  }).click();
  await page.getByRole('radio', { name: 'Bloque 2: Miércoles', exact: true })
    .click();
  await page.getByLabel('Inicio del bloque 2', { exact: true }).fill('11:00');
  await page.getByLabel('Término del bloque 2', { exact: true }).fill('12:30');
  await page.getByLabel('Sala del bloque 2 (opcional)', { exact: true }).fill(
    'Laboratorio 402',
  );
  const saveClasses = page.getByRole('button', {
    name: 'Guardar clases',
    exact: true,
  });
  const saveBox = await saveClasses.boundingBox();
  assert(saveBox && saveBox.y >= 0 && saveBox.y + saveBox.height <= 844);
  await page.screenshot({ path: path.join(output, 'class-entry-form.png') });
  await page.setViewportSize({ width: 320, height: 800 });
  await page.evaluate(() => {
    for (const node of document.querySelectorAll('[dir="auto"],input')) {
      const style = getComputedStyle(node);
      node.style.fontSize = (parseFloat(style.fontSize) * 1.5) + 'px';
      if (style.lineHeight !== 'normal') {
        node.style.lineHeight = (parseFloat(style.lineHeight) * 1.5) + 'px';
      }
    }
  });
  assert.deepEqual(
    await page.getByRole('button').evaluateAll((nodes) =>
      nodes.filter((node) => {
        const r = node.getBoundingClientRect();
        return r.width > 0 && r.height > 0 &&
          (r.width < 43.9 || r.height < 43.9);
      }).map((node) => node.getAttribute('aria-label') ?? node.textContent)
    ),
    [],
  );
  assert.deepEqual(
    await page.getByRole('radio').evaluateAll((nodes) =>
      nodes.filter((node) => {
        const r = node.getBoundingClientRect();
        return r.width < 43.9 || r.height < 43.9;
      }).map((node) => node.getAttribute('aria-label'))
    ),
    [],
  );
  const enlargedSave = await saveClasses.boundingBox();
  assert(
    enlargedSave && enlargedSave.y >= 0 &&
      enlargedSave.y + enlargedSave.height <= 800,
  );
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
    false,
  );
  await page.screenshot({
    path: path.join(output, 'class-entry-320-enlarged.png'),
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Guardar clases', exact: true })
    .click();
  await page.getByRole('button', {
    name: 'Ver bloques de Clase desde Agenda',
    exact: true,
  })
    .waitFor();
  await page.getByText('Sala 301', { exact: true }).waitFor();
  await page.reload();
  await page.getByRole('button', { name: 'Agregar clases', exact: true })
    .waitFor({
      timeout: 60000,
    });
  await page.getByRole('button', { name: 'Agregar clases', exact: true })
    .click();
  await page.getByRole('button', {
    name: 'Usar un ramo que ya agregué',
    exact: true,
  }).click();
  await page.getByRole('button', {
    name: 'Elegir Clase desde Agenda',
    exact: true,
  }).click();
  await page.getByRole('radio', { name: 'Bloque 1: Lunes', exact: true })
    .click();
  await page.getByRole('button', { name: 'Guardar clases', exact: true })
    .click();
  await page.getByText('Ese bloque ya existe en el ramo.', { exact: true })
    .waitFor();
  await page.getByLabel('Término del bloque 1', { exact: true }).fill('09:30');
  await page.getByRole('button', { name: 'Guardar clases', exact: true })
    .click();
  await page.getByText('Hay bloques que se cruzan. ¿Quieres conservarlos?', {
    exact: true,
  })
    .waitFor();
  await page.getByRole('button', {
    name: 'Conservar los cruces y guardar',
    exact: true,
  }).click();
  await page.getByText('3 bloques semanales', { exact: false }).waitFor();
  await page.getByRole('button', { name: 'Agregar clases', exact: true })
    .click();
  await page.getByLabel('Nombre del ramo', { exact: true }).fill('No guardar');
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  assert.equal(await page.getByText('No guardar', { exact: true }).count(), 0);
  await page.screenshot({ path: path.join(output, 'agenda-class-entry.png') });
  await page.getByRole('button', {
    name: 'Editar horario y semestres',
    exact: true,
  }).click();
  await page.getByRole('button', { name: 'Editar semestre', exact: true })
    .click();
  await page.getByLabel('Nombre del semestre', { exact: true }).fill(
    'Semestre 1',
  );
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await page.getByRole('button', {
    name: 'Eliminar Clase desde Agenda',
    exact: true,
  }).click();
  await page.getByRole('button', { name: 'Confirmar eliminación', exact: true })
    .click();
  console.log(
    'Agenda ofrece alta visible: semestre, ramo y dos salas en un formulario; reuso, duplicados, cruces y cancelación correctos.',
  );
  await page.goto(origin + '/schedule');
  await page.getByRole('button', { name: 'Nuevo semestre', exact: true })
    .waitFor({
      state: 'visible',
      timeout: 60000,
    });
  await page.getByRole('button', { name: 'Semestre 1 · Activo', exact: true })
    .waitFor({
      timeout: 60000,
    });
  assert.equal(
    await page.getByRole('button', { name: 'Semestre 1 · Activo', exact: true })
      .getAttribute(
        'aria-pressed',
      ),
    'true',
  );
  await page.getByRole('button', { name: 'Nuevo semestre', exact: true })
    .click();
  await page.getByLabel('Nombre del semestre', { exact: true }).fill(
    'Semestre 2',
  );
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await page.getByRole('button', { name: 'Semestre 2', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Usar este horario', exact: true })
    .click();
  await page.getByRole('button', { name: 'Semestre 2 · Activo', exact: true })
    .waitFor();
  await page.getByRole('button', { name: 'Agregar ramo', exact: true }).click();
  await page.getByLabel('Nombre del ramo', { exact: true }).fill('Ramo manual');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await page.getByRole('button', { name: 'Editar Ramo manual', exact: true })
    .waitFor();
  await page.reload();
  await page.getByRole('button', { name: 'Editar Ramo manual', exact: true })
    .waitFor({
      timeout: 60000,
    });
  await page.screenshot({ path: path.join(output, 'semesters.png') });
  console.log(
    'Semestres, activación, ramo manual sin códigos y recarga: correctos.',
  );
  await page.getByRole('button', {
    name: 'Bloques de Ramo manual',
    exact: true,
  }).click();
  await page.getByRole('button', { name: 'Agregar bloque', exact: true })
    .click();
  await page.getByLabel('Sala de este bloque (opcional)', { exact: true }).fill(
    'Sala 301',
  );
  await page.getByRole('button', { name: 'Guardar bloque', exact: true })
    .click();
  await page.getByText('Lunes · 08:30–10:00', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Agregar bloque', exact: true })
    .click();
  await page.getByRole('button', { name: 'Miércoles', exact: true }).click();
  await page.getByLabel('Hora de inicio', { exact: true }).fill('11:00');
  await page.getByLabel('Hora de término', { exact: true }).fill('12:30');
  await page.getByLabel('Sala de este bloque (opcional)', { exact: true }).fill(
    'Laboratorio 402',
  );
  await page.getByRole('button', { name: 'Guardar bloque', exact: true })
    .click();
  await page.getByText('Laboratorio 402', { exact: true }).waitFor();
  await page.reload();
  await page.getByText('Sala 301', { exact: true }).waitFor({ timeout: 60000 });
  await page.getByText('Laboratorio 402', { exact: true }).waitFor();
  await page.getByRole('button', {
    name: 'Editar bloque Lunes 08:30–10:00',
    exact: true,
  }).click();
  await page.getByLabel('Sala de este bloque (opcional)', { exact: true }).fill(
    'Sala 302',
  );
  await page.getByRole('button', { name: 'Guardar bloque', exact: true })
    .click();
  await page.getByText('Sala 302', { exact: true }).waitFor();
  await page.getByText('Laboratorio 402', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Agregar bloque', exact: true })
    .click();
  await page.getByRole('button', { name: 'Guardar bloque', exact: true })
    .click();
  await page.getByText('Ese bloque ya existe en el ramo.', { exact: true })
    .waitFor();
  await page.getByLabel('Hora de término', { exact: true }).fill('08:00');
  await page.getByRole('button', { name: 'Guardar bloque', exact: true })
    .click();
  await page.getByText('La hora de término debe ser posterior al inicio.', {
    exact: true,
  })
    .waitFor();
  await page.getByLabel('Hora de término', { exact: true }).fill('09:30');
  await page.getByRole('button', { name: 'Guardar bloque', exact: true })
    .click();
  await page.getByText('Este bloque se cruza con:', { exact: true }).waitFor();
  await page.getByRole('button', {
    name: 'Conservar ambos bloques',
    exact: true,
  }).click();
  await page.getByText('Lunes · 08:30–09:30', { exact: true }).waitFor();

  const extra = await page.evaluate(
    (userId) =>
      JSON.parse(localStorage.getItem(`duocmind.planner.v1.${userId}`)).working
        .blocks.find((b) => b.endsAt === '09:30').id,
    user.id,
  );
  const extraCard = page.getByText('Lunes · 08:30–09:30', { exact: true })
    .locator('..');
  await extraCard.getByRole('button', {
    name: 'Eliminar bloque Lunes 08:30–09:30',
    exact: true,
  })
    .click();
  await page.getByRole('button', {
    name: 'Confirmar eliminación del bloque',
    exact: true,
  }).click();
  await page.getByText('Lunes · 08:30–09:30', { exact: true }).waitFor({
    state: 'hidden',
  });
  assert(
    !await page.evaluate(
      ([userId, id]) =>
        JSON.parse(localStorage.getItem(`duocmind.planner.v1.${userId}`))
          .working.blocks.some((b) => b.id === id),
      [user.id, extra],
    ),
  );
  assert.equal(await page.getByText('Sala 302', { exact: true }).count(), 1);
  console.log(
    'Duplicado e intervalo inválido rechazados; cruce confirmado y eliminación independiente: correctos.',
  );
  await page.screenshot({ path: path.join(output, 'blocks.png') });
  console.log(
    'Bloques semanales con salas independientes, edición y recarga: correctos.',
  );
  const localActivities = () =>
    page.evaluate(
      (userId) =>
        JSON.parse(localStorage.getItem(`duocmind.planner.v1.${userId}`))
          .activities,
      user.id,
    );
  await page.goto(origin + '/pendientes');
  await page.getByRole('button', { name: 'Nueva actividad', exact: true })
    .click();
  const personalDialog = page.getByRole('heading', {
    name: 'Nueva actividad',
    exact: true,
  })
    .locator('..');
  assert.equal(
    await personalDialog.getByText('Organización (opcional)', { exact: true })
      .count(),
    0,
  );
  assert.equal(
    await personalDialog.getByRole('button', {
      name: 'Semestre 1',
      exact: true,
    }).count(),
    0,
  );
  assert.equal(
    await personalDialog.getByRole('button', {
      name: 'Semestre 2',
      exact: true,
    }).count(),
    0,
  );
  await page.getByLabel('Nombre de la actividad', { exact: true }).fill(
    'Estudiar programación',
  );
  await page.getByLabel('Hora de inicio de la actividad', { exact: true }).fill('14:15');
  await page.getByLabel('Hora de término de la actividad', { exact: true }).fill('14:15');
  await page.getByRole('button', { name: 'Guardar actividad', exact: true }).click();
  await personalDialog.getByText(
    'La hora de término debe ser posterior al inicio dentro del mismo día.',
    {
      exact: true,
    },
  ).waitFor();
  await page.getByLabel('Hora de término de la actividad', { exact: true }).fill('16:45');
  await page.getByText('Ramo (opcional)', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Ramo manual', exact: true }).click();
  await page.getByRole('button', { name: 'Sin ramo', exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({
    path: path.join(output, 'personal-activity-optional-subject.png'),
  });
  await page.getByRole('button', { name: 'Guardar actividad', exact: true })
    .click();
  await page.getByRole('button', {
    name: 'Editar actividad Estudiar programación',
    exact: true,
  })
    .waitFor();
  const relatedPersonal = (await localActivities())[0];
  assert.equal(relatedPersonal.kind, 'personal');
  assert.equal(relatedPersonal.semesterId, null);
  assert.equal(relatedPersonal.subjectName, 'Ramo manual');
  assert.equal(relatedPersonal.time, '14:15');
  assert.equal(relatedPersonal.endTime, '16:45');
  await page.reload();
  await page.getByRole('button', { name: 'Editar actividad Estudiar programación', exact: true })
    .waitFor();
  await page.getByRole('button', {
    name: 'Editar actividad Estudiar programación',
    exact: true,
  })
    .click();
  await expect(page.getByLabel('Hora de inicio de la actividad', { exact: true })).toHaveValue(
    '14:15',
  );
  await expect(page.getByLabel('Hora de término de la actividad', { exact: true })).toHaveValue(
    '16:45',
  );
  await page.getByLabel('Hora de término de la actividad', { exact: true }).fill('17:00');
  await page.getByRole('button', { name: 'Sin ramo', exact: true }).click();
  await page.getByRole('button', { name: 'Guardar actividad', exact: true })
    .click();
  await page.getByRole('button', {
    name: 'Editar actividad Estudiar programación',
    exact: true,
  })
    .waitFor();
  assert.equal((await localActivities())[0].subjectName, null);
  assert.equal((await localActivities())[0].endTime, '17:00');
  await page.getByRole('button', {
    name: 'Eliminar actividad Estudiar programación',
    exact: true,
  })
    .click();
  await page.getByRole('button', {
    name: 'Confirmar eliminación de actividad',
    exact: true,
  })
    .click();
  await page.getByText('Sin actividades aquí', { exact: true }).waitFor();
  console.log(
    'Personal con ramo opcional o sin ramo; alta sin selector de organización ni otros semestres: correcto.',
  );
  await page.getByRole('button', { name: 'Nueva actividad', exact: true })
    .click();
  await page.getByLabel('Nombre de la actividad', { exact: true }).fill(
    'Evaluación local',
  );
  await page.getByRole('button', { name: 'Prueba', exact: true }).click();
  const examDialog = page.getByRole('heading', {
    name: 'Nueva actividad',
    exact: true,
  }).locator(
    '..',
  );
  assert.equal(
    await examDialog.getByRole('button', { name: 'Semestre 1', exact: true })
      .count(),
    0,
  );
  assert.equal(
    await examDialog.getByRole('button', { name: 'Sin ramo', exact: true })
      .count(),
    0,
  );
  await page.getByText('Semestre activo: Semestre 2', { exact: true })
    .waitFor();
  await page.getByRole('button', { name: 'Guardar actividad', exact: true })
    .click();
  await page.getByText(
    'Selecciona un ramo del semestre para guardar esta prueba o tarea.',
    {
      exact: true,
    },
  ).waitFor();
  await page.getByRole('button', { name: 'Ramo manual', exact: true }).click();
  await page.screenshot({
    path: path.join(output, 'academic-activity-active-semester.png'),
  });
  await page.getByLabel('Fecha de la actividad', { exact: true }).fill(
    '2030-10-12',
  );
  await page.getByRole('button', { name: 'Guardar actividad', exact: true })
    .click();
  await page.getByRole('button', {
    name: 'Editar actividad Evaluación local',
    exact: true,
  })
    .waitFor();
  const original = (await localActivities())[0];
  assert.equal(original.semesterName, 'Semestre 2');
  assert.equal(original.subjectName, 'Ramo manual');
  assert.equal(original.endTime, '10:00');
  await page.getByRole('button', {
    name: 'Seleccionar Evaluación local · Semestre 2',
    exact: true,
  })
    .click();
  await page.getByRole('button', {
    name: 'Copiar a otro semestre',
    exact: true,
  }).click();
  const copyModal = page.getByText('Copiar actividades', { exact: true })
    .locator('..');
  await copyModal.getByRole('button', { name: 'Semestre 1', exact: true })
    .click();
  await page.getByRole('button', {
    name: 'Confirmar traslado o copia',
    exact: true,
  }).click();
  await page.getByRole('button', {
    name: 'Seleccionar Evaluación local · Semestre 1',
    exact: true,
  })
    .waitFor();
  const copied = (await localActivities()).find((a) => a.id !== original.id);
  assert.notEqual(copied.id, original.id);
  assert.equal(copied.date, original.date);
  assert.equal(copied.time, original.time);
  assert.equal(copied.endTime, original.endTime);
  await page.getByRole('button', {
    name: 'Seleccionar Evaluación local · Semestre 1',
    exact: true,
  })
    .click();
  await page.getByRole('button', { name: 'Mover a otro semestre', exact: true })
    .click();
  const moveModal = page.getByText('Mover actividades', { exact: true })
    .locator('..');
  await moveModal.getByRole('button', { name: 'Semestre 2', exact: true })
    .click();
  await page.getByRole('button', {
    name: 'Confirmar traslado o copia',
    exact: true,
  }).click();
  await expect(
    page.getByRole('button', {
      name: 'Seleccionar Evaluación local · Semestre 2',
      exact: true,
    }),
  ).toHaveCount(2);
  assert.equal(
    (await localActivities()).find((a) => a.id === copied.id).date,
    original.date,
  );
  assert.equal((await localActivities()).length, 2);
  await page.evaluate(() =>
    localStorage.setItem(
      'duocmind.agenda.activities.v1',
      JSON.stringify([{
        id: 'antigua-sintética',
        title: 'Antigua local',
        date: '2030-10-12',
        time: '11:00',
        subject: null,
      }]),
    )
  );
  await page.getByRole('button', {
    name: 'Recuperar actividades anteriores',
    exact: true,
  }).click();
  assert.equal(
    await page.getByText('Antigua local', { exact: true }).count(),
    0,
  );
  await page.getByRole('button', {
    name: 'Entiendo, revisar actividades',
    exact: true,
  }).click();
  await page.getByRole('button', {
    name: 'Recuperar: Antigua local · 2030-10-12',
    exact: true,
  })
    .click();
  await page.getByRole('button', {
    name: 'Guardar selección en mi cuenta local',
    exact: true,
  })
    .click();
  await page.getByRole('button', {
    name: 'Editar actividad Antigua local',
    exact: true,
  }).waitFor();
  assert.equal(
    (await page.evaluate(() => JSON.parse(localStorage.getItem('duocmind.agenda.activities.v1'))))
      .length,
    1,
  );
  await page.reload();
  await page.getByRole('button', {
    name: 'Editar actividad Antigua local',
    exact: true,
  }).waitFor({
    timeout: 60000,
  });
  assert.equal((await localActivities()).length, 3);
  assert(!JSON.stringify(remoteWrites).includes('Evaluación local'));
  assert(!JSON.stringify(remoteWrites).includes('Antigua local'));
  await page.screenshot({ path: path.join(output, 'activities.png') });
  console.log(
    'Actividades locales, copia/traslado, recuperación explícita y payload remoto separado: correctos.',
  );
  await db.query(
    "insert into public.evento_institucional(id,title,description,location,starts_at,ends_at,status,published_at) values($1,'Evento agenda 013','Sintético','Patio','2030-10-14T12:00:00Z','2030-10-14T13:30:00Z','published',now())",
    [eventId],
  );
  eventCreated = true;
  await page.goto(origin + '/events/' + eventId);
  await page.getByRole('button', {
    name: 'Agregar Evento agenda 013 a mi agenda',
    exact: true,
  })
    .click();
  await page.getByRole('button', { name: 'Ver en mi agenda', exact: true })
    .click();
  await page.getByRole('button', {
    name: 'Ver bloques de Ramo manual',
    exact: true,
  }).waitFor();
  await page.getByText('Sala 302', { exact: true }).waitFor();
  await page.getByRole('button', {
    name: 'Ver detalles de Evento agenda 013',
    exact: true,
  })
    .waitFor();
  await page.getByRole('button', { name: 'Agregar actividad', exact: true })
    .click();
  await page.getByLabel('Nombre de la actividad', { exact: true }).fill(
    'Actividad del día',
  );
  await page.getByRole('button', { name: 'Guardar actividad', exact: true })
    .click();
  await page.getByRole('button', {
    name: 'Editar actividad Actividad del día',
    exact: true,
  })
    .waitFor();
  assert.equal(await page.locator('button button').count(), 0);
  await page.screenshot({ path: path.join(output, 'agenda.png') });
  await page.setViewportSize({ width: 320, height: 800 });
  await page.evaluate(() => {
    for (const node of document.querySelectorAll('[dir="auto"]')) {
      const style = getComputedStyle(node);
      node.style.fontSize = (parseFloat(style.fontSize) * 1.5) + 'px';
      if (style.lineHeight !== 'normal') {
        node.style.lineHeight = (parseFloat(style.lineHeight) * 1.5) + 'px';
      }
    }
  });
  assert.deepEqual(
    await page.getByRole('button').evaluateAll((nodes) =>
      nodes.filter((node) => {
        const r = node.getBoundingClientRect();
        return r.width > 0 && r.height > 0 &&
          (r.width < 43.9 || r.height < 43.9);
      }).map((node) => node.getAttribute('aria-label') ?? node.textContent)
    ),
    [],
  );
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
    false,
  );
  await page.screenshot({ path: path.join(output, 'agenda-320-enlarged.png') });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(origin + '/agenda?date=2030-10-16');
  await page.getByText('Laboratorio 402', { exact: true }).waitFor();
  await page.goto(origin + '/schedule');
  const activitiesBeforeSwitch = await localActivities();
  await page.getByRole('button', { name: 'Semestre 1', exact: true }).click();
  await page.getByRole('button', { name: 'Usar este horario', exact: true })
    .click();
  await page.getByRole('button', { name: 'Semestre 1 · Activo', exact: true })
    .waitFor();
  assert.deepEqual(await localActivities(), activitiesBeforeSwitch);
  await page.getByRole('button', { name: 'Semestre 2', exact: true }).click();
  await page.getByRole('button', { name: 'Usar este horario', exact: true })
    .click();
  await page.getByRole('button', { name: 'Semestre 2 · Activo', exact: true })
    .waitFor();
  await page.reload();
  await page.getByRole('button', { name: 'Semestre 2 · Activo', exact: true })
    .waitFor();
  assert.deepEqual(await localActivities(), activitiesBeforeSwitch);
  await page.getByRole('button', { name: 'Semestre 1', exact: true }).click();
  await page.getByRole('button', { name: 'Usar este horario', exact: true })
    .click();
  await page.getByRole('button', { name: 'Semestre 1 · Activo', exact: true })
    .waitFor();
  await page.goto(origin + '/agenda?date=2030-10-14');
  await page.getByRole('button', {
    name: 'Editar actividad Actividad del día',
    exact: true,
  })
    .waitFor();
  assert.equal(
    await page.getByRole('button', {
      name: 'Ver bloques de Ramo manual',
      exact: true,
    }).count(),
    0,
  );
  await page.getByRole('button', {
    name: 'Ver detalles de Evento agenda 013',
    exact: true,
  })
    .waitFor();
  console.log(
    'Agenda con clases, salas, actividad y evento; cambiar semestre conserva actividades/eventos: correcto.',
  );
  await page.goto(origin + '/dashboard');
  await page.getByText('Evaluación local', { exact: true }).filter({
    visible: true,
  }).first()
    .waitFor({
      timeout: 60000,
    });
  assert.equal(
    await page.getByText('Hoy no tienes clases', { exact: true }).count(),
    0,
  );
  assert.equal(
    await page.getByText('Base de Datos', { exact: true }).count(),
    0,
  );
  assert.equal(
    await page.getByText('Prueba 2 · Programación Web', { exact: true })
      .count(),
    0,
  );
  await page.getByRole('button', {
    name: 'Ver todas mis actividades',
    exact: true,
  }).waitFor();
  await page.screenshot({ path: path.join(output, 'dashboard.png') });
  console.log(
    'Inicio muestra estado real y pendientes locales sin datos de muestra: correcto.',
  );
  // Segundo navegador independiente: el horario se recupera, las actividades no.
  await page.goto(origin + '/schedule');
  await page.getByText('Horario sincronizado', { exact: true }).waitFor({
    timeout: 60000,
  });
  const second = await browser.newPage({
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce',
  });
  second.on('pageerror', (e) => errors.push(e.message));
  await second.goto(origin + '/login');
  await second.getByPlaceholder('ejemplo@universidad.edu').fill(email);
  await second.getByPlaceholder('••••••••').fill(password);
  await second.getByRole('button', { name: /Iniciar Sesión/ }).click();
  await second.waitForURL(/dashboard/, { timeout: 60000 });
  await second.goto(origin + '/schedule');
  await second.getByRole('button', { name: 'Semestre 2', exact: true }).waitFor(
    { timeout: 60000 },
  );
  await second.getByRole('button', { name: 'Semestre 2', exact: true }).click();
  await second.getByRole('button', {
    name: 'Bloques de Ramo manual',
    exact: true,
  }).click();
  await second.getByText('Sala 302', { exact: true }).waitFor();
  await second.getByText('Laboratorio 402', { exact: true }).waitFor();
  await second.goto(origin + '/pendientes');
  await second.getByText('Sin actividades aquí', { exact: true }).waitFor();
  await second.goto(origin + '/schedule');
  await second.getByRole('button', { name: 'Semestre 1 · Activo', exact: true })
    .click();
  const backend = runtime().API_URL + '/**';
  await page.context().route(backend, (route) => route.abort());
  await page.getByRole('button', { name: 'Editar semestre', exact: true })
    .click();
  await page.getByLabel('Nombre del semestre', { exact: true }).fill(
    'Semestre local',
  );
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await page.getByRole('button', {
    name: 'Semestre local · Activo',
    exact: true,
  }).waitFor();
  await page.getByText('Guardado aquí · Pendiente de sincronizar', {
    exact: true,
  }).waitFor();
  await page.reload();
  await page.getByRole('button', {
    name: 'Semestre local · Activo',
    exact: true,
  }).waitFor({
    timeout: 60000,
  });
  await page.getByRole('button', { name: 'Reintentar', exact: true }).waitFor();
  await second.getByRole('button', { name: 'Editar semestre', exact: true })
    .click();
  await second.getByLabel('Nombre del semestre', { exact: true }).fill(
    'Semestre remoto',
  );
  await second.getByRole('button', { name: 'Guardar', exact: true }).click();
  await second.getByRole('button', {
    name: 'Semestre remoto · Activo',
    exact: true,
  }).waitFor();
  await second.getByText('Horario sincronizado', { exact: true }).waitFor({
    timeout: 60000,
  });
  await page.context().unroute(backend);
  await page.getByRole('button', { name: 'Reintentar', exact: true }).click();
  await page.getByText('Hay dos versiones del horario', { exact: true })
    .waitFor({
      timeout: 60000,
    });
  await page.getByRole('button', { name: 'Comparar versiones', exact: true })
    .click();
  await page.getByText('Semestre local · Activo', { exact: true }).first()
    .waitFor();
  await page.getByText('Semestre remoto · Activo', { exact: true }).waitFor();
  await page.screenshot({ path: path.join(output, 'conflict.png') });
  await page.getByRole('button', { name: 'Conservar mis cambios', exact: true })
    .click();
  await page.getByRole('button', { name: 'Confirmar elección', exact: true })
    .click();
  await page.getByText('Horario sincronizado', { exact: true }).waitFor({
    timeout: 60000,
  });
  await second.reload();
  await second.getByRole('button', {
    name: 'Semestre local · Activo',
    exact: true,
  }).waitFor({
    timeout: 60000,
  });
  assert.equal((await localActivities()).length, 4);
  console.log(
    'Segundo cliente recupera salas sin actividades; corte del backend conserva edición tras recarga; conflicto comparado/resuelto sin perder actividades: correcto.',
  );
  // Diálogo abierto sobre una versión anterior: no puede eliminar un ramo actualizado.
  await page.getByRole('button', { name: 'Semestre 2', exact: true }).click();
  await page.getByRole('button', { name: 'Eliminar Ramo manual', exact: true })
    .click();
  await second.getByRole('button', { name: 'Semestre 2', exact: true }).click();
  await second.getByRole('button', { name: 'Editar Ramo manual', exact: true })
    .click();
  await second.getByLabel('Nombre del ramo', { exact: true }).fill(
    'Ramo actualizado',
  );
  await second.getByRole('button', { name: 'Guardar', exact: true }).click();
  await second.getByText('Horario sincronizado', { exact: true }).waitFor({
    timeout: 60000,
  });
  // Otro tab del mismo dispositivo actualiza el almacén mientras el diálogo sigue abierto.
  const updated = await second.evaluate(
    (userId) => JSON.parse(localStorage.getItem(`duocmind.planner.v1.${userId}`)),
    user.id,
  );
  const tab = await page.context().newPage();
  await tab.goto(origin + '/login');
  await tab.evaluate(([userId, value]) => {
    const key = `duocmind.planner.v1.${userId}`,
      own = JSON.parse(localStorage.getItem(key));
    localStorage.setItem(
      key,
      JSON.stringify({
        ...own,
        base: value.base,
        working: value.working,
        inFlight: null,
        conflict: null,
        initialized: true,
      }),
    );
  }, [user.id, updated]);
  await page.getByText('Ramo actualizado', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Confirmar eliminación', exact: true })
    .click();
  await page.getByText(
    'El horario cambió. Revisa la versión actual antes de guardar.',
    {
      exact: true,
    },
  ).filter({ visible: true }).first().waitFor();
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await page.getByRole('button', {
    name: 'Bloques de Ramo actualizado',
    exact: true,
  }).waitFor();
  await tab.close();
  await second.close();
  await page.setViewportSize({ width: 320, height: 800 });
  await page.evaluate(() => {
    for (const node of document.querySelectorAll('[dir="auto"],input')) {
      const style = getComputedStyle(node);
      node.style.fontSize = (parseFloat(style.fontSize) * 1.5) + 'px';
      if (style.lineHeight !== 'normal') {
        node.style.lineHeight = (parseFloat(style.lineHeight) * 1.5) + 'px';
      }
    }
  });
  const undersized = await page.getByRole('button').evaluateAll((nodes) =>
    nodes.filter((node) => {
      const r = node.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && (r.width < 43.9 || r.height < 43.9);
    }).map((node) => node.getAttribute('aria-label') ?? node.textContent)
  );
  assert.deepEqual(undersized, []);
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
    false,
  );
  await page.screenshot({
    path: path.join(output, 'schedule-320-enlarged.png'),
  });
  await page.getByRole('button', { name: 'Agregar ramo', exact: true }).click();
  await page.getByLabel('Nombre del ramo', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  console.log(
    'Confirmación obsoleta rechazada; etiquetas, controles de 44 px y texto al 150% en 320 px: correctos.',
  );
  const otherEmail = `planner-other-${crypto.randomUUID()}@example.test`,
    otherPassword = crypto.randomBytes(24).toString('base64url');
  const otherCreated = await admin.auth.admin.createUser({
    email: otherEmail,
    password: otherPassword,
    email_confirm: true,
  });
  if (otherCreated.error) {
    throw Error('No se pudo crear segunda cuenta sintética');
  }
  otherUser = otherCreated.data.user;
  await db.query(
    "insert into public.estudiante(auth_user_id,rut,primer_nombre,primer_apellido) values($1,$2,'Otra','Cuenta')",
    [otherUser.id, `PLANNER-E2E-${otherUser.id}`],
  );
  await page.goto(origin + '/dashboard');
  await page.getByRole('button', { name: /^Perfil de/ }).click();
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true })
    .click();
  await page.waitForURL(/login/);
  await page.getByPlaceholder('ejemplo@universidad.edu').fill(otherEmail);
  await page.getByPlaceholder('••••••••').fill(otherPassword);
  await page.getByRole('button', { name: /Iniciar Sesión/ }).click();
  await page.waitForURL(/dashboard/);
  await page.goto(origin + '/pendientes');
  await page.getByText('Sin actividades aquí', { exact: true }).waitFor();
  assert.equal(
    await page.getByText('Evaluación local', { exact: true }).count(),
    0,
  );
  await page.goto(origin + '/dashboard');
  await page.getByRole('button', { name: /^Perfil de/ }).click();
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true })
    .click();
  await page.waitForURL(/login/);
  await page.getByPlaceholder('ejemplo@universidad.edu').fill(email);
  await page.getByPlaceholder('••••••••').fill(password);
  await page.getByRole('button', { name: /Iniciar Sesión/ }).click();
  await page.waitForURL(/dashboard/);
  await page.goto(origin + '/pendientes');
  await page.getByRole('button', {
    name: 'Editar actividad Antigua local',
    exact: true,
  }).waitFor({
    timeout: 60000,
  });
  assert.equal((await localActivities()).length, 4);
  assert.deepEqual(errors, []);
  console.log(
    'Cambio de cuenta aísla actividades y volver a la original conserva los datos locales: correcto.',
  );
} catch (error) {
  for (
    const page of browser?.contexts().flatMap((context) => context.pages()) ??
      []
  ) {
    if (page.url().startsWith(origin)) {
      await page.screenshot({ path: path.join(output, 'failure.png') }).catch(
        () => {},
      );
    }
  }
  throw error;
} finally {
  if (browser) await browser.close();
  if (eventCreated) {
    await db.query('delete from public.evento_institucional where id=$1', [
      eventId,
    ]);
  }
  if (otherUser) {
    await admin.auth.admin.deleteUser(otherUser.id);
    await db.query('delete from public.estudiante where rut=$1', [
      `PLANNER-E2E-${otherUser.id}`,
    ]);
  }
  if (user) {
    await admin.auth.admin.deleteUser(user.id);
    await db.query('delete from public.estudiante where rut=$1', [
      `PLANNER-E2E-${user.id}`,
    ]);
  }
  await db.end();
}
