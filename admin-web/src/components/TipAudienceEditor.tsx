import type { FormOptions, TipRule } from "../domain/types";

export function tipRuleLabel(rule: TipRule, options: FormOptions | null) {
  if (rule.kind === "mood") return `Ánimo: ${rule.mood}`;
  const result = options?.resultLevels.find((level) =>
    level.catalogId === rule.catalogId && level.versionId === rule.versionId &&
    level.level === rule.level
  );
  return `${result?.title ?? "Test"} · versión ${rule.version} · ${
    result?.label || rule.level
  }${result && !result.active ? " · versión anterior inactiva" : ""}`;
}
interface Props {
  general: boolean;
  rules: TipRule[];
  options: FormOptions | null;
  onGeneral: () => void;
  onPersonalized: () => void;
  onRules: (rules: TipRule[]) => void;
}
export function TipAudienceEditor(
  { general, rules, options, onGeneral, onPersonalized, onRules }: Props,
) {
  const groups = [
    ...new Set(options?.resultLevels.map((level) => level.versionId) ?? []),
  ];
  function chooseResult(value: string) {
    if (value === "general") {
      onGeneral();
      return;
    }
    const result = options?.resultLevels[Number(value)];
    if (value === "" || !result) return;
    const rule: TipRule = {
      kind: "result",
      catalogId: result.catalogId,
      versionId: result.versionId,
      version: result.version,
      level: result.level,
    };
    onPersonalized();
    if (
      !rules.some((old) =>
        old.kind === "result" && old.catalogId === rule.catalogId &&
        old.versionId === rule.versionId && old.level === rule.level
      )
    ) onRules([...rules, rule]);
  }
  return (
    <>
      <p>
        Elige si el consejo sirve sin condiciones o si quieres asociarlo a una
        situación concreta.
      </p>
      <div className="audience-choices">
        <label
          className={general ? "audience-choice chosen" : "audience-choice"}
        >
          <input
            type="radio"
            name="tip-audience"
            checked={general}
            onChange={onGeneral}
          />
          <span>
            <strong>General · sin condiciones</strong>
            <span>
              Consejo de apoyo general. No depende del ánimo ni de haber
              respondido un test.
            </span>
          </span>
        </label>
        <label
          className={!general ? "audience-choice chosen" : "audience-choice"}
        >
          <input
            type="radio"
            name="tip-audience"
            checked={!general}
            onChange={onPersonalized}
          />
          <span>
            <strong>Personalizado · según una condición</strong>
            <span>
              Elige uno o varios ánimos, resultados de tests, o ambos.
            </span>
          </span>
        </label>
      </div>
      <fieldset disabled={general} className="editor-item">
        <legend>Por ánimo</legend>
        <p className="field-help">
          Asocia este consejo al ánimo que el alumno haya confirmado. Por
          ejemplo, seleccionar «Mal» permite usarlo cuando el alumno indique que
          se siente mal. Puedes elegir varios ánimos.
        </p>
        {general && (
          <p className="field-help">
            Para seleccionar ánimos, elige «Personalizado» arriba.
          </p>
        )}
        <div className="mood-choices">
          {options?.moods.map((mood) => (
            <label key={mood} className="inline">
              <input
                type="checkbox"
                checked={rules.some((r) =>
                  r.kind === "mood" && r.mood === mood
                )}
                onChange={(e) =>
                  onRules(
                    e.target.checked
                      ? [...rules, { kind: "mood", mood }]
                      : rules.filter((r) =>
                        r.kind !== "mood" || r.mood !== mood
                      ),
                  )}
              />
              {mood}
            </label>
          ))}
        </div>
        {!options && (
          <p className="field-help">
            Los ánimos se mostrarán cuando carguen las opciones del formulario.
          </p>
        )}
      </fieldset>
      <div className="tip-result-picker">
        <h3>Por resultado de un test</h3>
        <p className="field-help" id="tip-result-help">
          Un nivel de resultado es la categoría obtenida al terminar un test.
          Por ejemplo, un resultado de estrés elevado puede asociarse a un
          consejo para hacer una pausa. Cada categoría pertenece a un test y a
          una versión concretos.
        </p>
        <label>
          Nivel de resultado
          <select
            value={general ? "general" : ""}
            aria-describedby="tip-result-help tip-general-help"
            onChange={(e) => chooseResult(e.target.value)}
          >
            <option value="">Selecciona un resultado para añadirlo</option>
            <option value="general">General · sin condiciones</option>
            {groups.map((versionId) => {
              const version = options!.resultLevels.find((l) =>
                l.versionId === versionId
              )!;
              return (
                <optgroup
                  key={versionId}
                  label={`${version.title} · versión ${version.version}${
                    version.active ? "" : " · anterior inactiva"
                  }`}
                >
                  {options!.resultLevels.map((level, i) =>
                    level.versionId === versionId
                      ? (
                        <option
                          key={level.level}
                          value={i}
                          disabled={rules.some((r) =>
                            r.kind === "result" &&
                            r.versionId === level.versionId &&
                            r.level === level.level
                          )}
                        >
                          {level.label || level.level}
                        </option>
                      )
                      : null
                  )}
                </optgroup>
              );
            })}
          </select>
        </label>
        <p className="field-help" id="tip-general-help">
          Seleccionar un resultado lo añade al consejo. Elegir «General» quita
          todas las condiciones, incluidos los ánimos seleccionados.
        </p>
        {options && !options.resultLevels.length && (
          <p className="field-help">
            No hay resultados de tests publicados disponibles para asociar.
          </p>
        )}
      </div>
      <section
        className="score-explainer"
        aria-label="Cuándo se aplica el consejo"
      >
        <h3>{general ? "Consejo general" : "Condiciones seleccionadas"}</h3>
        {general
          ? (
            <p>
              Este consejo no necesita un ánimo ni un resultado de test. Puede
              formar parte de los consejos generales de la app.
            </p>
          )
          : rules.length
          ? (
            <>
              <p>
                Basta con que se cumpla una de estas condiciones. No es
                necesario que coincidan todas; el consejo se muestra una sola
                vez si coincide con varias.
              </p>
              <ul className="tip-rule-list">
                {rules.map((rule, i) => (
                  <li key={JSON.stringify(rule)}>
                    <span>{tipRuleLabel(rule, options)}</span>
                    <button
                      type="button"
                      className="secondary"
                      aria-label={`Quitar condición ${i + 1}`}
                      onClick={() => onRules(rules.filter((_r, j) => j !== i))}
                    >
                      Quitar
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )
          : (
            <p>
              Selecciona al menos un ánimo o un resultado de test. Si no quieres
              añadir condiciones, elige «General».
            </p>
          )}
      </section>
    </>
  );
}
