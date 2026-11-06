begin;

create schema duocmind;

comment on schema duocmind is
  'Modelo privado de DuocMind. No se expone directamente a roles cliente.';

revoke all on schema duocmind from public, anon, authenticated, service_role;

alter default privileges for role postgres in schema duocmind
  revoke all on tables from public, anon, authenticated, service_role;
alter default privileges for role postgres in schema duocmind
  revoke all on sequences from public, anon, authenticated, service_role;
alter default privileges for role postgres in schema duocmind
  revoke all on functions from public, anon, authenticated, service_role;

create table duocmind.account_state (
  user_id uuid primary key references auth.users (id)
    on update no action on delete no action,
  primary_device_id uuid,
  primary_epoch bigint not null default 0
    constraint account_state_primary_epoch_nonnegative check (primary_epoch >= 0),
  account_status text not null default 'active'
    constraint account_state_status_valid check (
      account_status in ('active', 'deletion_scheduled')
    ),
  server_revision bigint not null default 0
    constraint account_state_server_revision_nonnegative check (server_revision >= 0)
);

create table duocmind.account_devices (
  user_id uuid not null,
  device_id uuid not null,
  verification_key bytea not null
    constraint account_devices_verification_key_nonempty check (
      octet_length(verification_key) > 0
    ),
  status text not null default 'active'
    constraint account_devices_status_valid check (status in ('active', 'revoked')),
  deletion_channel_id uuid not null
    constraint account_devices_deletion_channel_unique unique,
  deletion_verification_key bytea not null
    constraint account_devices_deletion_key_nonempty check (
      octet_length(deletion_verification_key) > 0
    ),
  constraint account_devices_distinct_keys check (
    verification_key <> deletion_verification_key
  ),
  constraint account_devices_pkey primary key (user_id, device_id),
  constraint account_devices_account_fkey foreign key (user_id)
    references duocmind.account_state (user_id)
    on update no action on delete no action
);

alter table duocmind.account_state
  add constraint account_state_primary_device_fkey
  foreign key (user_id, primary_device_id)
  references duocmind.account_devices (user_id, device_id)
  on update no action on delete no action
  deferrable initially deferred;

create table duocmind.account_notice_acceptances (
  user_id uuid not null,
  device_id uuid not null,
  scope text not null
    constraint account_notice_acceptances_scope_valid check (
      scope in ('general', 'recovery', 'deletion', 'cancellation')
    ),
  notice_version text not null
    constraint account_notice_acceptances_version_nonempty check (
      btrim(notice_version) <> ''
    ),
  purpose text not null
    constraint account_notice_acceptances_purpose_valid check (
      purpose in (
        'account_access',
        'access_recovery',
        'account_deletion',
        'deletion_cancellation'
      )
    ),
  decision text not null default 'accepted'
    constraint account_notice_acceptances_decision_valid check (decision = 'accepted'),
  decided_at timestamptz not null
    constraint account_notice_acceptances_decided_at_finite check (isfinite(decided_at)),
  constraint account_notice_acceptances_pkey primary key (user_id, device_id, scope),
  constraint account_notice_acceptances_device_fkey
    foreign key (user_id, device_id)
    references duocmind.account_devices (user_id, device_id)
    on update no action on delete no action,
  constraint account_notice_acceptances_scope_purpose_match check (
    (scope = 'general' and purpose = 'account_access')
    or (scope = 'recovery' and purpose = 'access_recovery')
    or (scope = 'deletion' and purpose = 'account_deletion')
    or (scope = 'cancellation' and purpose = 'deletion_cancellation')
  )
);

create table duocmind.sync_consents (
  user_id uuid not null,
  device_id uuid not null,
  category text not null default 'emotional_source'
    constraint sync_consents_category_valid check (category = 'emotional_source'),
  status text not null
    constraint sync_consents_status_valid check (status in ('enabled', 'disabled')),
  notice_version text not null
    constraint sync_consents_notice_version_nonempty check (btrim(notice_version) <> ''),
  decided_at timestamptz not null
    constraint sync_consents_decided_at_finite check (isfinite(decided_at)),
  consent_revision bigint not null
    constraint sync_consents_revision_positive check (consent_revision > 0),
  constraint sync_consents_pkey primary key (user_id, device_id, category),
  constraint sync_consents_device_fkey foreign key (user_id, device_id)
    references duocmind.account_devices (user_id, device_id)
    on update no action on delete no action
);

