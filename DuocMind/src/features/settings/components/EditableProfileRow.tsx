import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';
import { GotaLoader } from '@/shared/components/GotaLoader';
import { LockIcon, PencilIcon } from '@/shared/components/Icons';
import type { EditResult } from '../application/studentProfileEdit';
import { styles } from './EditableProfileRow.styles';

const DOUBLE_TAP_MS = 350;
/** Tiempo para saber si el foco pasó a otro campo de la misma fila antes de guardar. */
const BLUR_GRACE_MS = 120;

export interface EditableField {
  key: string;
  label: string;
  initial: string;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'words';
  autoComplete?: 'email' | 'tel' | 'name' | 'off';
  /** Parte fija a la izquierda del campo (por ejemplo, la bandera y el +56); no se puede borrar. */
  prefix?: React.ReactNode;
  prefixLabel?: string;
  /** Filtro aplicado al escribir y al pegar: lo que no corresponde simplemente no entra. */
  sanitize?: (text: string) => string;
}

interface EditableProfileRowProps {
  label: string;
  /** Texto mostrado cuando la fila no se edita. */
  value: string;
  /** Sin campos, la fila es de solo lectura. */
  fields?: EditableField[];
  onSave?: (values: Record<string, string>) => Promise<EditResult>;
  divider?: boolean;
}

/* Fila de «Mi perfil». Con dos toques rápidos pasa a edición en el mismo lugar; se guarda al pulsar
 * «Listo» en el teclado o al salir del campo. Sin botón de editar. */
export function EditableProfileRow({ label, value, fields, onSave, divider }: EditableProfileRowProps) {
  const editable = Boolean(fields?.length && onSave);
  const [editing, setEditing] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const lastTap = useRef(0);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputs = useRef<Record<string, TextInput | null>>({});
  const mounted = useRef(true);
  const savingRef = useRef(false);

  useEffect(
    () => () => {
      mounted.current = false;
      if (blurTimer.current) clearTimeout(blurTimer.current);
    },
    [],
  );

  const startEditing = () => {
    if (!editable || editing) return;
    setDrafts(Object.fromEntries((fields ?? []).map((field) => [field.key, field.initial])));
    setError(null);
    setNotice(null);
    setEditing(true);
  };

  const handlePress = () => {
    const now = Date.now();
    if (now - lastTap.current <= DOUBLE_TAP_MS) {
      lastTap.current = 0;
      startEditing();
    } else {
      lastTap.current = now;
    }
  };

  const commit = async () => {
    // «Listo» y la salida del campo disparan guardar casi a la vez: solo cuenta el primero.
    if (!onSave || !fields || savingRef.current) return;
    const changed = fields.some((field) => (drafts[field.key] ?? '').trim() !== field.initial.trim());
    if (!changed) {
      setEditing(false);
      setError(null);
      return;
    }
    savingRef.current = true;
    setSaving(true);
    const result = await onSave(drafts);
    savingRef.current = false;
    if (!mounted.current) return;
    setSaving(false);
    if (result.ok) {
      setEditing(false);
      setError(null);
      setNotice(result.notice ?? null);
    } else {
      setError(result.error);
    }
  };

  const handleFocus = () => {
    if (blurTimer.current) clearTimeout(blurTimer.current);
  };

  const handleBlur = () => {
    if (blurTimer.current) clearTimeout(blurTimer.current);
    blurTimer.current = setTimeout(() => void commit(), BLUR_GRACE_MS);
  };

  const rowStyle = [styles.row, divider && styles.divider];

  if (!editing) {
    return (
      <View style={rowStyle}>
        <Pressable
          disabled={!editable}
          onPress={handlePress}
          accessible
          accessibilityLabel={`${label}: ${value}`}
          accessibilityHint={editable ? 'Toca dos veces rápido para editar' : undefined}
          accessibilityActions={editable ? [{ name: 'activate', label: 'Editar' }] : undefined}
          onAccessibilityAction={startEditing}
        >
          <View style={styles.readRow}>
            <View style={styles.readText}>
              <Text style={styles.label}>{label}</Text>
              <Text style={[styles.value, !editable && styles.valueLocked]}>{value}</Text>
            </View>
            {/* Marca de solo vista: lápiz si se puede editar, candado si no. No es un botón. */}
            <View importantForAccessibility="no" accessibilityElementsHidden>
              {editable ? <PencilIcon size={16} color="#1a2b44" /> : <LockIcon size={16} color="#c2bba7" />}
            </View>
          </View>
        </Pressable>
        {notice ? (
          <Text accessibilityLiveRegion="polite" style={styles.notice}>
            {notice}
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <View style={rowStyle}>
      <Text style={styles.label}>{label}</Text>
      {fields?.map((field, index) => {
        const isLast = index === fields.length - 1;
        return (
          <View key={field.key} style={index > 0 && styles.fieldSpaced}>
            {fields.length > 1 ? <Text style={styles.fieldLabel}>{field.label}</Text> : null}
            <View style={[styles.inputBox, error ? styles.inputError : null]}>
              {field.prefix ? (
                <View accessible accessibilityLabel={field.prefixLabel} style={styles.prefix}>
                  {field.prefix}
                </View>
              ) : null}
              <TextInput
              ref={(node) => {
                inputs.current[field.key] = node;
              }}
              style={styles.input}
              value={drafts[field.key] ?? ''}
              onChangeText={(text) => {
                setDrafts((current) => ({ ...current, [field.key]: field.sanitize ? field.sanitize(text) : text }));
                setError(null);
              }}
              onFocus={handleFocus}
              onBlur={handleBlur}
              editable={!saving}
              autoFocus={index === 0}
              placeholder={field.placeholder}
              placeholderTextColor="#a8a08c"
              keyboardType={field.keyboardType}
              autoCapitalize={field.autoCapitalize ?? 'none'}
              autoComplete={field.autoComplete}
              autoCorrect={false}
              returnKeyType={isLast ? 'done' : 'next'}
              blurOnSubmit={isLast}
              onSubmitEditing={() => {
                if (isLast) void commit();
                else inputs.current[fields[index + 1].key]?.focus();
              }}
              accessibilityLabel={`${label}${fields.length > 1 ? `, ${field.label}` : ''}`}
              />
            </View>
          </View>
        );
      })}
      {saving ? (
        <View style={styles.saving}>
          <GotaLoader size="sm" text="Guardando…" />
        </View>
      ) : error ? (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          {error}
        </Text>
      ) : (
        <Text style={styles.hint}>Pulsa «Listo» en el teclado para guardar.</Text>
      )}
    </View>
  );
}
