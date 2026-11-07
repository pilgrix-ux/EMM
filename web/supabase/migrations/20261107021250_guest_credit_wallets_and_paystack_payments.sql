create table if not exists public.credit_wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.credit_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reference text not null unique,
  customer_email text not null,
  package_id text not null,
  amount_subunit bigint not null check (amount_subunit > 0),
  currency text not null default 'NGN' check (currency = 'NGN'),
  credits integer not null check (credits > 0),
  status text not null default 'pending'
    check (status in ('pending', 'success', 'failed', 'abandoned')),
  provider text not null default 'paystack' check (provider = 'paystack'),
  provider_transaction_id text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists public.credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  credits_delta integer not null check (credits_delta <> 0),
  entry_type text not null check (entry_type in ('purchase', 'usage', 'refund', 'adjustment')),
  reference text unique,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists credit_payments_user_created_idx
  on public.credit_payments (user_id, created_at desc);
create index if not exists credit_ledger_user_created_idx
  on public.credit_ledger (user_id, created_at desc);

alter table public.credit_wallets enable row level security;
alter table public.credit_payments enable row level security;
alter table public.credit_ledger enable row level security;

grant usage on schema public to authenticated;
grant select on public.credit_wallets, public.credit_payments, public.credit_ledger to authenticated;
grant all on public.credit_wallets, public.credit_payments, public.credit_ledger to service_role;

drop policy if exists "Users can view their own credit wallet" on public.credit_wallets;
create policy "Users can view their own credit wallet"
  on public.credit_wallets for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can view their own credit payments" on public.credit_payments;
create policy "Users can view their own credit payments"
  on public.credit_payments for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can view their own credit ledger" on public.credit_ledger;
create policy "Users can view their own credit ledger"
  on public.credit_ledger for select to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.fulfill_credit_purchase(
  p_reference text,
  p_provider_transaction_id text,
  p_amount_subunit bigint,
  p_currency text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payment public.credit_payments%rowtype;
  v_balance integer;
begin
  select * into v_payment
  from public.credit_payments
  where reference = p_reference
  for update;

  if not found then
    raise exception 'Payment reference was not found';
  end if;

  if v_payment.status = 'success' then
    select balance into v_balance
    from public.credit_wallets
    where user_id = v_payment.user_id;
    return jsonb_build_object(
      'fulfilled', false,
      'already_processed', true,
      'balance', coalesce(v_balance, 0)
    );
  end if;

  if v_payment.status <> 'pending'
     or v_payment.amount_subunit <> p_amount_subunit
     or v_payment.currency <> upper(coalesce(p_currency, '')) then
    raise exception 'Payment details do not match the pending purchase';
  end if;

  update public.credit_payments
  set status = 'success',
      provider_transaction_id = p_provider_transaction_id,
      paid_at = now()
  where id = v_payment.id;

  insert into public.credit_wallets (user_id, balance)
  values (v_payment.user_id, v_payment.credits)
  on conflict (user_id) do update
    set balance = public.credit_wallets.balance + excluded.balance,
        updated_at = now()
  returning balance into v_balance;

  insert into public.credit_ledger (
    user_id, credits_delta, entry_type, reference, details
  )
  values (
    v_payment.user_id,
    v_payment.credits,
    'purchase',
    v_payment.reference,
    jsonb_build_object(
      'provider', 'paystack',
      'provider_transaction_id', p_provider_transaction_id,
      'package_id', v_payment.package_id,
      'amount_subunit', v_payment.amount_subunit,
      'currency', v_payment.currency
    )
  );

  return jsonb_build_object(
    'fulfilled', true,
    'already_processed', false,
    'credits_added', v_payment.credits,
    'balance', v_balance
  );
end;
$$;

revoke all on function public.fulfill_credit_purchase(text, text, bigint, text) from public;
revoke all on function public.fulfill_credit_purchase(text, text, bigint, text) from anon;
revoke all on function public.fulfill_credit_purchase(text, text, bigint, text) from authenticated;
grant execute on function public.fulfill_credit_purchase(text, text, bigint, text) to service_role;