create table duocmind.emotion_entries (
  user_id uuid not null,
  entry_id uuid not null,
  emotion text not null
    constraint emotion_entries_emotion_valid check (
      emotion in ('joy', 'calm', 'sadness', 'anger', 'fear', 'surprise', 'neutral')
    ),
  local_date date not null
    constraint emotion_entries_local_date_finite check (isfinite(local_date)),
  recorded_at timestamptz not null
    constraint emotion_entries_recorded_at_finite check (isfinite(recorded_at)),
  time_zone text not null
    constraint emotion_entries_time_zone_nonempty check (btrim(time_zone) <> ''),
  local_revision bigint not null
    constraint emotion_entries_local_revision_positive check (local_revision > 0),
  server_revision bigint not null
    constraint emotion_entries_server_revision_positive check (server_revision > 0),
  constraint emotion_entries_pkey primary key (user_id, entry_id),
  constraint emotion_entries_user_date_unique unique (user_id, local_date),
  constraint emotion_entries_account_fkey foreign key (user_id)
    references duocmind.account_state (user_id)
    on update no action on delete no action
);

create table duocmind.sync_streams (
  user_id uuid not null,
  stream_id uuid not null,
  device_id uuid not null,
  primary_epoch bigint not null
    constraint sync_streams_primary_epoch_positive check (primary_epoch > 0),
  consent_revision bigint not null
    constraint sync_streams_consent_revision_positive check (consent_revision > 0),
  last_processed_seq bigint not null default 0,
  acknowledged_seq bigint not null default 0,
  known_server_revision bigint,
  state text not null default 'recovering'
    constraint sync_streams_state_valid check (state in ('recovering', 'ready', 'retired')),
  constraint sync_streams_pkey primary key (user_id, stream_id),
  constraint sync_streams_device_fkey foreign key (user_id, device_id)
    references duocmind.account_devices (user_id, device_id)
    on update no action on delete no action,
  constraint sync_streams_sequences_valid check (
    acknowledged_seq >= 0
    and last_processed_seq >= 0
    and acknowledged_seq <= last_processed_seq
  ),
  constraint sync_streams_known_revision_nonnegative check (
    known_server_revision is null or known_server_revision >= 0
  ),
  constraint sync_streams_state_revision_match check (
    (state = 'recovering' and known_server_revision is null)
    or (state = 'ready' and known_server_revision is not null)
    or state = 'retired'
  )
);

create table duocmind.sync_receipts (
  user_id uuid not null,
  stream_id uuid not null,
  operation_id uuid not null,
  sequence bigint not null
    constraint sync_receipts_sequence_positive check (sequence > 0),
  entry_id uuid,
  action text not null
    constraint sync_receipts_action_valid check (action in ('create', 'update')),
  status text not null
    constraint sync_receipts_status_valid check (status in ('applied', 'rejected')),
  error_code text,
  server_revision bigint not null
    constraint sync_receipts_server_revision_nonnegative check (server_revision >= 0),
  constraint sync_receipts_pkey primary key (user_id, stream_id, sequence),
  constraint sync_receipts_operation_unique unique (user_id, operation_id),
  constraint sync_receipts_stream_fkey foreign key (user_id, stream_id)
    references duocmind.sync_streams (user_id, stream_id)
    on update no action on delete no action,
  constraint sync_receipts_result_valid check (
    (
      status = 'applied'
      and entry_id is not null
      and error_code is null
      and server_revision > 0
    )
    or (
      status = 'rejected'
      and error_code is not null
      and btrim(error_code) <> ''
    )
  )
);

create table duocmind.control_receipts (
  user_id uuid not null,
  device_id uuid not null,
  operation_kind text not null
    constraint control_receipts_operation_kind_valid check (
      operation_kind in (
        'bind_installation',
        'accept_account_notice',
        'set_consent',
        'set_primary',
        'request_deletion',
        'cancel_account_deletion'
      )
    ),
  request_id uuid not null,
  status text not null
    constraint control_receipts_status_valid check (status in ('applied', 'rejected')),
  result_code text not null
    constraint control_receipts_result_code_nonempty check (btrim(result_code) <> ''),
  result_reference uuid,
  result_revision bigint
    constraint control_receipts_result_revision_nonnegative check (
      result_revision is null or result_revision >= 0
    ),
  confirmed_at timestamptz not null
    constraint control_receipts_confirmed_at_finite check (isfinite(confirmed_at)),
  constraint control_receipts_pkey primary key (
    user_id,
    device_id,
    operation_kind,
    request_id
  ),
  constraint control_receipts_device_fkey foreign key (user_id, device_id)
    references duocmind.account_devices (user_id, device_id)
    on update no action on delete no action
);

create table duocmind.deletion_markers (
  marker_id uuid primary key,
  request_token uuid not null
    constraint deletion_markers_request_token_unique unique,
  confirmed_at timestamptz not null
    constraint deletion_markers_confirmed_at_finite check (isfinite(confirmed_at)),
  expires_at timestamptz not null
    constraint deletion_markers_expires_at_finite check (isfinite(expires_at)),
  status text not null
    constraint deletion_markers_status_valid check (
      status in ('scheduled', 'cancelled', 'completed')
    ),
  cancelled_at timestamptz
    constraint deletion_markers_cancelled_at_finite check (
      cancelled_at is null or isfinite(cancelled_at)
    ),
  constraint deletion_markers_expiry_exact check (
    expires_at = confirmed_at + interval '168 hours'
  ),
  constraint deletion_markers_cancellation_valid check (
    (
      status = 'cancelled'
      and cancelled_at is not null
      and confirmed_at <= cancelled_at
      and cancelled_at < expires_at
    )
    or (status in ('scheduled', 'completed') and cancelled_at is null)
  )
);

