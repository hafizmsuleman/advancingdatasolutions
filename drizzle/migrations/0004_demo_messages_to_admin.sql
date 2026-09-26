create or replace function public.demo_message_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not new.is_demo then
    new.is_demo := coalesce((select is_demo from bookings where id = new.booking_id), false)
                or coalesce((select is_demo from leads where id = new.lead_id), false);
  end if;
  if new.is_demo then new.to_email := 'contact@advancingdatasolutions.com'; end if;
  return new;
end; $$;
revoke all on function public.demo_message_guard() from public, anon, authenticated;

create trigger messages_demo_guard before insert or update on public.messages
for each row execute function public.demo_message_guard();

update public.messages set to_email = 'contact@advancingdatasolutions.com' where is_demo;