create table duocmind.deletion_acknowledgements (
  marker_id uuid not null,
  channel_token uuid not null,
  verification_key bytea not null
    constraint deletion_acknowledgements_key_nonempty check (
      octet_length(verification_key) > 0
    ),
  final_state_acknowledged boolean not null default false,
  constraint deletion_acknowledgements_pkey primary key (marker_id, channel_token),
  constraint deletion_acknowledgements_marker_fkey foreign key (marker_id)
    references duocmind.deletion_markers (marker_id)
    on update no action on delete cascade
);

create table duocmind.deletion_requests (
  user_id uuid not null,
  request_id uuid not null,
  target_kind text not null default 'account'
    constraint deletion_requests_target_valid check (target_kind = 'account'),
  status text not null
    constraint deletion_requests_status_valid check (
      status in ('pending', 'scheduled', 'cancelled', 'completed', 'failed')
    ),
  confirmed_at timestamptz
    constraint deletion_requests_confirmed_at_finite check (
      confirmed_at is null or isfinite(confirmed_at)
    ),
  expires_at timestamptz
    constraint deletion_requests_expires_at_finite check (
      expires_at is null or isfinite(expires_at)
    ),
  cancelled_at timestamptz
    constraint deletion_requests_cancelled_at_finite check (
      cancelled_at is null or isfinite(cancelled_at)
    ),
  marker_id uuid
    constraint deletion_requests_marker_unique unique,
  constraint deletion_requests_pkey primary key (user_id, request_id),
  constraint deletion_requests_account_fkey foreign key (user_id)
    references duocmind.account_state (user_id)
    on update no action on delete no action,
  constraint deletion_requests_marker_fkey foreign key (marker_id)
    references duocmind.deletion_markers (marker_id)
    on update no action on delete set null,
  constraint deletion_requests_state_valid check (
    (
      status = 'pending'
      and confirmed_at is null
      and expires_at is null
      and cancelled_at is null
      and marker_id is null
    )
    or (
      status in ('scheduled', 'failed')
      and confirmed_at is not null
      and expires_at is not null
      and cancelled_at is null
      and marker_id is not null
    )
    or (
      status = 'cancelled'
      and confirmed_at is not null
      and expires_at is not null
      and cancelled_at is not null
    )
    or (
      status = 'completed'
      and confirmed_at is not null
      and expires_at is not null
      and cancelled_at is null
    )
  ),
  constraint deletion_requests_expiry_exact check (
    confirmed_at is null
    or expires_at = confirmed_at + interval '168 hours'
  ),
  constraint deletion_requests_cancellation_valid check (
    cancelled_at is null
    or (
      confirmed_at is not null
      and confirmed_at <= cancelled_at
      and cancelled_at < expires_at
    )
  )
);

create unique index sync_streams_one_active_per_user_idx
  on duocmind.sync_streams (user_id)
  where state in ('recovering', 'ready');

create unique index deletion_requests_one_active_per_user_idx
  on duocmind.deletion_requests (user_id)
  where status in ('pending', 'scheduled', 'failed');

create index account_state_primary_device_idx
  on duocmind.account_state (user_id, primary_device_id)
  where primary_device_id is not null;

create index sync_streams_device_idx
  on duocmind.sync_streams (user_id, device_id);

create index emotion_entries_revision_idx
  on duocmind.emotion_entries (user_id, server_revision, entry_id);

create index deletion_requests_due_idx
  on duocmind.deletion_requests (expires_at, user_id)
  where status in ('scheduled', 'failed');

alter table duocmind.account_state enable row level security;
alter table duocmind.account_devices enable row level security;
alter table duocmind.account_notice_acceptances enable row level security;
alter table duocmind.sync_consents enable row level security;
alter table duocmind.emotion_entries enable row level security;
alter table duocmind.sync_streams enable row level security;
alter table duocmind.sync_receipts enable row level security;
alter table duocmind.control_receipts enable row level security;
alter table duocmind.deletion_markers enable row level security;
alter table duocmind.deletion_acknowledgements enable row level security;
alter table duocmind.deletion_requests enable row level security;

revoke all on all tables in schema duocmind
  from public, anon, authenticated, service_role;
revoke all on all sequences in schema duocmind
  from public, anon, authenticated, service_role;
revoke all on all functions in schema duocmind
  from public, anon, authenticated, service_role;

commit;
